import mongoose from "mongoose";
import { createAndEmitNotification } from "./notificationController";
import { Response } from "express";
import Case from "../models/Case";
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
import { uploadCaseAttachment } from "../utils/cloudinary";

const getId = (id: string | string[]): string => Array.isArray(id) ? id[0] : id;
const canModerateComments = (userType?: string) => ["admin", "doctor", "moderator"].includes(userType ?? "");
const canAddCaseFollowUp = (userType?: string) => ["admin", "doctor", "intern", "hospital_staff"].includes(userType ?? "");
const canModerateCases = (userType?: string) => ["admin", "doctor", "moderator"].includes(userType ?? "");

const CASE_UPDATABLE_FIELDS = [
  "title",
  "description",
  "symptoms",
  "patientInfo",
  "diagnosis",
  "treatment",
  "images",
  "attachments",
  "tags",
  "difficulty",
  "specialization",
  "isRareDisease",
  "verifiedDoctorsOnly",
] as const;

// Get all approved cases with filtering capability
export const getCases = asyncHandler(async (req: AuthRequest, res: Response) => {
  const filter: any = {
    isActive: { $ne: false },
    $or: [
      { moderationStatus: "approved" },
      { moderationStatus: { $exists: false } },
    ],
  };

  if (req.query.specialization) {
    filter.specialization = { $regex: String(req.query.specialization), $options: "i" };
  }
  if (req.query.difficulty) {
    filter.difficulty = req.query.difficulty;
  }
  if (req.query.isRareDisease !== undefined) {
    filter.isRareDisease = String(req.query.isRareDisease) === "true";
  }

  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.max(1, parseInt(String(req.query.limit ?? "10"), 10) || 10);
  const skip = (page - 1) * limit;

  const [cases, total] = await Promise.all([
    Case.find(filter)
      .populate("doctor", "firstName lastName specialization avatar medicalLicenseVerified")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Case.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      cases,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// Get a single case by ID
export const getCaseById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const baseFilter = {
    isActive: { $ne: false },
    $or: [
      { moderationStatus: "approved" },
      { moderationStatus: { $exists: false } },
    ],
  };

  const caseDoc = await Case.findOne({
    _id: getId(req.params.id),
    ...baseFilter,
  })
    .populate("doctor", "firstName lastName specialization avatar medicalLicenseVerified")
    .populate("comments.author", "firstName lastName userType avatar medicalLicenseVerified")
    .populate("followUps.author", "firstName lastName userType avatar");

  if (!caseDoc) {
    throw new AppError("Case not found or not approved", 404);
  }
  res.json({ success: true, data: { case: caseDoc } });
});

// Update a case
export const updateCase = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new AppError("User not authenticated", 401);
  }
  const caseDoc = await Case.findById(getId(req.params.id));
  if (!caseDoc) {
    throw new AppError("Case not found", 404);
  }
  if ((caseDoc as any).doctor?.toString() !== user._id!.toString() && user.userType !== "admin") {
    throw new AppError("You can only update your own cases", 403);
  }

  const updates: any = {};
  for (const field of CASE_UPDATABLE_FIELDS) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const updatedCase = await Case.findByIdAndUpdate(
    getId(req.params.id),
    updates,
    { new: true, runValidators: true }
  ).populate("doctor", "firstName lastName specialization");

  res.json({ success: true, message: "Case updated successfully", data: { case: updatedCase } });
});

// Delete a case (soft delete)
export const deleteCase = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new AppError("User not authenticated", 401);
  }
  const caseDoc = await Case.findById(getId(req.params.id));
  if (!caseDoc) {
    throw new AppError("Case not found", 404);
  }
  if ((caseDoc as any).doctor?.toString() !== user._id!.toString() && user.userType !== "admin") {
    throw new AppError("You can only delete your own cases", 403);
  }

  await Case.findByIdAndUpdate(getId(req.params.id), { isActive: false });
  res.json({ success: true, message: "Case deleted successfully" });
});

