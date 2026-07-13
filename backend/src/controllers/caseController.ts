import mongoose from "mongoose";
import { createAndEmitNotification } from "./notificationController";
import { Response } from "express";
import Case, { ICase } from "../models/Case";
import User from "../models/User";
import Rating from "../models/Rating";
import Notification from "../models/Notification";
import AICasePostSchedule from "../models/AICasePostSchedule";
import { AuthRequest } from "../middleware/auth";
import {
  buildAICaseSchedule,
  getNextAICasePostDate,
} from "../services/aiCasePostingService";
import { analyzeCase } from "../services/aiTaggerService";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";

const canModerateComments = (userType?: string) =>
  ["admin", "doctor", "moderator"].includes(userType ?? "");
const canAddCaseFollowUp = (userType?: string) =>
  ["admin", "doctor", "intern", "hospital_staff"].includes(userType ?? "");
const canModerateCases = (userType?: string) =>
  ["admin", "doctor", "moderator"].includes(userType ?? "");
const publicCaseFilter = {
  $or: [
    { moderationStatus: "approved" },
    { moderationStatus: { $exists: false } },
  ],
};

export const scheduleAICasePost = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user as { _id: string; userType?: string } | undefined;
    if (!user) {
      throw new AppError("User not authenticated", 401);
    }

    const schedulePayload = buildAICaseSchedule(req.body);
    const schedule = await AICasePostSchedule.create({
      author: user._id,
      generatedCase: schedulePayload.generatedCase,
      interval: schedulePayload.interval,
      scheduledFor: schedulePayload.scheduledFor,
      nextRunAt: schedulePayload.scheduledFor,
      reviewStatus: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "AI case draft scheduled for clinical review",
      data: { schedule },
    });
  },
);

export const getMyAICaseSchedules = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user as { _id: string } | undefined;
    if (!user) {
      throw new AppError("User not authenticated", 401);
    }

    const schedules = await AICasePostSchedule.find({
      author: user._id,
      isActive: true,
    })
      .populate("publishedCase", "title createdAt")
      .sort({ nextRunAt: 1 });

    return res.json({
      success: true,
      data: { schedules },
    });
  },
);

export const reviewAICasePost = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user as { _id: string } | undefined;
    const { scheduleId } = req.params;
    const { reviewStatus, reviewNotes } = req.body;

    if (!user) {
      throw new AppError("User not authenticated", 401);
    }

    if (!["approved", "changes_requested", "rejected"].includes(reviewStatus)) {
      throw new AppError(
        "reviewStatus must be approved, changes_requested, or rejected",
        400,
      );
    }

    const schedule = await AICasePostSchedule.findByIdAndUpdate(
      scheduleId,
      {
        reviewStatus,
        reviewNotes:
          typeof reviewNotes === "string" ? reviewNotes.trim() : undefined,
        reviewedBy: user._id,
        reviewedAt: new Date(),
      },
      { new: true, runValidators: true },
    );

    if (!schedule) {
      throw new AppError("AI case schedule not found", 404);
    }

    return res.json({
      success: true,
      message: "AI case review status updated",
      data: { schedule },
    });
  },
);

export const publishDueAICasePosts = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const dueSchedules = await AICasePostSchedule.find({
      isActive: true,
      reviewStatus: "approved",
      nextRunAt: { $lte: new Date() },
    }).limit(10);

    const published = [];
    for (const schedule of dueSchedules) {
      const generatedCase = schedule.generatedCase;
      const publishedCase = await Case.create({
        title: generatedCase.title,
        description: generatedCase.description,
        symptoms: generatedCase.symptoms,
        patientInfo: generatedCase.patientInfo,
        diagnosis: generatedCase.diagnosis,
        treatment: generatedCase.treatment,
        tags: generatedCase.tags,
        difficulty: generatedCase.difficulty,
        specialization: generatedCase.specialization,
        doctor: schedule.author,
        isPatientCase: false,
        moderationStatus: "approved",
        moderationAuditTrail: [
          {
            status: "approved",
            reason: "AI-generated scheduled case approved before publication",
            reviewedBy: schedule.reviewedBy,
            reviewedAt: schedule.reviewedAt ?? new Date(),
          },
        ],
        pointsAwarded: 0,
      });

      schedule.publishedCase = publishedCase._id as any;
      schedule.lastPublishedAt = new Date();
      schedule.nextRunAt = getNextAICasePostDate(
        schedule.nextRunAt,
        schedule.interval,
      );
      await schedule.save();

      published.push(publishedCase);
    }

    return res.json({
      success: true,
      message: "Due AI case drafts published",
      data: {
        count: published.length,
        cases: published,
      },
    });
  },
);

