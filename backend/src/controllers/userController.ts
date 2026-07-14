import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import UserBadge from '../models/UserBadge';
import Case from '../models/Case';
import Certificate from '../models/Certificate';
import { checkAndAwardAutoBadges } from './badgeController';
import { extractTextFromBuffer, parseResumeText } from '../services/resumeParserService';

// Define CaseSummary type for recentCases
interface CaseSummary {
  _id: string;
  title: string;
  createdAt: Date;
  difficulty: string;
  specialization: string;
}

interface MentorStats {
  mentorScore: number;
  casesPosted: number;
  internsMentored: number;
  certificatesIssued: number;
  casesReviewed: number;
  discussionCount: number;
  likesReceived: number;
  followUpsPosted: number;
  averageRating: number;
  mentoringCredits: number;
  scoreBreakdown: {
    casesPosted: number;
    internsMentored: number;
    certificatesIssued: number;
    casesReviewed: number;
    discussionEngagement: number;
    likesReceived: number;
    followUpsPosted: number;
    ratingQuality: number;
    mentoringCredits: number;
  };
  resumeSummary: string;
}

const toObjectId = (id: unknown) => {
  return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
};

const buildMentorResumeSummary = (doctor: any, stats: Omit<MentorStats, 'resumeSummary'>) => {
  const name = `${doctor.firstName} ${doctor.lastName}`.trim();
  const specialization = doctor.specialization ? ` in ${doctor.specialization}` : '';
  return [
    `${name} is a ${doctor.isVerifiedDoctor ? 'verified ' : ''}doctor${specialization}.`,
    `Mentorship score: ${stats.mentorScore}.`,
    `Posted ${stats.casesPosted} case(s), mentored ${stats.internsMentored} intern(s), reviewed ${stats.casesReviewed} case(s), and issued ${stats.certificatesIssued} certificate(s).`,
    `Discussion engagement includes ${stats.discussionCount} comment(s), ${stats.likesReceived} like(s), and ${stats.followUpsPosted} follow-up update(s).`
  ].join(' ');
};

const calculateMentorStats = async (doctor: any): Promise<MentorStats> => {
  const doctorId = toObjectId(doctor._id);

  const [
    casesPosted,
    internsMentored,
    certificateStats,
    engagementStats
  ] = await Promise.all([
    Case.countDocuments({ doctor: doctorId, isActive: true }),
    User.countDocuments({ userType: 'intern', mentorDoctor: doctorId, isActive: true }),
    Certificate.aggregate([
      { $match: { doctor: doctorId } },
      {
        $group: {
          _id: null,
          certificatesIssued: { $sum: 1 },
          casesReviewed: { $sum: '$casesReviewed' }
        }
      }
    ]),
    Case.aggregate([
      { $match: { doctor: doctorId, isActive: true } },
      {
        $project: {
          commentCount: { $size: { $ifNull: ['$comments', []] } },
          likeCount: { $size: { $ifNull: ['$likes', []] } },
          followUpCount: { $size: { $ifNull: ['$followUps', []] } }
        }
      },
      {
        $group: {
          _id: null,
          discussionCount: { $sum: '$commentCount' },
          likesReceived: { $sum: '$likeCount' },
          followUpsPosted: { $sum: '$followUpCount' }
        }
      }
    ])
  ]);

  const certificatesIssued = certificateStats[0]?.certificatesIssued || 0;
  const casesReviewed = certificateStats[0]?.casesReviewed || 0;
  const discussionCount = engagementStats[0]?.discussionCount || 0;
  const likesReceived = engagementStats[0]?.likesReceived || 0;
  const followUpsPosted = engagementStats[0]?.followUpsPosted || 0;
  const averageRating = Number(doctor.averageRating || 0);
  const mentoringCredits = Number(doctor.mentoringCredits || 0);

  const scoreBreakdown = {
    casesPosted: casesPosted * 8,
    internsMentored: internsMentored * 20,
    certificatesIssued: certificatesIssued * 15,
    casesReviewed: casesReviewed * 6,
    discussionEngagement: discussionCount * 2,
    likesReceived,
    followUpsPosted: followUpsPosted * 5,
    ratingQuality: Math.round(averageRating * 12),
    mentoringCredits: mentoringCredits * 2
  };

  const mentorScore = Object.values(scoreBreakdown).reduce((sum, value) => sum + value, 0);
  const baseStats = {
    mentorScore,
    casesPosted,
    internsMentored,
    certificatesIssued,
    casesReviewed,
    discussionCount,
    likesReceived,
    followUpsPosted,
    averageRating,
    mentoringCredits,
    scoreBreakdown
  };

  return {
    ...baseStats,
    resumeSummary: buildMentorResumeSummary(doctor, baseStats)
  };
};