// Get user's own cases
export const getMyCases = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new AppError("User not authenticated", 401);
  }
  const cases = await Case.find({ doctor: user._id, isActive: { $ne: false } }).sort({ createdAt: -1 });
  res.json({ success: true, data: { cases } });
});

// Like / Unlike toggle logic
export const toggleLike = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new AppError("User not authenticated", 401);
  }
  const caseDoc = await Case.findById(getId(req.params.id));
  if (!caseDoc) {
    throw new AppError("Case not found", 404);
  }
  const userIdStr = user._id!.toString();
  const likesArray = ((caseDoc as any).likes || []) as any[];
  const hasLiked = likesArray.some((id: any) => id.toString() === userIdStr);

  if (hasLiked) {
    await Case.findByIdAndUpdate(caseDoc._id, { $pull: { likes: user._id } });
  } else {
    await Case.findByIdAndUpdate(caseDoc._id, { $addToSet: { likes: user._id } });
  }

  const updatedCase = await Case.findById(caseDoc._id);
  res.json({
    success: true,
    message: hasLiked ? "Case unliked" : "Case liked",
    data: { likesCount: ((updatedCase as any).likes || []).length, hasLiked: !hasLiked },
  });
});

// Star / Unstar toggle logic
export const toggleStar = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new AppError("User not authenticated", 401);
  }
  const caseDoc = await Case.findById(getId(req.params.id));
  if (!caseDoc) {
    throw new AppError("Case not found", 404);
  }

  const userDoc = await User.findById(user._id);
  const savedCases = ((userDoc as any)?.savedCases || []) as any[];
  const hasStarred = savedCases.some((id: any) => id.toString() === (caseDoc as any)._id?.toString());

  if (hasStarred) {
    await User.findByIdAndUpdate(user._id, { $pull: { savedCases: caseDoc._id } });
  } else {
    await User.findByIdAndUpdate(user._id, { $addToSet: { savedCases: caseDoc._id } });
  }

  res.json({
    success: true,
    message: hasStarred ? "Case unstarred" : "Case starred",
    data: { hasStarred: !hasStarred },
  });
});

export const getStarredCases = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new AppError("User not authenticated", 401);
  }
  const baseFilter = {
    isActive: { $ne: false },
    $or: [
      { moderationStatus: "approved" },
      { moderationStatus: { $exists: false } },
    ],
  };
  const userDoc = await User.findById(user._id).populate({
    path: "savedCases",
    match: baseFilter,
    populate: { path: "doctor", select: "firstName lastName specialization avatar" },
  });
  res.json({ success: true, data: { cases: (userDoc as any)?.savedCases || [] } });
});

export const getLikedCases = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new AppError("User not authenticated", 401);
  }
  const baseFilter = {
    isActive: { $ne: false },
    $or: [
      { moderationStatus: "approved" },
      { moderationStatus: { $exists: false } },
    ],
  };
  const cases = await Case.find({ likes: user._id, ...baseFilter })
    .populate("doctor", "firstName lastName specialization avatar");
  res.json({ success: true, data: { cases } });
});

// Add comment (w/ notification & corrected error signature)
export const addComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  const { content } = req.body;
  if (!user) {
    throw new AppError("User not authenticated", 401);
  }
  if (!content?.trim()) {
    throw new AppError("Comment content is required", 400);
  }
  const caseDoc = await Case.findById(getId(req.params.id));
  if (!caseDoc) {
    throw new AppError("Case not found", 404);
  }

  const alreadyExists = caseDoc.comments.some(
    (c: any) => c.author.toString() === user._id!.toString() && c.content === content.trim()
  );
  if (alreadyExists) {
    throw new AppError("Duplicate comment detected", 400);
  }

  const newComment = {
    _id: new mongoose.Types.ObjectId(),
    author: user._id,
    content: content.trim(),
    likes: [],
    ratedBy: [],
    replies: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  caseDoc.comments.push(newComment as any);
  await caseDoc.save();

  const doctorField = (caseDoc as any).doctor;
  const doctorId = doctorField?._id ? doctorField._id.toString() : doctorField?.toString();

  if (doctorId) {
    await createAndEmitNotification({
      recipientId: doctorId,
      type: "comment",
      message: `${user.firstName || "Someone"} commented on your case.`,
      link: `/cases/${caseDoc._id}`,
    });
  }

  res.status(201).json({ success: true, message: "Comment added", data: { comment: newComment } });
});