// Reply to a comment
export const replyToComment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user as { _id: string; userType?: string };
    const { caseId, commentId } = req.params;
    const { content } = req.body;
    if (!user) {
      throw new AppError("User not authenticated", 401);
    }
    if (!content || content.trim().length === 0) {
      throw new AppError("Reply content is required", 400);
    }
    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      throw new AppError("Case not found", 404);
    }
    const parentComment = caseDoc.comments.find(
      (c: any) => c._id?.toString() === commentId,
    );
    if (!parentComment) {
      throw new AppError("Comment not found", 404);
    }
    // Prevent duplicate replies
    if (
      caseDoc.comments.some(
        (c: any) =>
          c.author.toString() === user._id.toString() &&
          c.content === content.trim() &&
          c.replyTo?.toString() ===
            (parentComment._id as string | { toString(): string }).toString(),
      )
    ) {
      throw new AppError("Duplicate reply detected", 409);
    }
    // Create reply as a plain object with manual _id assignment
    const reply = {
      author: user._id,
      content: content.trim(),
      likes: [],
      ratedBy: [],
      replies: [],
      replyTo: parentComment._id,
      createdAt: new Date(),
      updatedAt: new Date(),
      _id: new mongoose.Types.ObjectId(),
    };
    caseDoc.comments.push(reply as any);
    parentComment.replies.push(reply._id as any);
    await caseDoc.save();

    // Send notification to comment author if not replying to own comment
    if (parentComment.author.toString() !== user._id.toString()) {
      await Notification.create({
        recipient: parentComment.author,
        message: `Someone replied to your comment: "${parentComment.content}"`,
        type: "reply",
        link: `/cases/${caseId}`,
      });
    }

    res
      .status(201)
      .json({
        success: true,
        message: "Reply added successfully",
        data: { reply },
      });
  },
);

// Like a comment
export const likeComment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user as { _id: string };
    const { caseId, commentId } = req.params;
    if (!user) {
      throw new AppError("User not authenticated", 401);
    }

    const userIdObj = new mongoose.Types.ObjectId(user._id);

    // Atomically toggle: try pull first (unlike)
    let liked = false;
    const pullResult = await Case.updateOne(
      { _id: caseId, "comments._id": commentId },
      { $pull: { "comments.$.likes": userIdObj } },
    );

    if (pullResult.modifiedCount === 0) {
      // Not already liked, so add the like
      await Case.updateOne(
        { _id: caseId, "comments._id": commentId },
        { $addToSet: { "comments.$.likes": userIdObj } },
      );
      liked = true;
    }

    // Fetch updated like count
    const updatedCase = await Case.findById(caseId, {
      comments: { $elemMatch: { _id: commentId } },
    });
    const likes = ((updatedCase?.comments as any)?.[0]?.likes as any[])?.length ?? 0;

    res.json({
      success: true,
      message: liked ? "Comment liked" : "Comment unliked",
      data: { likes, liked },
    });
  },
);