// Get user profile
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    if (!req.user || (String(req.user._id) !== userId && req.user.userType !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: cannot view other users\' profiles'
      });
    }

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

    const mentorStats = user.userType === 'doctor' ? await calculateMentorStats(user) : null;

    res.json({
      success: true,
      data: {
        user: { ...user.toObject(), profileScore },
        badges,
        recentCases,
        mentorStats,
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
  'medicalSchool', 'yearOfStudy', 'interests', 'skills', 'mentorDoctor',
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
export const getInternScorecard = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    if (!req.user || (String(req.user._id) !== userId && req.user.userType !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: cannot view other users\' scorecards'
      });
    }

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if user has activity today (comments, case posts, etc.)
    const todayActivity = await Case.findOne({
      $or: [
        { doctor: userId, createdAt: { $gte: today } },
        { 'comments.author': userId, 'comments.createdAt': { $gte: today } }
      ]
    });

    if (!todayActivity) {
      // No activity today - reset streak
      await User.findByIdAndUpdate(userId, { $set: { streak: 0 } });
      return;
    }

    // Check if user was already active today (streak already incremented)
    const user = await User.findById(userId).select('streak longestStreak lastActivityDate');
    if (!user) return;

    const lastActive = user.lastActivityDate ? new Date(user.lastActivityDate) : null;
    const lastActiveDate = lastActive ? new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate()) : null;
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (lastActiveDate && lastActiveDate.getTime() === todayDate.getTime()) {
      // Already counted activity today - just update lastActivityDate, don't double increment
      await User.findByIdAndUpdate(userId, { $set: { lastActivityDate: new Date() } });
      return;
    }

    if (lastActiveDate && lastActiveDate.getTime() === yesterday.getTime()) {
      // Consecutive day - increment streak
      await User.findByIdAndUpdate(userId, {
        $inc: { streak: 1 },
        $max: { longestStreak: user.streak + 1 },
        $set: { lastActivityDate: new Date() }
      });
    } else {
      // First activity in a while - start new streak
      await User.findByIdAndUpdate(userId, {
        $set: { streak: 1, lastActivityDate: new Date() },
        $max: { longestStreak: 1 }
      });
    }

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

    const validMetrics = ['points', 'casesAnalyzed', 'upvotesReceived', 'averageRating', 'streak', 'mentorScore'];
    const sortMetric = validMetrics.includes(metric as string) ? metric as string : 'points';
    const limitNum = Math.max(1, Math.min(Number(limit) || 50, 100));

    const filter: any = { userType, isActive: true };

    if (userType === 'doctor' && sortMetric === 'mentorScore') {
      const doctors = await User.find(filter)
        .select('firstName lastName profilePicture points casesAnalyzed upvotesReceived averageRating streak specialization experience mentoringCredits isVerifiedDoctor');

      const doctorsWithMentorStats = await Promise.all(
        doctors.map(async (doctor) => ({
          ...doctor.toObject(),
          mentorStats: await calculateMentorStats(doctor)
        }))
      );

      const leaderboardWithRanks = doctorsWithMentorStats
        .sort((a, b) => b.mentorStats.mentorScore - a.mentorStats.mentorScore)
        .slice(0, limitNum)
        .map((doctor, index) => ({
          ...doctor,
          rank: index + 1
        }));

      return res.json({
        success: true,
        data: {
          leaderboard: leaderboardWithRanks,
          metric: sortMetric,
          total: leaderboardWithRanks.length
        }
      });
    }

    const sort: any = {};
    sort[sortMetric] = -1;

    const leaderboard = await User.find(filter)
      .select('firstName lastName profilePicture points casesAnalyzed upvotesReceived averageRating streak medicalSchool specialization')
      .sort(sort)
      .limit(limitNum);

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

// Get doctor mentor reputation summary
export const getDoctorMentorSummary = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const doctor = await User.findOne({ _id: userId, userType: 'doctor', isActive: true })
      .select('-password');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const mentorStats = await calculateMentorStats(doctor);

    res.json({
      success: true,
      data: {
        doctor: {
          _id: doctor._id,
          firstName: doctor.firstName,
          lastName: doctor.lastName,
          specialization: doctor.specialization,
          isVerifiedDoctor: doctor.isVerifiedDoctor
        },
        mentorStats
      }
    });
  } catch (error) {
    console.error('Get doctor mentor summary error:', error);
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
    if (req.user!.userType !== 'admin' && (req.user!.userType !== 'doctor' || !req.user!.isVerifiedDoctor)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins or verified doctors can verify other doctors'
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
    if (!doctor || (doctor.userType !== 'doctor' && doctor.userType !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Only doctors or admins can award points.' });
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

    const [me, other] = await Promise.all([
      User.findById(myId).select('following'),
      User.findById(userId).select('followers')
    ]);
    if (!me || !other) return res.status(404).json({ success: false, message: "User not found" });

    // Check if already following using $addToSet check to avoid duplicates
    if ((me.following ?? []).some((id: any) => id.toString() === userId)) {
      return res.status(400).json({ success: false, message: "Already following" });
    }

    await Promise.all([
      User.findByIdAndUpdate(myId, { $addToSet: { following: userId } }),
      User.findByIdAndUpdate(userId, { $addToSet: { followers: myId } })
    ]);

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

    await Promise.all([
      User.findByIdAndUpdate(myId, { $pull: { following: userId } }),
      User.findByIdAndUpdate(userId, { $pull: { followers: myId } })
    ]);

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

// Get basic public information of any user
export const getPublicProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('firstName lastName profilePicture userType specialization');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Parse uploaded resume and update user profile
export const parseResume = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No resume file uploaded'
      });
    }

    // 1. Extract raw text
    const text = await extractTextFromBuffer(file.buffer, file.mimetype, file.originalname);
    
    // 2. Parse details
    const parsedData = parseResumeText(text);

    // 3. Update the logged-in user profile in DB directly
    const user = await User.findById(req.user!._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Auto-populate / merge fields
    if (parsedData.skills && parsedData.skills.length > 0) {
      user.skills = Array.from(new Set([...(user.skills || []), ...parsedData.skills]));
    }
    if (parsedData.medicalSchool && !user.medicalSchool) {
      user.medicalSchool = parsedData.medicalSchool;
    }
    if (parsedData.experience > 0 && !user.experience) {
      user.experience = parsedData.experience;
    }
    if (parsedData.bio && (!user.bio || user.bio.length < 50)) {
      user.bio = parsedData.bio;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Resume parsed and profile updated successfully',
      data: {
        extracted: parsedData,
        user: {
          skills: user.skills,
          medicalSchool: user.medicalSchool,
          experience: user.experience,
          bio: user.bio
        }
      }
    });

  } catch (error: any) {
    console.error('Resume parsing error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error during resume parsing'
    });
  }
};