// Pin / Unpin comment management
export const pinComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  const { caseId, commentId } = req.params;
  if (!user) throw new AppError("User not authenticated", 401);

  const caseDoc = await Case.findById(getId(caseId));
  if (!caseDoc) throw new AppError("Case not found", 404);
  if ((caseDoc as any).doctor?.toString() !== user._id!.toString()) {
    throw new AppError("Only the case author can pin comments", 403);
  }

  await Case.updateOne(
    { _id: getId(caseId), "comments._id": getId(commentId) },
    { $set: { "comments.$.isPinned": true } }
  );
  res.json({ success: true, message: "Comment pinned successfully" });
});

export const unpinComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  const { caseId, commentId } = req.params;
  if (!user) throw new AppError("User not authenticated", 401);

  const caseDoc = await Case.findById(getId(caseId));
  if (!caseDoc) throw new AppError("Case not found", 404);
  if ((caseDoc as any).doctor?.toString() !== user._id!.toString()) {
    throw new AppError("Only the case author can unpin comments", 403);
  }

  await Case.updateOne(
    { _id: getId(caseId), "comments._id": getId(commentId) },
    { $set: { "comments.$.isPinned": false } }
  );
  res.json({ success: true, message: "Comment unpinned successfully" });
});

export const getPinnedComments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const caseDoc = await Case.findById(getId(req.params.id));
  if (!caseDoc) throw new AppError("Case not found", 404);
  const pinned = caseDoc.comments.filter((c: any) => c.isPinned === true);
  res.json({ success: true, data: { comments: pinned } });
});

export const toggleRepostPermission = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) throw new AppError("User not authenticated", 401);

  const caseDoc = await Case.findById(getId(req.params.id));
  if (!caseDoc) throw new AppError("Case not found", 404);
  if ((caseDoc as any).doctor?.toString() !== user._id!.toString()) {
    throw new AppError("Only the case author can change repost permissions", 403);
  }

  const currentVal = (caseDoc as any).allowRepost === true;
  await Case.findByIdAndUpdate(caseDoc._id, { $set: { allowRepost: !currentVal } });
  res.json({ success: true, data: { allowRepost: !currentVal } });
});

export const repostCase = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) throw new AppError("User not authenticated", 401);

  const originalCase = await Case.findById(getId(req.params.id));
  if (!originalCase) throw new AppError("Case not found", 404);
  if (!(originalCase as any).allowRepost) {
    throw new AppError("This case cannot be reposted per author restrictions", 400);
  }

  const newRepost = await Case.create({
    title: `Repost: ${originalCase.title}`,
    description: originalCase.description,
    symptoms: originalCase.symptoms,
    patientInfo: originalCase.patientInfo,
    doctor: user._id,
    isPatientCase: false,
    moderationStatus: "approved",
  });

  res.status(201).json({ success: true, message: "Case reposted successfully", data: { case: newRepost } });
});

export const solveCase = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  const { finalDiagnosis, notes } = req.body;
  if (!user) throw new AppError("User not authenticated", 401);

  const caseDoc = await Case.findById(getId(req.params.id));
  if (!caseDoc) throw new AppError("Case not found", 404);
  if ((caseDoc as any).doctor?.toString() !== user._id!.toString()) {
    throw new AppError("Only the case author can solve this case", 403);
  }

  await Case.findByIdAndUpdate(caseDoc._id, {
    $set: {
      status: "solved",
      resolution: { finalDiagnosis, notes, resolvedAt: new Date() }
    }
  });
  res.json({ success: true, message: "Case resolved successfully" });
});