// Rate a comment
export const rateComment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user as { _id: string };
    const { caseId, commentId } = req.params;
    const { rating } = req.body;
    if (!user) {
      throw new AppError("User not authenticated", 401);
    }
    if (!rating || rating < 1 || rating > 5) {
      throw new AppError("Rating must be between 1 and 5", 400);
    }

    // Verify case and comment exist
    const caseDoc = await Case.findById(caseId, {
      comments: { $elemMatch: { _id: commentId } },
    });
    if (!caseDoc) {
      throw new AppError("Case not found", 404);
    }
    if (!(caseDoc.comments as any)?.[0]) {
      throw new AppError("Comment not found", 404);
    }

    const userIdObj = new mongoose.Types.ObjectId(user._id);
    const commentIdObj = new mongoose.Types.ObjectId(commentId);

    // Use Rating model (unique compound index on {rater, commentId}) as source of truth
    const existingRating = await Rating.findOne({
      rater: userIdObj,
      commentId: commentIdObj,
    });

    let rated = false;
    if (existingRating) {
      // Unrate: remove the Rating document and denormalized reference
      await Rating.deleteOne({ _id: existingRating._id });
      await Case.updateOne(
        { _id: caseId, "comments._id": commentId },
        { $pull: { "comments.$.ratedBy": userIdObj } },
      );
      rated = false;
    } else {
      // Rate: upsert with unique index guard against duplicates
      try {
        await Rating.create({
          rater: userIdObj,
          commentId: commentIdObj,
          caseId: new mongoose.Types.ObjectId(caseId),
          rating,
        });
      } catch (err: any) {
        if (err.code === 11000) {
          throw new AppError("Already rated this comment", 409);
        }
        throw err;
      }
      await Case.updateOne(
        { _id: caseId, "comments._id": commentId },
        { $addToSet: { "comments.$.ratedBy": userIdObj } },
      );
      rated = true;
    }

    // Compute average rating via aggregation from the Rating collection
    const aggResult = await Rating.aggregate([
      { $match: { commentId: commentIdObj } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);

    const avgRating =
      aggResult.length > 0 ? Math.round(aggResult[0].avg) : undefined;
    const ratedByCount = aggResult.length > 0 ? aggResult[0].count : 0;

    // Update denormalized rating in comment
    await Case.updateOne(
      { _id: caseId, "comments._id": commentId },
      { $set: { "comments.$.rating": avgRating ?? null } },
    );

    res.json({
      success: true,
      message: rated ? "Comment rated" : "Comment unrated",
      data: {
        rating: avgRating,
        ratedBy: ratedByCount,
        rated,
      },
    });
  },
);

// Create a new case (Doctor only)
export const createCase = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user as {
      _id: string;
      userType: string;
      specialization?: string;
    };

    if (!user) {
      throw new AppError("User not authenticated", 401);
    }

    if (user.userType !== "doctor" && user.userType !== "patient") {
      throw new AppError("Only doctors and patients can create cases", 403);
    }

    const {
      title,
      description,
      patientInfo,
      images,
      specialization,
    } = req.body;

    const spec = specialization || user.specialization || "General Medicine";

    // Run the AI tagger
    const aiAnalysis = await analyzeCase(title, description, spec);

    // Restrict patient case creation
    if (user.userType === "patient") {
      const newCase = new Case({
        title,
        description,
        symptoms: aiAnalysis.symptoms,
        patientInfo: patientInfo || {},
        diagnosis: aiAnalysis.diagnosis,
        treatment: aiAnalysis.treatment,
        images: images || [],
        tags: aiAnalysis.tags,
        difficulty: aiAnalysis.difficulty,
        specialization: aiAnalysis.specialty || spec,
        doctor: user._id as any,
        isPatientCase: true,
        moderationStatus: "pending",
        moderationAuditTrail: [
          {
            status: "pending",
            reason: "Patient-submitted case awaiting review",
            reviewedAt: new Date(),
          },
        ],
      });

      await newCase.save();
      await newCase.populate("doctor", "firstName lastName");

      // Patients get fewer points for posting
      const pointsForCase = 5;
      await User.findByIdAndUpdate(user._id, {
        $inc: { points: pointsForCase },
      });

      return res.status(201).json({
        success: true,
        message: "Patient case created successfully",
        data: {
          case: newCase,
          pointsAwarded: pointsForCase,
        },
      });
    }

    // Doctor case creation (full features)
    const newCase = new Case({
      title,
      description,
      symptoms: aiAnalysis.symptoms,
      patientInfo: patientInfo || {},
      diagnosis: aiAnalysis.diagnosis,
      treatment: aiAnalysis.treatment,
      images: images || [],
      tags: aiAnalysis.tags,
      difficulty: aiAnalysis.difficulty,
      specialization: aiAnalysis.specialty || spec,
      doctor: user._id as any,
      isPatientCase: false,
      moderationStatus: "approved",
      moderationAuditTrail: [
        {
          status: "approved",
          reason: "Doctor-authored case published automatically",
          reviewedBy: user._id as any,
          reviewedAt: new Date(),
        },
      ],
    });

    await newCase.save();
    await newCase.populate("doctor", "firstName lastName specialization");

    // Award points to doctor for posting case
    const pointsForCase = 10; // Base points for posting a case
    await User.findByIdAndUpdate(user._id, { $inc: { points: pointsForCase } });

    await Case.findByIdAndUpdate(newCase._id, { pointsAwarded: pointsForCase });

    res.status(201).json({
      success: true,
      message: "Case created successfully",
      data: {
        case: newCase,
        pointsAwarded: pointsForCase,
      },
    });
  },
);

