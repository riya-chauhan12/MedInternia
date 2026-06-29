import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import UserBadge from '../models/UserBadge';
import Case from '../models/Case';
import { checkAndAwardAutoBadges } from './badgeController';

// Define CaseSummary type for recentCases
interface CaseSummary {
  _id: string;
  title: string;
  createdAt: Date;
  difficulty: string;
  specialization: string;
}

// Get user profile
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password')
      .populate('mentorDoctor', 'firstName lastName specialization');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Define all profile fields you want to check for completeness
    const allFields = [
      'firstName',
      'lastName',
      'email',
      'medicalSchool',
      'specialization',
      'profilePicture',
      'bio'
      // Add other fields as needed
    ];
    // Count fields that are completed (not null/undefined/empty)
    const completedFields = allFields.filter(field => {
      const value = (user as any)[field];
      return value !== undefined && value !== null && value !== '';
    });
    const profileScore = Math.round((completedFields.length / allFields.length) * 100);

    // Update profile score if changed
    if (user.profileScore !== profileScore) {
      await User.findByIdAndUpdate(userId, { profileScore });
    }

    // Fetch badges for the user
    const badges = await UserBadge.find({ user: userId, isVisible: true })
      .populate('badge')
      .sort({ earnedAt: -1 });

    // Fetch recent cases for the user
    const recentCases = (await Case.find({ doctor: userId })
      .select('_id title createdAt difficulty specialization')
      .sort({ createdAt: -1 })
      .limit(5))
      .map((c: any) => ({
        _id: c._id.toString(),
        title: c.title,
        createdAt: c.createdAt,
        difficulty: c.difficulty,
        specialization: c.specialization
      })) as CaseSummary[];

    res.json({
      success: true,
      data: {
        user: { ...user.toObject(), profileScore },
        badges,
        recentCases,
        stats: {
          casesAnalyzed: user.casesAnalyzed,
          upvotesReceived: user.upvotesReceived,
          averageRating: user.averageRating,
          points: user.points,
          streak: user.streak,
          certificatesEarned: user.certificatesEarned
        }
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const ALLOWED_UPDATE_FIELDS = [
  'firstName', 'lastName', 'phone', 'dateOfBirth', 'gender', 'address',
  'bio', 'profilePicture', 'linkedInProfile', 'githubProfile',
  'specialization', 'experience', 'qualifications',
  'medicalSchool', 'yearOfStudy', 'interests', 'mentorDoctor',
  'academicAchievements', 'careerGoals',
  'emergencyContact', 'medicalHistory', 'allergies'
];

// Update user profile
export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = (req.user!._id as any).toString();

    // Users can only update their own profile
    if (userId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile'
      });
    }

    const updateData: Record<string, any> = {};
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get intern scorecard
export const getInternScorecard = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ _id: userId, userType: 'intern' })
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Intern not found'
      });
    }

    // Get badges
    const badges = await UserBadge.find({ user: userId, isVisible: true })
      .populate('badge')
      .sort({ earnedAt: -1 });

    // Get case participation
    const casesParticipated = await Case.find({
      'comments.author': userId
    }).select('title createdAt difficulty specialization');

    // Calculate performance metrics
    const performanceMetrics = {
      totalPoints: user.points,
      casesAnalyzed: user.casesAnalyzed,
      upvotesReceived: user.upvotesReceived,
      peerReviewsGiven: user.peerReviewsGiven,
      peerReviewsReceived: user.peerReviewsReceived,
      averageRating: user.averageRating,
      currentStreak: user.streak,
      longestStreak: user.longestStreak,
      certificatesEarned: user.certificatesEarned,
      profileCompleteness: user.profileScore
    };

    // Calculate rank among all interns
    const totalInterns = await User.countDocuments({ userType: 'intern' });
    const higherRankedInterns = await User.countDocuments({
      userType: 'intern',
      points: { $gt: user.points }
    });
    const rank = higherRankedInterns + 1;

    res.json({
      success: true,
      data: {
        user,
        badges,
        casesParticipated,
        performanceMetrics,
        ranking: {
          current: rank,
          total: totalInterns,
          percentile: Math.round(((totalInterns - rank) / totalInterns) * 100)
        }
      }
    });
  } catch (error) {
    console.error('Get intern scorecard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update streak
export const updateUserStreak = async (userId: string) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if user has activity today (comments, case posts, etc.)
    const todayActivity = await Case.findOne({
      $or: [
        { doctor: userId, createdAt: { $gte: today.setHours(0, 0, 0, 0) } },
        { 'comments.author': userId, 'comments.createdAt': { $gte: today.setHours(0, 0, 0, 0) } }
      ]
    });

    if (todayActivity) {
      user.streak += 1;
      if (user.streak > user.longestStreak) {
        user.longestStreak = user.streak;
      }
    } else {
      user.streak = 0;
    }

    await user.save();

    // Check for auto-badges
    await checkAndAwardAutoBadges(userId);
  } catch (error) {
    console.error('Update user streak error:', error);
  }
};