export const getRecommendedCases = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) throw new AppError("User not authenticated", 401);
  const spec = (user as any).specialization || "General Medicine";

  const baseFilter = {
    isActive: { $ne: false },
    $or: [
      { moderationStatus: "approved" },
      { moderationStatus: { $exists: false } },
    ],
  };

  const cases = await Case.find({
    specialization: spec,
    doctor: { $ne: user._id },
    ...baseFilter
  }).limit(5);

  res.json({ success: true, data: { cases } });
});

export const getFlaggedComments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!canModerateComments(user?.userType)) {
    throw new AppError("Access denied", 403);
  }
  const cases = await Case.find({ "comments.moderationStatus": "flagged" });
  const flaggedComments: any[] = [];
  for (const c of cases) {
    for (const comment of c.comments) {
      if ((comment as any).moderationStatus === "flagged") {
        flaggedComments.push({ caseId: c._id, caseTitle: c.title, comment });
      }
    }
  }
  res.json({ success: true, data: { comments: flaggedComments } });
});

export const moderateComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!canModerateComments(user?.userType)) {
    throw new AppError("Access denied", 403);
  }
  const { caseId, commentId } = req.params;
  const { status } = req.body;

  await Case.updateOne(
    { _id: getId(caseId), "comments._id": getId(commentId) },
    { $set: { "comments.$.moderationStatus": status } }
  );
  res.json({ success: true, message: "Comment moderated successfully" });
});

export const getCaseModerationQueue = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!canModerateCases(user?.userType)) {
    throw new AppError("Access denied", 403);
  }
  const cases = await Case.find({ moderationStatus: "pending" });
  res.json({ success: true, data: { cases } });
});

export const moderateCase = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!canModerateCases(user?.userType)) {
    throw new AppError("Access denied", 403);
  }
  const { status, reason } = req.body;
  const updated = await Case.findByIdAndUpdate(
    getId(req.params.id),
    {
      $set: { moderationStatus: status },
      $push: { moderationAuditTrail: { status, reason, reviewedBy: user?._id, reviewedAt: new Date() } }
    },
    { new: true }
  );
  res.json({ success: true, data: { case: updated } });
});

export const generateAISuggestions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const caseDoc = await Case.findById(getId(req.params.id));
  if (!caseDoc) throw new AppError("Case not found", 404);

  const spec = (caseDoc as any).specialization || "General Medicine";
  const analysis = await analyzeCase(caseDoc.title, caseDoc.description, spec);

  await Case.findByIdAndUpdate(caseDoc._id, { $set: { aiAnalysis: analysis } });
  res.json({ success: true, data: { suggestions: analysis } });
});

export const getCaseAISuggestions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const caseDoc = await Case.findById(getId(req.params.id));
  if (!caseDoc) throw new AppError("Case not found", 404);
  res.json({ success: true, data: { aiAnalysis: (caseDoc as any).aiAnalysis || null } });
});

export const addFollowUp = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user || !canAddCaseFollowUp(user.userType)) {
    throw new AppError("Unauthorized role", 403);
  }
  const { content } = req.body;
  const caseDoc = await Case.findById(getId(req.params.id));
  if (!caseDoc) throw new AppError("Case not found", 404);

  const newFollowUp = {
    _id: new mongoose.Types.ObjectId(),
    author: user._id,
    content,
    createdAt: new Date()
  };

  await Case.findByIdAndUpdate(caseDoc._id, { $push: { followUps: newFollowUp } });
  res.status(201).json({ success: true, data: { followUp: newFollowUp } });
});