// Get all cases with filters
export const getCases = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const {
      specialization,
      difficulty,
      tags,
      doctor,
      page = 1,
      limit = 10,
      search,
      sortBy = "newest",
    } = req.query;

    const filter: any = { isActive: true, $and: [publicCaseFilter] };

    if (specialization) {
      filter.specialization = { $regex: specialization, $options: "i" };
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }

    if (doctor) {
      filter.doctor = doctor;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search as string, "i")] } },
      ];
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    let cases;
    if (sortBy === "most_discussed") {
      cases = await Case.aggregate([
        { $match: filter },
        { $addFields: { commentCount: { $size: { $ifNull: ["$comments", []] } } } },
        { $sort: { commentCount: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limitNum }
      ]);
      cases = await Case.populate(cases, [
        { path: "doctor", select: "firstName lastName specialization" },
        { path: "comments.author", select: "firstName lastName userType" }
      ]);
    } else {
      let sortObj: any = { createdAt: -1 };
      if (sortBy === "highest_rated") {
        sortObj = { pointsAwarded: -1, createdAt: -1 };
      }
      cases = await Case.find(filter)
        .populate("doctor", "firstName lastName specialization")
        .populate("comments.author", "firstName lastName userType")
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum);
    }

    const total = await Case.countDocuments(filter);

    res.json({
      success: true,
      data: {
        cases,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  },
);

// Get single case by ID
export const getCaseById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const caseData = await Case.findById(id)
      .populate("doctor", "firstName lastName specialization")
      .populate("comments.author", "firstName lastName userType")
      .populate("likes", "firstName lastName");

    if (!caseData) {
      throw new AppError("Case not found", 404);
    }

    if (!caseData.isActive) {
      throw new AppError("Case is no longer available", 404);
    }
    const user = req.user as { _id?: string; userType?: string } | undefined;
    const isOwner =
      user?._id && caseData.doctor.toString() === user._id.toString();
    const isApproved =
      !caseData.moderationStatus || caseData.moderationStatus === "approved";
    if (!isApproved && !isOwner && !canModerateCases(user?.userType)) {
      throw new AppError("Case is awaiting moderation", 404);
    }

    const caseObj = caseData.toObject();
    if (!user || !canModerateComments(user.userType)) {
      caseObj.comments = caseObj.comments.filter(
        (c: any) => c.moderationStatus !== 'pending'
      );
    }

    res.json({
      success: true,
      data: {
        case: caseObj,
      },
    });
  },
);

// Update case (Doctor who created it only)
export const updateCase = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user as { _id: string; userType: string };
    const { id } = req.params;

    if (!user) {
      throw new AppError("User not authenticated", 401);
    }

    const caseData = await Case.findById(id);

    if (!caseData) {
      throw new AppError("Case not found", 404);
    }

    if (caseData.doctor.toString() !== user._id?.toString()) {
      throw new AppError("You can only update your own cases", 403);
    }

    const updates = req.body;
    delete updates.doctor; // Prevent changing the doctor
    delete updates.comments; // Comments are handled separately
    delete updates.likes; // Likes are handled separately
    delete updates.moderationStatus; // Moderation is handled through dedicated endpoints
    delete updates.moderationReason;
    delete updates.reviewedBy;
    delete updates.reviewedAt;
    delete updates.moderationAuditTrail;

    const updatedCase = await Case.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate("doctor", "firstName lastName specialization");

    res.json({
      success: true,
      message: "Case updated successfully",
      data: {
        case: updatedCase,
      },
    });
  },
);

// Delete case (Doctor who created it only)
export const deleteCase = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      throw new AppError("User not authenticated", 401);
    }

    const caseData = await Case.findById(id);

    if (!caseData) {
      throw new AppError("Case not found", 404);
    }

    if (caseData.doctor.toString() !== user._id?.toString()) {
      throw new AppError("You can only delete your own cases", 403);
    }

    // Soft delete
    await Case.findByIdAndUpdate(id, { isActive: false });

    res.json({
      success: true,
      message: "Case deleted successfully",
    });
  },
);

