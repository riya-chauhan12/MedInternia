import mongoose from 'mongoose';
import { createAndEmitNotification } from './notificationController';
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import PeerReview from '../models/PeerReview';
import User from '../models/User';
import Case from '../models/Case';

// Submit peer review
export const submitPeerReview = async (req: AuthRequest, res: Response) => {
  try {
    const { revieweeId, caseId, commentId, rating, feedback, comments, tags } = req.body;
    const reviewerId = (req.user!._id as any).toString();

    // Prevent self-review
    if (reviewerId === revieweeId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot review your own work'
      });
    }

    // Check if reviewer is allowed by the route-level role guard.
    if (req.user!.userType !== 'intern' && req.user!.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only interns or admins can submit peer reviews'
      });
    }

    // Check if case and comment exist
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    const comment = caseData.comments.find(c => c._id?.toString() === commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (comment.author.toString() !== revieweeId) {
      return res.status(400).json({
        success: false,
        message: 'Reviewee must match the comment author'
      });
    }

    // Check if review already exists
    const existingReview = await PeerReview.findOne({
      reviewer: reviewerId,
      commentId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this comment'
      });
    }

    const session = await mongoose.startSession();
    let committed = false;
    let peerReview: any;
    try {
      session.startTransaction();

      [peerReview] = await PeerReview.create([{
        reviewer: reviewerId,
        reviewee: revieweeId,
        caseId,
        commentId,
        rating,
        feedback,
        comments,
        tags
      }], { session });

      // Update reviewer's peer review count
      await User.findByIdAndUpdate(reviewerId, {
        $inc: { peerReviewsGiven: 1 }
      }, { session });

      // Update reviewee's peer review count and calculate new average
      const revieweeReviews = await PeerReview.find({ reviewee: revieweeId }).session(session);
      const totalRating = revieweeReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / revieweeReviews.length;

      await User.findByIdAndUpdate(revieweeId, {
        $inc: { peerReviewsReceived: 1 },
        $set: { averageRating: Math.round(averageRating * 10) / 10 }
      }, { session });

      await session.commitTransaction();
      committed = true;

      await peerReview.populate([
        { path: 'reviewer', select: 'firstName lastName userType' },
        { path: 'reviewee', select: 'firstName lastName userType' }
      ]);
    } finally {
      if (!committed) await session.abortTransaction();
      session.endSession();
    }
     // Notify reviewee about peer review
    await createAndEmitNotification({
      recipientId: revieweeId,
      type:        'peer_review',
      message:     `You received a peer review with a rating of ${peerReview.rating}/5`,
      link:        `/peer-reviews/${peerReview._id}`,
      payload:     { peerReviewId: peerReview._id, rating: peerReview.rating },
    });


    res.status(201).json({
      success: true,
      message: 'Peer review submitted successfully',
      data: { peerReview }
    });
  } catch (error) {
    console.error('Submit peer review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get peer reviews for a comment
export const getCommentReviews = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;

    const reviews = await PeerReview.find({ commentId })
      .populate('reviewer', 'firstName lastName userType profilePicture')
      .populate('reviewee', 'firstName lastName userType')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        reviews,
        total: reviews.length
      }
    });
  } catch (error) {
    console.error('Get comment reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get peer reviews received by user
export const getUserReviews = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const reviews = await PeerReview.find({ reviewee: userId })
      .populate('reviewer', 'firstName lastName userType profilePicture')
      .populate('caseId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await PeerReview.countDocuments({ reviewee: userId });

    // Calculate average ratings by category
    const allReviews = await PeerReview.find({ reviewee: userId });
    const averages = {
      overall: 0,
      accuracy: 0,
      clarity: 0,
      completeness: 0,
      reasoning: 0
    };

    if (allReviews.length > 0) {
      averages.overall = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      averages.accuracy = allReviews.reduce((sum, r) => sum + r.feedback.accuracy, 0) / allReviews.length;
      averages.clarity = allReviews.reduce((sum, r) => sum + r.feedback.clarity, 0) / allReviews.length;
      averages.completeness = allReviews.reduce((sum, r) => sum + r.feedback.completeness, 0) / allReviews.length;
      averages.reasoning = allReviews.reduce((sum, r) => sum + r.feedback.reasoning, 0) / allReviews.length;
    }

    res.json({
      success: true,
      data: {
        reviews,
        total,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        averageRatings: averages
      }
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get peer reviews given by user
export const getReviewsByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const reviews = await PeerReview.find({ reviewer: userId })
      .populate('reviewee', 'firstName lastName userType profilePicture')
      .populate('caseId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await PeerReview.countDocuments({ reviewer: userId });

    res.json({
      success: true,
      data: {
        reviews,
        total,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page)
      }
    });
  } catch (error) {
    console.error('Get reviews by user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Mark review as helpful
export const markReviewHelpful = async (req: AuthRequest, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { isHelpful } = req.body;

    const review = await PeerReview.findByIdAndUpdate(
      reviewId,
      { isHelpful },
      { new: true }
    ).populate([
      { path: 'reviewer', select: 'firstName lastName userType' },
      { path: 'reviewee', select: 'firstName lastName userType' }
    ]);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: 'Review helpfulness updated',
      data: { review }
    });
  } catch (error) {
    console.error('Mark review helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get peer review analytics for user
export const getPeerReviewAnalytics = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Reviews received
    const receivedReviews = await PeerReview.find({ reviewee: userId });
    
    // Reviews given
    const givenReviews = await PeerReview.find({ reviewer: userId });

    // Calculate analytics
    const analytics = {
      reviewsReceived: receivedReviews.length,
      reviewsGiven: givenReviews.length,
      averageRatingReceived: receivedReviews.length > 0 
        ? receivedReviews.reduce((sum, r) => sum + r.rating, 0) / receivedReviews.length 
        : 0,
      topTags: {},
      monthlyTrend: {}
    };

    // Calculate top tags from received reviews
    const tagCounts: { [key: string]: number } = {};
    receivedReviews.forEach(review => {
      review.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    analytics.topTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .reduce((obj, [tag, count]) => ({ ...obj, [tag]: count }), {});

    // Calculate monthly trend (received vs given)
    const monthlyTrend: { [key: string]: { received: number; given: number } } = {};
    const getYearMonth = (date: Date) => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    receivedReviews.forEach(r => {
      const ym = getYearMonth(r.createdAt);
      if (!monthlyTrend[ym]) monthlyTrend[ym] = { received: 0, given: 0 };
      monthlyTrend[ym].received += 1;
    });

    givenReviews.forEach(r => {
      const ym = getYearMonth(r.createdAt);
      if (!monthlyTrend[ym]) monthlyTrend[ym] = { received: 0, given: 0 };
      monthlyTrend[ym].given += 1;
    });

    analytics.monthlyTrend = monthlyTrend;

    res.json({
      success: true,
      data: { analytics }
    });
  } catch (error) {
    console.error('Get peer review analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