export const getCaseFollowUps = asyncHandler(async (req: AuthRequest, res: Response) => {
  const caseDoc = await Case.findById(getId(req.params.id));
  if (!caseDoc) throw new AppError("Case not found", 404);
  res.json({ success: true, data: { followUps: (caseDoc as any).followUps || [] } });
});

export const scheduleAICasePost = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user;
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
  }
);

export const getMyAICaseSchedules = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user;
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
  }
);

export const reviewAICasePost = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user;
    const { scheduleId } = req.params;
    const { reviewStatus, reviewNotes } = req.body;
    if (!user) {
      throw new AppError("User not authenticated", 401);
    }
    if (!["approved", "changes_requested", "rejected"].includes(reviewStatus as string)) {
      throw new AppError("reviewStatus mismatch error", 400);
    }
    const schedule = await AICasePostSchedule.findByIdAndUpdate(
      scheduleId,
      {
        reviewStatus,
        reviewNotes: typeof reviewNotes === "string" ? reviewNotes.trim() : undefined,
        reviewedBy: user._id,
        reviewedAt: new Date(),
      },
      { new: true, runValidators: true }
    );
    if (!schedule) {
      throw new AppError("AI case schedule not found", 404);
    }
    return res.json({ success: true, data: { schedule } });
  }
);

export const publishDueAICasePosts = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const dueSchedules = await AICasePostSchedule.find({
      isActive: true,
      reviewStatus: "approved",
      nextRunAt: { $lte: new Date() },
    }).limit(10);
    const published: any[] = [];
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
            reason: "AI publication automatic execution",
            reviewedBy: schedule.reviewedBy,
            reviewedAt: schedule.reviewedAt ?? new Date(),
          },
        ],
        pointsAwarded: 0,
      });
      (schedule as any).publishedCase = publishedCase._id;
      schedule.lastPublishedAt = new Date();
      schedule.nextRunAt = getNextAICasePostDate(schedule.nextRunAt, schedule.interval);
      await schedule.save();
      published.push(publishedCase);
    }
    return res.json({ success: true, data: { count: published.length, cases: published } });
  }
);

export const replyToComment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user;
    const { caseId, commentId } = req.params;
    const { content } = req.body;
    if (!user) throw new AppError("User not authenticated", 401);
    if (!content?.trim()) throw new AppError("Reply content is required", 400);

    const caseDoc = await Case.findById(getId(caseId));
    if (!caseDoc) throw new AppError("Case not found", 404);

    const parentComment = caseDoc.comments.find((c: any) => c._id?.toString() === getId(commentId));
    if (!parentComment) throw new AppError("Comment not found", 404);

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

    if (parentComment.author.toString() !== user._id!.toString()) {
      await Notification.create({
        recipient: parentComment.author,
        message: `Someone replied to your comment`,
        type: "reply",
        link: `/cases/${caseId}`,
      });
    }
    res.status(201).json({ success: true, data: { reply } });
  }
);

export const likeComment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user;
    const { caseId, commentId } = req.params;
    if (!user) throw new AppError("User not authenticated", 401);

    const userIdObj = new mongoose.Types.ObjectId(user._id!.toString());
    let liked = false;
    const pullResult = await Case.updateOne(
      { _id: getId(caseId), "comments._id": getId(commentId) },
      { $pull: { "comments.$.likes": userIdObj } }
    );
    if (pullResult.modifiedCount === 0) {
      await Case.updateOne(
        { _id: getId(caseId), "comments._id": getId(commentId) },
        { $addToSet: { "comments.$.likes": userIdObj } }
      );
      liked = true;
    }
    const updatedCase = await Case.findById(getId(caseId), {
      comments: { $elemMatch: { _id: getId(commentId) } },
    });
    const likes = ((updatedCase?.comments as any)?.[0]?.likes as any[])?.length ?? 0;
    res.json({ success: true, data: { likes, liked } });
  }
);