// Add comment to case
export const addComment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user as {
      _id: string | { toString(): string };
      userType?: string;
    };
    const { id } = req.params;
    const { content, replyTo } = req.body;

    if (!user) {
      throw new AppError("User not authenticated", 401);
    }
    if (!content || content.trim().length === 0) {
      throw new AppError("Comment content is required", 400);
    }
    const caseData = await Case.findById(id);
    if (!caseData) {
      throw new AppError("Case not found", 404);
    }
    if (!caseData.isActive) {
      throw new AppError("Case is no longer available", 404);
    }
    // Prevent duplicate comments by same user with same content
    if (
      caseData.comments.some(
        (c: any) =>
          c.author.toString() === user._id.toString() &&
          c.content === content.trim(),
      )
    ) {
      throw new AppError("Duplicate comment detected", 409);
    }
    const newComment: any = {
      author: user._id as any,
      content: content.trim(),
      likes: [],
      ratedBy: [],
      replies: [],
      replyTo: replyTo ? replyTo : undefined,
    };
    caseData.comments.push(newComment);
    await caseData.save();
    await caseData.populate("comments.author", "firstName lastName userType");
    const addedComment = caseData.comments[caseData.comments.length - 1];

    // Notify case owner if commenter is a different user
    const caseAuthorId = (caseData as any).author?.toString();
    if (caseAuthorId && caseAuthorId !== user._id.toString()) {
      await createAndEmitNotification({
        recipientId: caseAuthorId,
        type: "comment",
        message: `Someone commented on your case: "${(caseData as any).title}"`,
        link: `/cases/${id}`,
        payload: { caseId: id, commentId: addedComment._id },
      });
    }

    res
      .status(201)
      .json({
        success: true,
        message: "Comment added successfully",
        data: { comment: addedComment },
      });
  },
);

// Pin a comment (doctor only)
export const pinComment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { caseId, commentId } = req.params;
    const user = req.user;
    if (!user) {
      throw new AppError("User not authenticated", 401);
    }
    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      throw new AppError("Case not found", 404);
    }
    const comment = caseDoc.comments.find(
      (c: any) => c._id?.toString() === commentId,
    );
    if (!comment) {
      throw new AppError("Comment not found", 404);
    }
    // Moderation roles can pin any comment; other permitted users can pin their own.
    if (
      canModerateComments(user.userType) ||
      comment.author?.toString() === user._id?.toString()
    ) {
      comment.pinned = true;
      await caseDoc.save();
      return res.json({ success: true, comment });
    } else {
      throw new AppError("You can only pin your own comments.", 403);
    }
  },
);

// Unpin a comment (doctor only)
export const unpinComment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { caseId, commentId } = req.params;
    const user = req.user;
    if (!user || !canModerateComments(user.userType)) {
      throw new AppError("Only comment moderators can unpin comments", 403);
    }
    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      throw new AppError("Case not found", 404);
    }
    const comment = caseDoc.comments.find(
      (c: any) => c._id?.toString() === commentId,
    );
    if (!comment) {
      throw new AppError("Comment not found", 404);
    }
    comment.pinned = false;
    await caseDoc.save();
    res.json({ success: true, comment });
  },
);

// Get all pinned comments for a case
export const getPinnedComments = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { caseId } = req.params;
    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      throw new AppError("Case not found", 404);
    }
    const pinnedComments = caseDoc.comments.filter((c: any) => c.pinned);
    res.json({ success: true, pinnedComments });
  },
);

// Toggle repost permission (case owner only)
export const toggleRepostPermission = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const user = req.user;
    const caseDoc = await Case.findById(id);
    if (!caseDoc) {
      throw new AppError("Case not found", 404);
    }
    if (
      !user ||
      caseDoc.doctor.toString() !== (user._id as string).toString()
    ) {
      throw new AppError("Not authorized", 403);
    }
    caseDoc.canRepost = !caseDoc.canRepost;
    await caseDoc.save();
    res.json({ success: true, canRepost: caseDoc.canRepost });
  },
);

// Repost a case (if allowed)
export const repostCase = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const user = req.user;
    const caseDoc = await Case.findById(id);
    if (!caseDoc || !caseDoc.canRepost) {
      throw new AppError("Repost not allowed", 403);
    }
    // Duplicate case logic (simplified)
    const newCase = new Case({
      ...caseDoc.toObject(),
      _id: undefined,
      doctor: user?._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await newCase.save();
    res.json({ success: true, case: newCase });
  },
);