// Get user leaderboard
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const { userType = 'intern', metric = 'points', limit = 50 } = req.query;

    const validMetrics = ['points', 'casesAnalyzed', 'upvotesReceived', 'averageRating', 'streak'];
    const sortMetric = validMetrics.includes(metric as string) ? metric as string : 'points';

    const filter: any = { userType, isActive: true };
    const sort: any = {};
    sort[sortMetric] = -1;

    const leaderboard = await User.find(filter)
      .select('firstName lastName profilePicture points casesAnalyzed upvotesReceived averageRating streak medicalSchool specialization')
      .sort(sort)
      .limit(Number(limit));

    // Add rank to each user
    const leaderboardWithRanks = leaderboard.map((user, index) => ({
      ...user.toObject(),
      rank: index + 1
    }));

    res.json({
      success: true,
      data: {
        leaderboard: leaderboardWithRanks,
        metric: sortMetric,
        total: leaderboardWithRanks.length
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Verify doctor (KYC process)
export const verifyDoctor = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { isVerified, verificationDocuments } = req.body;

    // Only admins or verified doctors can verify other doctors
    if (req.user!.userType !== 'doctor' || !req.user!.isVerifiedDoctor) {
      return res.status(403).json({
        success: false,
        message: 'Only verified doctors can verify other doctors'
      });
    }

    const doctor = await User.findOneAndUpdate(
      { _id: userId, userType: 'doctor' },
      { 
        isVerifiedDoctor: isVerified,
        verificationDocuments: verificationDocuments || []
      },
      { new: true }
    ).select('-password');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      message: `Doctor ${isVerified ? 'verified' : 'unverified'} successfully`,
      data: { doctor }
    });
  } catch (error) {
    console.error('Verify doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getUsers = (req: Request, res: Response) => {
  // Sample data - replace with database queries
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ];
  
  res.json({
    success: true,
    data: users
  });
};

export const createUser = (req: Request, res: Response) => {
  const { name, email } = req.body;
  
  // Validate input
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: 'Name and email are required'
    });
  }
  
  // Sample response - replace with database creation
  const newUser = {
    id: Date.now(),
    name,
    email
  };
  
  res.status(201).json({
    success: true,
    data: newUser
  });
};

// Grant contributor badge if points or recommended by doctor
export const grantContributorBadge = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.badges && user.badges.includes('CONTRIBUTOR')) {
      return res.status(400).json({ success: false, message: 'Already has badge' });
    }
    const recommendedByDoctor = req.body.recommendedByDoctor;
    if (user.points >= 50 || recommendedByDoctor) {
      user.badges = user.badges || [];
      user.badges.push('CONTRIBUTOR');
      await user.save();
      res.json({ success: true, badges: user.badges });
    } else {
      res.status(403).json({ success: false, message: 'Insufficient points or recommendation' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Upgrade intern profile to doctor if credits threshold met
export const upgradeProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: user not found in request' });
    }
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.userType !== 'intern') return res.status(400).json({ success: false, message: 'Not an intern' });
    if (typeof user.credits !== 'number' || user.credits < 100) return res.status(403).json({ success: false, message: 'Insufficient credits' });
    user.userType = 'doctor';
    await user.save();
    res.json({ success: true, userType: user.userType });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Doctor awards points to intern as recommendation
export const awardPointsToIntern = async (req: AuthRequest, res: Response) => {
  try {
    const doctor = req.user;
    const { internId } = req.params;
    const { points } = req.body;
    if (!doctor || doctor.userType !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Only doctors can award points.' });
    }
    if (typeof points !== 'number' || points <= 0) {
      return res.status(400).json({ success: false, message: 'Points must be a positive number.' });
    }
    const intern = await User.findById(internId);
    if (!intern || intern.userType !== 'intern') {
      return res.status(404).json({ success: false, message: 'Intern not found.' });
    }
    intern.points = (intern.points || 0) + points;
    await intern.save();
    res.json({ success: true, points: intern.points });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Follow a user
export const followUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized: user not found in request" });
    }
    const myId = req.user._id;
    const { userId } = req.body;
    if (myId === userId) return res.status(400).json({ success: false, message: "Cannot follow yourself" });
    const me = await User.findById(myId);
    const other = await User.findById(userId);
    if (!me || !other) return res.status(404).json({ success: false, message: "User not found" });
    if ((me.following ?? []).map((id: any) => id.toString()).includes(userId)) {
      return res.status(400).json({ success: false, message: "Already following" });
    }
    if ((other.followers ?? []).map((id: any) => id.toString()).includes(myId)) {
      return res.status(400).json({ success: false, message: "Already followed" });
    }
    me.following = me.following ?? [];
    other.followers = other.followers ?? [];
    me.following.push(userId);
    other.followers.push(myId as any);
    await me.save();
    await other.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error following user" });
  }
};

// Unfollow a user
export const unfollowUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized: user not found in request" });
    }
    const myId = req.user._id;
    const { userId } = req.body;
    const me = await User.findById(myId);
    const other = await User.findById(userId);
    if (!me || !other) return res.status(404).json({ success: false, message: "User not found" });
    me.following = (me.following ?? []).filter((id: any) => id.toString() !== userId);
    other.followers = (other.followers ?? []).filter((id: any) => id.toString() !== myId);
    await me.save();
    await other.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error unfollowing user" });
  }
};

// Get connections (following and followers)
export const getConnections = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized: user not found in request" });
    }
    const myId = req.user._id;
    const me = await User.findById(myId)
      .populate('following', 'firstName lastName profilePicture specialization userType')
      .populate('followers', 'firstName lastName profilePicture specialization userType');
    if (!me) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, following: me.following, followers: me.followers });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching connections" });
  }
};