export const rateComment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user;
    const { caseId, commentId } = req.params;
    const { rating } = req.body;
    if (!user) throw new AppError("User not authenticated", 401);
    if (!rating || rating < 1 || rating > 5) throw new AppError("Rating bounds error", 400);

    const caseDoc = await Case.findById(getId(caseId), {
      comments: { $elemMatch: { _id: getId(commentId) } },
    });
    if (!caseDoc || !(caseDoc.comments as any)?.[0]) throw new AppError("Not found", 404);

    const userIdObj = new mongoose.Types.ObjectId(user._id!.toString());
    const commentIdObj = new mongoose.Types.ObjectId(getId(commentId));
    const existingRating = await Rating.findOne({ rater: userIdObj, commentId: commentIdObj });

    let rated = false;
    if (existingRating) {
      await Rating.deleteOne({ _id: existingRating._id });
      await Case.updateOne(
        { _id: getId(caseId), "comments._id": getId(commentId) },
        { $pull: { "comments.$.ratedBy": userIdObj } }
      );
    } else {
      try {
        await Rating.create({
          rater: userIdObj,
          commentId: commentIdObj,
          caseId: new mongoose.Types.ObjectId(getId(caseId)),
          rating,
        });
      } catch (err: any) {
        if (err.code === 11000) throw new AppError("Already rated", 409);
        throw err;
      }
      await Case.updateOne(
        { _id: getId(caseId), "comments._id": getId(commentId) },
        { $addToSet: { "comments.$.ratedBy": userIdObj } }
      );
      rated = true;
    }
    const aggResult = await Rating.aggregate([
      { $match: { commentId: commentIdObj } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    const avgRating = aggResult.length > 0 ? Math.round(aggResult[0].avg) : undefined;
    await Case.updateOne(
      { _id: getId(caseId), "comments._id": getId(commentId) },
      { $set: { "comments.$.rating": avgRating ?? null } }
    );
    res.json({ success: true, data: { rating: avgRating, rated } });
  }
);

export const uploadAttachment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user;
    if (!user) throw new AppError("User not authenticated", 401);
    if (!req.file) throw new AppError("No file uploaded", 400);

    const uploadResult = await uploadCaseAttachment(req.file, String(user._id));
    let type = 'image';
    if (uploadResult.resource_type === 'video') {
      type = req.file.mimetype.startsWith('audio/') ? 'audio' : 'video';
    }
    res.status(201).json({ success: true, data: { url: uploadResult.secure_url, type } });
  }
);

// Create case
export const createCase = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = req.user;
    if (!user) throw new AppError("User not authenticated", 401);
    if (user.userType !== "doctor" && user.userType !== "patient") {
      throw new AppError("Role restriction error", 403);
    }
    const { title, description, specialization } = req.body;
    const spec = specialization || (user as any).specialization || "General Medicine";
    const aiAnalysis = await analyzeCase(title, description, spec);

    if (user.userType === "patient") {
      const newCase = new Case({
        title,
        description,
        symptoms: aiAnalysis.symptoms,
        patientInfo: req.body.patientInfo || {},
        diagnosis: aiAnalysis.diagnosis,
        treatment: aiAnalysis.treatment,
        doctor: user._id,
        isPatientCase: true,
        moderationStatus: "pending",
        pointsAwarded: 5,
      });
      await newCase.save();
      await User.findByIdAndUpdate(user._id, { $inc: { points: 5 } });

      return res.status(201).json({ success: true, data: { case: newCase } });
    }

    const newCase = new Case({
      title,
      description,
      symptoms: aiAnalysis.symptoms,
      patientInfo: req.body.patientInfo || {},
      diagnosis: aiAnalysis.diagnosis,
      treatment: aiAnalysis.treatment,
      doctor: user._id,
      isPatientCase: false,
      specialization: spec,
      moderationStatus: "approved",
      pointsAwarded: 10,
    });

    await newCase.save();
    await User.findByIdAndUpdate(user._id, { $inc: { points: 10 } });

    res.status(201).json({ success: true, data: { case: newCase } });
  }
);