// Like/Unlike case
export const toggleLike = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      throw new AppError("User not authenticated", 401);
    }

    const caseData = await Case.findById(id);

    if (!caseData) {
      throw new AppError("Case not found", 404);
    }

    if (!caseData.isActive) {
      throw new AppError("Case is no longer available", 404);
    }

    const userIdString = user._id?.toString();
    const likeIndex = caseData.likes.findIndex(
      (like) => like.toString() === userIdString,
    );

    let isLiked = false;

    if (likeIndex > -1) {
      // Unlike
      caseData.likes.splice(likeIndex, 1);
      isLiked = false;
    } else {
      // Like
      caseData.likes.push(user._id as any);
      isLiked = true;
    }

    await caseData.save();

    res.json({
      success: true,
      message: isLiked
        ? "Case liked successfully"
        : "Case unliked successfully",
      data: {
        isLiked,
        totalLikes: caseData.likes.length,
      },
    });
  },
);
// Get cases liked by the current user (for profile "Liked Items" section)
export const getLikedCases = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user as { _id: string } | undefined;
    if (!user) {
      throw new AppError("User not authenticated", 401);
    }

    const cases = await Case.find({ likes: user._id, isActive: true })
      .populate("doctor", "firstName lastName specialization")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { cases },
    });
  },
);

// Get cases by current doctor
export const getMyCases = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user;

    if (!user) {
      throw new AppError("User not authenticated", 401);
    }

    if (user.userType !== "doctor") {
      throw new AppError("Only doctors can view their cases", 403);
    }

    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const cases = await Case.find({ doctor: user._id as any, isActive: true })
      .populate("comments.author", "firstName lastName userType")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Case.countDocuments({
      doctor: user._id as any,
      isActive: true,
    });

    res.json({
      success: true,
      data: {
        cases,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  },
);

// Get moderation queue counts and pending items
export const getCaseModerationQueue = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user as { userType?: string };
    if (!canModerateCases(user?.userType)) {
      throw new AppError(
        "Only moderators, admins, and doctors can review case submissions",
        403,
      );
    }

    const { status = "pending", page = 1, limit = 10 } = req.query;
    const allowedStatuses = [
      "pending",
      "approved",
      "rejected",
      "changes_requested",
    ];
    const queueStatus = allowedStatuses.includes(status as string)
      ? (status as string)
      : "pending";
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(
      50,
      Math.max(1, parseInt(limit as string, 10) || 10),
    );
    const skip = (pageNum - 1) * limitNum;

    const filter = { isActive: true, moderationStatus: queueStatus };
    const [cases, total, counts] = await Promise.all([
      Case.find(filter)
        .populate("doctor", "firstName lastName userType specialization")
        .populate("reviewedBy", "firstName lastName userType")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Case.countDocuments(filter),
      Case.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$moderationStatus", count: { $sum: 1 } } },
      ]),
    ]);

    const queueCounts = counts.reduce(
      (acc: Record<string, number>, item: { _id?: string; count: number }) => {
        acc[item._id || "approved"] = item.count;
        return acc;
      },
      {
        pending: 0,
        approved: 0,
        rejected: 0,
        changes_requested: 0,
      },
    );

    res.json({
      success: true,
      data: {
        cases,
        counts: queueCounts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  },
);

// Approve, reject, or request changes for a case before public publishing
export const moderateCase = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user as { _id: string; userType?: string };
    if (!canModerateCases(user?.userType)) {
      throw new AppError(
        "Only moderators, admins, and doctors can review case submissions",
        403,
      );
    }

    const { id } = req.params;
    const { status, reason } = req.body;
    const allowedStatuses = [
      "pending",
      "approved",
      "rejected",
      "changes_requested",
    ];

    if (!allowedStatuses.includes(status)) {
      throw new AppError(
        "Status must be pending, approved, rejected, or changes_requested",
        400,
      );
    }

    if (
      (status === "rejected" || status === "changes_requested") &&
      !reason?.trim()
    ) {
      throw new AppError(
        "A review reason is required when rejecting or requesting changes",
        400,
      );
    }

    const reviewedAt = new Date();
    const updatedCase = await Case.findByIdAndUpdate(
      id,
      {
        moderationStatus: status,
        moderationReason: reason?.trim() || undefined,
        reviewedBy: user._id as any,
        reviewedAt,
        $push: {
          moderationAuditTrail: {
            status,
            reason: reason?.trim() || undefined,
            reviewedBy: user._id as any,
            reviewedAt,
          },
        },
      },
      { new: true, runValidators: true },
    )
      .populate("doctor", "firstName lastName userType specialization")
      .populate("reviewedBy", "firstName lastName userType");

    if (!updatedCase) {
      throw new AppError("Case not found", 404);
    }

    res.json({
      success: true,
      message: `Case ${status.replace("_", " ")} successfully`,
      data: {
        case: updatedCase,
      },
    });
  },
);

