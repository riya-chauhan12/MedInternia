import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import UserBadge from '../models/UserBadge';
import Case from '../models/Case';

export const getInternProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userId = req.user._id;

    const user = await User.findById(userId)
      .select('-password')
      .populate('mentorDoctor', 'firstName lastName specialization');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const badges = await UserBadge.find({ user: userId, isVisible: true })
      .populate('badge')
      .sort({ earnedAt: -1 });

    const recentCases = (await Case.find({ doctor: userId })
      .select('_id title createdAt difficulty specialization')
      .sort({ createdAt: -1 })
      .limit(5))
      .map((c) => ({
        _id: c._id.toString(),
        title: c.title,
        createdAt: c.createdAt,
        difficulty: c.difficulty,
        specialization: c.specialization,
      }));

    res.json({
      success: true,
      data: {
        user,
        badges,
        recentCases,
        stats: {
          casesAnalyzed: user.casesAnalyzed,
          upvotesReceived: user.upvotesReceived,
          averageRating: user.averageRating,
          points: user.points,
          streak: user.streak,
          certificatesEarned: user.certificatesEarned,
        },
      },
    });
  } catch (error) {
    console.error('Get intern profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getInternCredits = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const user = await User.findById(req.user._id).select('credits');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, credits: user.credits || 0 });
  } catch (error) {
    console.error('Get intern credits error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
