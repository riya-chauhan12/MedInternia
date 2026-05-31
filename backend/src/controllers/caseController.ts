import { Response } from 'express';
import Case, { ICase } from '../models/Case';
import User from '../models/User';
import AICasePostSchedule from '../models/AICasePostSchedule';
import { AuthRequest } from '../middleware/auth';
import { buildAICaseSchedule, getNextAICasePostDate } from '../services/aiCasePostingService';

const canModerateComments = (userType?: string) => ['admin', 'doctor', 'moderator'].includes(userType ?? '');
const canAddCaseFollowUp = (userType?: string) => ['admin', 'doctor', 'intern', 'hospital_staff'].includes(userType ?? '');
const canModerateCases = (userType?: string) => ['admin', 'doctor', 'moderator'].includes(userType ?? '');
const publicCaseFilter = {
  $or: [
    { moderationStatus: 'approved' },
    { moderationStatus: { $exists: false } }
  ]
};

export const scheduleAICasePost = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as { _id: string; userType?: string } | undefined;
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const schedulePayload = buildAICaseSchedule(req.body);
    const schedule = await AICasePostSchedule.create({
      author: user._id,
      generatedCase: schedulePayload.generatedCase,
      interval: schedulePayload.interval,
      scheduledFor: schedulePayload.scheduledFor,
      nextRunAt: schedulePayload.scheduledFor,
      reviewStatus: 'pending'
    });

    return res.status(201).json({
      success: true,
      message: 'AI case draft scheduled for clinical review',
      data: { schedule }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to schedule AI case draft';
    return res.status(400).json({ success: false, message });
  }
};