// Add follow-up to case
export const addFollowUp = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { content, outcome, images } = req.body;
    const user = req.user!;

    const caseData = await Case.findById(id);
    if (!caseData) {
      throw new AppError("Case not found", 404);
    }

    // Original authors and roles with follow-up permission can add follow-ups.
    const userIdString = (user._id as any).toString();
    const canAddFollowUp =
      caseData.doctor.toString() === userIdString ||
      canAddCaseFollowUp(user.userType);

    if (!canAddFollowUp) {
      throw new AppError(
        "Only the case author or permitted care team members can add follow-ups",
        403,
      );
    }

    const followUp = {
      author: user._id as any,
      content,
      outcome,
      images: images || [],
      createdAt: new Date(),
    };

    caseData.followUps.push(followUp);
    await caseData.save();

    await caseData.populate([
      { path: "doctor", select: "firstName lastName specialization" },
      { path: "followUps.author", select: "firstName lastName userType" },
    ]);

    res.json({
      success: true,
      message: "Follow-up added successfully",
      data: { case: caseData },
    });
  },
);

// Get case follow-ups
export const getCaseFollowUps = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const caseData = await Case.findById(id)
      .select("followUps")
      .populate(
        "followUps.author",
        "firstName lastName userType profilePicture",
      );

    if (!caseData) {
      throw new AppError("Case not found", 404);
    }

    res.json({
      success: true,
      data: {
        followUps: caseData.followUps,
        total: caseData.followUps.length,
      },
    });
  },
);

// Generate AI case suggestions (placeholder for AI integration)
export const generateAISuggestions = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const caseData = await Case.findById(id);
    if (!caseData) {
      throw new AppError("Case not found", 404);
    }

    // Simple similarity-based suggestion algorithm
    // In production, this would use AI/ML algorithms
    const similarCases = await Case.find({
      _id: { $ne: id },
      isActive: true,
      $and: [
        publicCaseFilter,
        {
          $or: [
            { specialization: caseData.specialization },
            { difficulty: caseData.difficulty },
            { tags: { $in: caseData.tags } },
          ],
        },
      ],
    })
      .select("title description specialization difficulty tags")
      .limit(5)
      .sort({ createdAt: -1 });

    // Update case with AI suggestions
    caseData.aiSuggestions = {
      suggestedCases: similarCases.map((c) => c._id) as any,
      relevanceScore: 0.8, // Placeholder score
      lastUpdated: new Date(),
    };

    await caseData.save();

    res.json({
      success: true,
      message: "AI suggestions generated successfully",
      data: {
        suggestions: similarCases,
        relevanceScore: caseData.aiSuggestions?.relevanceScore || 0.8,
      },
    });
  },
);

// Get AI suggestions for case
export const getCaseAISuggestions = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const caseData = await Case.findById(id).populate(
      "aiSuggestions.suggestedCases",
      "title description specialization difficulty tags createdAt",
    );

    if (!caseData) {
      throw new AppError("Case not found", 404);
    }

    res.json({
      success: true,
      data: {
        suggestions: caseData.aiSuggestions?.suggestedCases || [],
        relevanceScore: caseData.aiSuggestions?.relevanceScore || 0,
        lastUpdated: caseData.aiSuggestions?.lastUpdated,
      },
    });
  },
);

// Mark a case as solved
export const solveCase = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const user = req.user as { _id: string } | undefined;

    if (!user) {
      throw new AppError("User not authenticated", 401);
    }

    const caseData = await Case.findById(id);
    if (!caseData) {
      throw new AppError("Case not found", 404);
    }

    if (!caseData.isActive) {
      throw new AppError("Case is no longer active", 400);
    }

    const userDoc = await User.findById(user._id);
    if (!userDoc) {
      throw new AppError("User not found", 404);
    }

    // Check if already solved
    const solvedList = userDoc.solvedCases || [];
    const isAlreadySolved = solvedList.some(
      (caseId) => caseId.toString() === id.toString()
    );

    if (isAlreadySolved) {
      return res.json({
        success: true,
        message: "Case is already marked as solved",
        data: {
          pointsAwarded: 0,
          casesAnalyzed: userDoc.casesAnalyzed
        }
      });
    }

    // Update user history
    userDoc.solvedCases = [...solvedList, caseData._id as any];
    userDoc.casesAnalyzed = (userDoc.casesAnalyzed || 0) + 1;
    
    // Award 5 points for solving
    const pointsAwarded = 5;
    userDoc.points = (userDoc.points || 0) + pointsAwarded;
    await userDoc.save();

    res.json({
      success: true,
      message: "Case successfully marked as solved!",
      data: {
        pointsAwarded,
        casesAnalyzed: userDoc.casesAnalyzed
      }
    });
  }
);

