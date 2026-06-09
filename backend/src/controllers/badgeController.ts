import { createAndEmitNotification } from './notificationController';
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Badge from '../models/Badge';
import UserBadge from '../models/UserBadge';
import User from '../models/User';

// Create a new badge (admin only)
export const createBadge = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, icon, category, criteria, color } = req.body;

    const badge = new Badge({
      name,
      description,
      icon,
      category,
      criteria,
      color
    });

    await badge.save();

    res.status(201).json({
      success: true,
      message: 'Badge created successfully',
      data: { badge }
    });
  } catch (error) {
    console.error('Create badge error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all badges
export const getAllBadges = async (req: Request, res: Response) => {
  try {
    const { category, isActive } = req.query;
    
    const filter: any = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const badges = await Badge.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        badges,
        total: badges.length
      }
    });
  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Award badge to user
export const awardBadge = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, badgeId, caseId, commentId, metadata } = req.body;
    const verifiedBy = req.user!._id;

    // Check if user already has this badge
    const existingUserBadge = await UserBadge.findOne({
      user: userId,
      badge: badgeId
    });

    if (existingUserBadge) {
      return res.status(400).json({
        success: false,
        message: 'User already has this badge'
      });
    }

    const userBadge = new UserBadge({
      user: userId,
      badge: badgeId,
      caseId,
      commentId,
      verifiedBy,
      metadata
    });

    await userBadge.save();

    // Update user's certificate count
    await User.findByIdAndUpdate(userId, {
      $inc: { certificatesEarned: 1 }
    });

    // Populate badge info
    await userBadge.populate('badge');
     // Notify user they earned a badge
    const badgeData = userBadge.badge as any;
    await createAndEmitNotification({
      recipientId: userId,
      type:        'badge',
      message:     `Congratulations! You earned the "${badgeData?.name || 'new'}" badge`,
      link:        `/profile/achievements`,
      payload:     { badgeId, userBadgeId: userBadge._id },
    });

    res.status(201).json({
      success: true,
      message: 'Badge awarded successfully',
      data: { userBadge }
    });
  } catch (error) {
    console.error('Award badge error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user badges
export const getUserBadges = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { isVisible } = req.query;

    const filter: any = { user: userId };
    if (isVisible !== undefined) filter.isVisible = isVisible === 'true';

    const userBadges = await UserBadge.find(filter)
      .populate('badge')
      .populate('verifiedBy', 'firstName lastName')
      .sort({ earnedAt: -1 });

    res.json({
      success: true,
      data: {
        badges: userBadges,
        total: userBadges.length
      }
    });
  } catch (error) {
    console.error('Get user badges error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Toggle badge visibility
export const toggleBadgeVisibility = async (req: AuthRequest, res: Response) => {
  try {
    const { userBadgeId } = req.params;
    const { isVisible } = req.body;
    const userId = req.user!._id;

    const userBadge = await UserBadge.findOneAndUpdate(
      { _id: userBadgeId, user: userId },
      { isVisible },
      { new: true }
    ).populate('badge');

    if (!userBadge) {
      return res.status(404).json({
        success: false,
        message: 'Badge not found'
      });
    }

    res.json({
      success: true,
      message: 'Badge visibility updated',
      data: { userBadge }
    });
  } catch (error) {
    console.error('Toggle badge visibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Auto-award badges based on user activity
export const checkAndAwardAutoBadges = async (userId: string) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const badges = await Badge.find({ isActive: true });
    
    for (const badge of badges) {
      // Check if user already has this badge
      const existingUserBadge = await UserBadge.findOne({
        user: userId,
        badge: badge._id
      });

      if (existingUserBadge) continue;

      let shouldAward = false;

      // Check badge criteria
      switch (badge.criteria.type) {
        case 'points':
          shouldAward = user.points >= (badge.criteria.threshold || 0);
          break;
        case 'cases_analyzed':
          shouldAward = user.casesAnalyzed >= (badge.criteria.threshold || 0);
          break;
        case 'upvotes_received':
          shouldAward = user.upvotesReceived >= (badge.criteria.threshold || 0);
          break;
        case 'streak':
          shouldAward = user.longestStreak >= (badge.criteria.threshold || 0);
          break;
      }

      if (shouldAward) {
        const userBadge = new UserBadge({
          user: userId,
          badge: badge._id,
          metadata: {
            pointsEarned: badge.criteria.threshold || 0
          }
        });

        await userBadge.save();
        await User.findByIdAndUpdate(userId, {
          $inc: { certificatesEarned: 1 }
        });
      }
    }
  } catch (error) {
    console.error('Auto-award badges error:', error);
  }
};