export const getMyAICaseSchedules = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as { _id: string } | undefined;
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const schedules = await AICasePostSchedule.find({ author: user._id, isActive: true })
      .populate('publishedCase', 'title createdAt')
      .sort({ nextRunAt: 1 });

    return res.json({
      success: true,
      data: { schedules }
    });
  } catch (error) {
    console.error('Get AI case schedules error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const reviewAICasePost = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as { _id: string } | undefined;
    const { scheduleId } = req.params;
    const { reviewStatus, reviewNotes } = req.body;

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!['approved', 'changes_requested', 'rejected'].includes(reviewStatus)) {
      return res.status(400).json({
        success: false,
        message: 'reviewStatus must be approved, changes_requested, or rejected'
      });
    }

    const schedule = await AICasePostSchedule.findByIdAndUpdate(
      scheduleId,
      {
        reviewStatus,
        reviewNotes: typeof reviewNotes === 'string' ? reviewNotes.trim() : undefined,
        reviewedBy: user._id,
        reviewedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'AI case schedule not found' });
    }

    return res.json({
      success: true,
      message: 'AI case review status updated',
      data: { schedule }
    });
  } catch (error) {
    console.error('Review AI case post error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const publishDueAICasePosts = async (req: AuthRequest, res: Response) => {
  try {
    const dueSchedules = await AICasePostSchedule.find({
      isActive: true,
      reviewStatus: 'approved',
      nextRunAt: { $lte: new Date() }
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
        moderationStatus: 'approved',
        moderationAuditTrail: [{
          status: 'approved',
          reason: 'AI-generated scheduled case approved before publication',
          reviewedBy: schedule.reviewedBy,
          reviewedAt: schedule.reviewedAt ?? new Date()
        }],
        pointsAwarded: 0
      });

      schedule.publishedCase = publishedCase._id as any;
      schedule.lastPublishedAt = new Date();
      schedule.nextRunAt = getNextAICasePostDate(schedule.nextRunAt, schedule.interval);
      await schedule.save();

      published.push(publishedCase);
    }

    return res.json({
      success: true,
      message: 'Due AI case drafts published',
      data: {
        count: published.length,
        cases: published
      }
    });
  } catch (error) {
    console.error('Publish due AI case posts error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Reply to a comment
export const replyToComment = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as { _id: string; userType?: string };
    const { caseId, commentId } = req.params;
    const { content } = req.body;
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Reply content is required' });
    }
    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found' });
    const parentComment = caseDoc.comments.find((c: any) => c._id?.toString() === commentId);
    if (!parentComment) return res.status(404).json({ success: false, message: 'Comment not found' });
    // Prevent duplicate replies
    if (caseDoc.comments.some((c: any) => c.author.toString() === user._id.toString() && c.content === content.trim() && c.replyTo?.toString() === (parentComment._id as string | { toString(): string }).toString())) {
      return res.status(409).json({ success: false, message: 'Duplicate reply detected' });
    }
    // Create reply as a plain object with manual _id assignment
    const mongoose = require('mongoose');
    const reply = {
      author: user._id,
      content: content.trim(),
      likes: [],
      ratedBy: [],
      replies: [],
      replyTo: parentComment._id,
      createdAt: new Date(),
      updatedAt: new Date(),
      _id: new mongoose.Types.ObjectId()
    };
    caseDoc.comments.push(reply as any);
    parentComment.replies.push(reply._id);
    await caseDoc.save();

    // Send notification to comment author if not replying to own comment
    if (parentComment.author.toString() !== user._id.toString()) {
      const Notification = require('../models/Notification').default;
      await Notification.create({
        recipient: parentComment.author,
        message: `Someone replied to your comment: "${parentComment.content}"`,
        type: 'reply',
        link: `/cases/${caseId}`
      });
    }

    res.status(201).json({ success: true, message: 'Reply added successfully', data: { reply } });
  } catch (error) {
    console.error('Reply to comment error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
// Like a comment
export const likeComment = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as { _id: string | { toString(): string } };
    const { caseId, commentId } = req.params;
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found' });
    const comment = caseDoc.comments.find((c: any) => c._id?.toString() === commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    // Toggle like
    const mongoose = require('mongoose');
    const userIdObj = typeof user._id === 'string' ? new mongoose.Types.ObjectId(user._id) : user._id;
    const likeIndex = comment.likes.findIndex((uid: any) => uid.toString() === userIdObj.toString());
    let liked = false;
    if (likeIndex > -1) {
      // Unlike
      comment.likes.splice(likeIndex, 1);
      liked = false;
    } else {
      // Like
      comment.likes.push(userIdObj);
      liked = true;
    }
    await caseDoc.save();
    res.json({ success: true, message: liked ? 'Comment liked' : 'Comment unliked', data: { likes: comment.likes.length, liked } });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Rate a comment
export const rateComment = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as { _id: string | { toString(): string } };
    const { caseId, commentId } = req.params;
    const { rating } = req.body;
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }
    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found' });
    const comment = caseDoc.comments.find((c: any) => c._id?.toString() === commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    // Toggle rating
    const mongoose = require('mongoose');
    const userIdObj = typeof user._id === 'string' ? new mongoose.Types.ObjectId(user._id) : user._id;
    const rateIndex = comment.ratedBy.findIndex((uid: any) => uid.toString() === userIdObj.toString());
    let rated = false;
    if (rateIndex > -1) {
      // Unrate
      comment.ratedBy.splice(rateIndex, 1);
      // Recalculate average rating
      if (comment.ratedBy.length === 0) comment.rating = undefined;
      else comment.rating = Math.round((comment.rating ?? 0) * comment.ratedBy.length / (comment.ratedBy.length + 1));
      rated = false;
    } else {
      // Rate
      comment.ratedBy.push(userIdObj);
      if (!comment.rating) comment.rating = rating;
      else comment.rating = Math.round(((comment.rating * (comment.ratedBy.length - 1)) + rating) / comment.ratedBy.length);
      rated = true;
    }
    await caseDoc.save();
    res.json({ success: true, message: rated ? 'Comment rated' : 'Comment unrated', data: { rating: comment.rating, ratedBy: comment.ratedBy.length, rated } });
  } catch (error) {
    console.error('Rate comment error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Create a new case (Doctor only)
export const createCase = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as { _id: string; userType: string; specialization?: string };

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (user.userType !== 'doctor' && user.userType !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors and patients can create cases'
      });
    }

    const {
      title,
      description,
      symptoms,
      patientInfo,
      diagnosis,
      treatment,
      images,
      tags,
      difficulty,
      specialization
    } = req.body;

    // Restrict patient case creation
    if (user.userType === 'patient') {
      // Patients can't set diagnosis, treatment, or difficulty
      // These will be limited or undefined
      const newCase = new Case({
        title,
        description,
        symptoms: symptoms || [],
        patientInfo: patientInfo || {},
        images: images || [],
        tags: tags || [],
        difficulty: 'beginner', // Default for patient cases
        specialization: 'General Medicine', // Default for patients
        doctor: user._id as any,
        isPatientCase: true,
        moderationStatus: 'pending',
        moderationAuditTrail: [{
          status: 'pending',
          reason: 'Patient-submitted case awaiting review',
          reviewedAt: new Date()
        }]
      });

      await newCase.save();
      await newCase.populate('doctor', 'firstName lastName');

      // Patients get fewer points for posting
      const pointsForCase = 5;
      await User.findByIdAndUpdate(
        user._id,
        { $inc: { points: pointsForCase } }
      );

      return res.status(201).json({
        success: true,
        message: 'Patient case created successfully',
        data: {
          case: newCase,
          pointsAwarded: pointsForCase
        }
      });
    }

    // Doctor case creation (full features)
    const newCase = new Case({
      title,
      description,
      symptoms: symptoms || [],
      patientInfo: patientInfo || {},
      diagnosis,
      treatment,
      images: images || [],
      tags: tags || [],
      difficulty,
      specialization: specialization || user.specialization,
      doctor: user._id as any,
      isPatientCase: false,
      moderationStatus: 'approved',
      moderationAuditTrail: [{
        status: 'approved',
        reason: 'Doctor-authored case published automatically',
        reviewedBy: user._id as any,
        reviewedAt: new Date()
      }]
    });

    await newCase.save();
    await newCase.populate('doctor', 'firstName lastName specialization');

    // Award points to doctor for posting case
    const pointsForCase = 10; // Base points for posting a case
    await User.findByIdAndUpdate(
      user._id,
      { $inc: { points: pointsForCase } }
    );

    await Case.findByIdAndUpdate(
      newCase._id,
      { pointsAwarded: pointsForCase }
    );

    res.status(201).json({
      success: true,
      message: 'Case created successfully',
      data: {
        case: newCase,
        pointsAwarded: pointsForCase
      }
    });
  } catch (error: any) {
    console.error('Create case error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all cases with filters
export const getCases = async (req: AuthRequest, res: Response) => {
  try {
    const {
      specialization,
      difficulty,
      tags,
      doctor,
      page = 1,
      limit = 10,
      search
    } = req.query;

    const filter: any = { isActive: true, $and: [publicCaseFilter] };

    if (specialization) {
      filter.specialization = { $regex: specialization, $options: 'i' };
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
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search as string, 'i')] } }
      ];
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const cases = await Case.find(filter)
      .populate('doctor', 'firstName lastName specialization')
      .populate('comments.author', 'firstName lastName userType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Case.countDocuments(filter);

    res.json({
      success: true,
      data: {
        cases,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Get cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single case by ID
export const getCaseById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const caseData = await Case.findById(id)
      .populate('doctor', 'firstName lastName specialization')
      .populate('comments.author', 'firstName lastName userType')
      .populate('likes', 'firstName lastName');

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    if (!caseData.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Case is no longer available'
      });
    }

    const user = req.user as { _id?: string; userType?: string } | undefined;
    const isOwner = user?._id && caseData.doctor.toString() === user._id.toString();
    const isApproved = !caseData.moderationStatus || caseData.moderationStatus === 'approved';
    if (!isApproved && !isOwner && !canModerateCases(user?.userType)) {
      return res.status(404).json({
        success: false,
        message: 'Case is awaiting moderation'
      });
    }

    res.json({
      success: true,
      data: {
        case: caseData
      }
    });
  } catch (error) {
    console.error('Get case by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update case (Doctor who created it only)
export const updateCase = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as { _id: string; userType: string };
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const caseData = await Case.findById(id);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    if (caseData.doctor.toString() !== user._id?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own cases'
      });
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

    const updatedCase = await Case.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('doctor', 'firstName lastName specialization');

    res.json({
      success: true,
      message: 'Case updated successfully',
      data: {
        case: updatedCase
      }
    });
  } catch (error: any) {
    console.error('Update case error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete case (Doctor who created it only)
export const deleteCase = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const caseData = await Case.findById(id);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    if (caseData.doctor.toString() !== user._id?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own cases'
      });
    }

    // Soft delete
    await Case.findByIdAndUpdate(id, { isActive: false });

    res.json({
      success: true,
      message: 'Case deleted successfully'
    });
  } catch (error) {
    console.error('Delete case error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add comment to case
export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as { _id: string | { toString(): string }; userType?: string };
    const { id } = req.params;
    const { content, replyTo } = req.body;

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }
    const caseData = await Case.findById(id);
    if (!caseData) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }
    if (!caseData.isActive) {
      return res.status(404).json({ success: false, message: 'Case is no longer available' });
    }
    // Prevent duplicate comments by same user with same content
    if (caseData.comments.some((c: any) => c.author.toString() === user._id.toString() && c.content === content.trim())) {
      return res.status(409).json({ success: false, message: 'Duplicate comment detected' });
    }
    const newComment: any = {
      author: user._id as any,
      content: content.trim(),
      likes: [],
      ratedBy: [],
      replies: [],
      replyTo: replyTo ? replyTo : undefined
    };
    caseData.comments.push(newComment);
    await caseData.save();
    await caseData.populate('comments.author', 'firstName lastName userType');
    const addedComment = caseData.comments[caseData.comments.length - 1];
    res.status(201).json({ success: true, message: 'Comment added successfully', data: { comment: addedComment } });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Pin a comment (doctor only)
export const pinComment = async (req: AuthRequest, res: Response) => {
  try {
    const { caseId, commentId } = req.params;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found' });
    const comment = caseDoc.comments.find((c: any) => c._id?.toString() === commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    // Moderation roles can pin any comment; other permitted users can pin their own.
    if (canModerateComments(user.userType) || (comment.author?.toString() === user._id?.toString())) {
      comment.pinned = true;
      await caseDoc.save();
      return res.json({ success: true, comment });
    } else {
      return res.status(403).json({ success: false, message: 'You can only pin your own comments.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Unpin a comment (doctor only)
export const unpinComment = async (req: AuthRequest, res: Response) => {
  try {
    const { caseId, commentId } = req.params;
    const user = req.user;
    if (!user || !canModerateComments(user.userType)) {
      return res.status(403).json({ success: false, message: 'Only comment moderators can unpin comments' });
    }
    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found' });
    const comment = caseDoc.comments.find((c: any) => c._id?.toString() === commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    comment.pinned = false;
    await caseDoc.save();
    res.json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get all pinned comments for a case
export const getPinnedComments = async (req: AuthRequest, res: Response) => {
  try {
    const { caseId } = req.params;
    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found' });
    const pinnedComments = caseDoc.comments.filter((c: any) => c.pinned);
    res.json({ success: true, pinnedComments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Toggle repost permission (case owner only)
export const toggleRepostPermission = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const caseDoc = await Case.findById(id);
    if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found' });
    if (!user || (caseDoc.doctor.toString() !== (user._id as string).toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    caseDoc.canRepost = !caseDoc.canRepost;
    await caseDoc.save();
    res.json({ success: true, canRepost: caseDoc.canRepost });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Repost a case (if allowed)
export const repostCase = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const caseDoc = await Case.findById(id);
    if (!caseDoc || !caseDoc.canRepost) {
      return res.status(403).json({ success: false, message: 'Repost not allowed' });
    }
    // Duplicate case logic (simplified)
    const newCase = new Case({
      ...caseDoc.toObject(),
      _id: undefined,
      doctor: user?._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await newCase.save();
    res.json({ success: true, case: newCase });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Like/Unlike case
export const toggleLike = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const caseData = await Case.findById(id);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    if (!caseData.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Case is no longer available'
      });
    }

    const userIdString = user._id?.toString();
    const likeIndex = caseData.likes.findIndex(like => like.toString() === userIdString);

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
      message: isLiked ? 'Case liked successfully' : 'Case unliked successfully',
      data: {
        isLiked,
        totalLikes: caseData.likes.length
      }
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get cases by current doctor
export const getMyCases = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (user.userType !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can view their cases'
      });
    }

    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const cases = await Case.find({ doctor: user._id as any, isActive: true })
      .populate('comments.author', 'firstName lastName userType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Case.countDocuments({ doctor: user._id as any, isActive: true });

    res.json({
      success: true,
      data: {
        cases,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Get my cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get moderation queue counts and pending items
export const getCaseModerationQueue = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as { userType?: string };
    if (!canModerateCases(user?.userType)) {
      return res.status(403).json({
        success: false,
        message: 'Only moderators, admins, and doctors can review case submissions'
      });
    }

    const {
      status = 'pending',
      page = 1,
      limit = 10
    } = req.query;
    const allowedStatuses = ['pending', 'approved', 'rejected', 'changes_requested'];
    const queueStatus = allowedStatuses.includes(status as string) ? status as string : 'pending';
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const filter = { isActive: true, moderationStatus: queueStatus };
    const [cases, total, counts] = await Promise.all([
      Case.find(filter)
        .populate('doctor', 'firstName lastName userType specialization')
        .populate('reviewedBy', 'firstName lastName userType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Case.countDocuments(filter),
      Case.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$moderationStatus', count: { $sum: 1 } } }
      ])
    ]);

    const queueCounts = counts.reduce((acc: Record<string, number>, item: { _id?: string; count: number }) => {
      acc[item._id || 'approved'] = item.count;
      return acc;
    }, {
      pending: 0,
      approved: 0,
      rejected: 0,
      changes_requested: 0
    });

    res.json({
      success: true,
      data: {
        cases,
        counts: queueCounts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Get case moderation queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Approve, reject, or request changes for a case before public publishing
export const moderateCase = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as { _id: string; userType?: string };
    if (!canModerateCases(user?.userType)) {
      return res.status(403).json({
        success: false,
        message: 'Only moderators, admins, and doctors can review case submissions'
      });
    }

    const { id } = req.params;
    const { status, reason } = req.body;
    const allowedStatuses = ['pending', 'approved', 'rejected', 'changes_requested'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be pending, approved, rejected, or changes_requested'
      });
    }

    if ((status === 'rejected' || status === 'changes_requested') && !reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A review reason is required when rejecting or requesting changes'
      });
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
            reviewedAt
          }
        }
      },
      { new: true, runValidators: true }
    )
      .populate('doctor', 'firstName lastName userType specialization')
      .populate('reviewedBy', 'firstName lastName userType');

    if (!updatedCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    res.json({
      success: true,
      message: `Case ${status.replace('_', ' ')} successfully`,
      data: {
        case: updatedCase
      }
    });
  } catch (error: any) {
    console.error('Moderate case error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add follow-up to case
export const addFollowUp = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content, outcome, images } = req.body;
    const user = req.user!;

    const caseData = await Case.findById(id);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Original authors and roles with follow-up permission can add follow-ups.
    const userIdString = (user._id as any).toString();
    const canAddFollowUp = caseData.doctor.toString() === userIdString || canAddCaseFollowUp(user.userType);

    if (!canAddFollowUp) {
      return res.status(403).json({
        success: false,
        message: 'Only the case author or permitted care team members can add follow-ups'
      });
    }

    const followUp = {
      author: user._id as any,
      content,
      outcome,
      images: images || [],
      createdAt: new Date()
    };

    caseData.followUps.push(followUp);
    await caseData.save();

    await caseData.populate([
      { path: 'doctor', select: 'firstName lastName specialization' },
      { path: 'followUps.author', select: 'firstName lastName userType' }
    ]);

    res.json({
      success: true,
      message: 'Follow-up added successfully',
      data: { case: caseData }
    });
  } catch (error) {
    console.error('Add follow-up error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get case follow-ups
export const getCaseFollowUps = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const caseData = await Case.findById(id)
      .select('followUps')
      .populate('followUps.author', 'firstName lastName userType profilePicture');

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    res.json({
      success: true,
      data: {
        followUps: caseData.followUps,
        total: caseData.followUps.length
      }
    });
  } catch (error) {
    console.error('Get case follow-ups error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Generate AI case suggestions (placeholder for AI integration)
export const generateAISuggestions = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const caseData = await Case.findById(id);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
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
            { tags: { $in: caseData.tags } }
          ]
        }
      ]
    })
      .select('title description specialization difficulty tags')
      .limit(5)
      .sort({ createdAt: -1 });

    // Update case with AI suggestions
    caseData.aiSuggestions = {
      suggestedCases: similarCases.map(c => c._id) as any,
      relevanceScore: 0.8, // Placeholder score
      lastUpdated: new Date()
    };

    await caseData.save();

    res.json({
      success: true,
      message: 'AI suggestions generated successfully',
      data: {
        suggestions: similarCases,
        relevanceScore: caseData.aiSuggestions?.relevanceScore || 0.8
      }
    });
  } catch (error) {
    console.error('Generate AI suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get AI suggestions for case
export const getCaseAISuggestions = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const caseData = await Case.findById(id)
      .populate('aiSuggestions.suggestedCases', 'title description specialization difficulty tags createdAt');

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    res.json({
      success: true,
      data: {
        suggestions: caseData.aiSuggestions?.suggestedCases || [],
        relevanceScore: caseData.aiSuggestions?.relevanceScore || 0,
        lastUpdated: caseData.aiSuggestions?.lastUpdated
      }
    });
  } catch (error) {
    console.error('Get case AI suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