// Get personalized case recommendations for a logged-in user
export const getRecommendedCases = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user as { _id: string } | undefined;
    if (!user) {
      throw new AppError("User not authenticated", 401);
    }

    const userDoc = await User.findById(user._id).populate("solvedCases");
    if (!userDoc) {
      throw new AppError("User not found", 404);
    }

    const solvedCases = userDoc.solvedCases || [];

    if (solvedCases.length === 0) {
      return res.json({
        success: true,
        message: "Solve a few cases to get personalised recommendations.",
        data: {
          cases: []
        }
      });
    }

    // Build frequency map from all solved-case tags
    const frequencyMap: Record<string, number> = {};
    for (const solvedCase of solvedCases) {
      const tags = (solvedCase as any).tags || [];
      for (const tag of tags) {
        if (tag) {
          const normalizedTag = tag.trim().toLowerCase();
          frequencyMap[normalizedTag] = (frequencyMap[normalizedTag] || 0) + 1;
        }
      }
    }

    const solvedIds = solvedCases.map(c => c._id.toString());

    // Candidates: Unsolved cases, active, approved, not created by user
    const candidates = await Case.find({
      _id: { $nin: solvedIds },
      doctor: { $ne: user._id },
      isActive: true,
      moderationStatus: "approved"
    }).populate("doctor", "firstName lastName specialization");

    // Compute overlap score
    const scoredCandidates = candidates.map(c => {
      let score = 0;
      const tags = c.tags || [];
      for (const tag of tags) {
        if (tag) {
          const normalizedTag = tag.trim().toLowerCase();
          if (frequencyMap[normalizedTag]) {
            score += frequencyMap[normalizedTag];
          }
        }
      }
      return { caseDoc: c, score };
    });

    // Sort by score descending
    scoredCandidates.sort((a, b) => b.score - a.score);

    // Limit to top 6 recommendations
    const recommendedCases = scoredCandidates.slice(0, 6).map(item => item.caseDoc);

    res.json({
      success: true,
      data: {
        cases: recommendedCases
      }
    });
  }
);

// Get comment moderation queue (flagged comments)
export const getFlaggedComments = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user as { userType?: string };
    if (!canModerateComments(user?.userType)) {
      throw new AppError(
        "Only moderators, admins, and doctors can view the comment moderation queue",
        403,
      );
    }

    // Find cases that have comments with isFlagged: true
    const casesWithFlaggedComments = await Case.find({
      "comments.isFlagged": true,
      isActive: true,
    })
      .populate("comments.author", "firstName lastName userType")
      .populate("doctor", "firstName lastName");

    // Extract all flagged comments with case details
    const flaggedComments: any[] = [];
    for (const c of casesWithFlaggedComments) {
      for (const comment of c.comments) {
        if (comment.isFlagged && comment.moderationStatus === "pending") {
          flaggedComments.push({
            caseId: c._id,
            caseTitle: c.title,
            comment: comment,
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        comments: flaggedComments,
      },
    });
  },
);

// Moderate a flagged comment
export const moderateComment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user as { userType?: string };
    if (!canModerateComments(user?.userType)) {
      throw new AppError(
        "Only moderators, admins, and doctors can moderate comments",
        403,
      );
    }

    const { caseId, commentId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!["approved", "rejected"].includes(status)) {
      throw new AppError("Status must be approved or rejected", 400);
    }

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      throw new AppError("Case not found", 404);
    }

    const comment = caseDoc.comments.find(
      (c: any) => c._id?.toString() === commentId,
    );
    if (!comment) {
      throw new AppError("Comment not found", 404);
    }

    comment.moderationStatus = status;
    if (status === "approved") {
      comment.isFlagged = false;
    } else {
      comment.content = "[Removed by moderator]";
      comment.isFlagged = false;
    }

    await caseDoc.save();

    res.json({
      success: true,
      message: `Comment successfully ${status}`,
      data: { comment },
    });
  },
);
