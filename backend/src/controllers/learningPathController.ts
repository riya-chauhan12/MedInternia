import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import LearningPath from '../models/LearningPath';
import UserLearningPath from '../models/UserLearningPath';
import UserBadge from '../models/UserBadge';
import User from '../models/User';
import Badge from '../models/Badge';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { createAndEmitNotification } from './notificationController';

// Get all learning paths
export const getLearningPaths = asyncHandler(async (req: AuthRequest, res: Response) => {
  const paths = await LearningPath.find({ isActive: true })
    .populate('badge', 'name icon category color')
    .sort({ createdAt: -1 });

  let userProgress: any[] = [];
  if (req.user) {
    userProgress = await UserLearningPath.find({ user: req.user._id });
  }

  const pathsWithProgress = paths.map(path => {
    const progress = userProgress.find(p => String(p.learningPath) === String(path._id));
    return {
      ...path.toObject(),
      progress: progress || null
    };
  });

  res.json({
    success: true,
    data: {
      learningPaths: pathsWithProgress
    }
  });
});

// Get learning path by id
export const getLearningPathById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const path = await LearningPath.findById(id)
    .populate('badge', 'name icon category color description')
    .populate({
      path: 'steps.caseRef',
      select: 'title description difficulty specialization tags images'
    });

  if (!path) {
    throw new AppError('Learning path not found', 404);
  }

  let progress = null;
  if (req.user) {
    progress = await UserLearningPath.findOne({ user: req.user._id, learningPath: id });
  }

  res.json({
    success: true,
    data: {
      learningPath: path,
      progress
    }
  });
});

// Enroll in a learning path
export const enrollInPath = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const { id } = req.params;

  const path = await LearningPath.findById(id);
  if (!path) {
    throw new AppError('Learning path not found', 404);
  }

  const existingEnrollment = await UserLearningPath.findOne({ user: req.user._id, learningPath: id });
  if (existingEnrollment) {
    throw new AppError('Already enrolled in this learning path', 400);
  }

  const userPath = await UserLearningPath.create({
    user: req.user._id,
    learningPath: id,
    completedSteps: [],
    isCompleted: false
  });

  res.status(201).json({
    success: true,
    message: 'Successfully enrolled in learning path',
    data: {
      progress: userPath
    }
  });
});

// Complete a step
export const completeStep = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const { id } = req.params;
  const { stepIndex, answerIndex } = req.body;

  const path = await LearningPath.findById(id);
  if (!path) {
    throw new AppError('Learning path not found', 404);
  }

  const progress = await UserLearningPath.findOne({ user: req.user._id, learningPath: id });
  if (!progress) {
    throw new AppError('Not enrolled in this learning path', 400);
  }

  if (stepIndex < 0 || stepIndex >= path.steps.length) {
    throw new AppError('Invalid step index', 400);
  }

  if (progress.completedSteps.includes(stepIndex)) {
    return res.json({
      success: true,
      message: 'Step already completed',
      data: { progress }
    });
  }

  const step = path.steps[stepIndex];
  
  // Validate quiz answer if it's a quiz
  if (step.type === 'quiz' && step.quiz) {
    if (answerIndex !== step.quiz.correctAnswer) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect answer',
        isCorrect: false
      });
    }
  }

  progress.completedSteps.push(stepIndex);

  let badgeAwarded = false;
  let newlyCompleted = false;

  // Check if path is fully completed
  if (!progress.isCompleted && progress.completedSteps.length === path.steps.length) {
    progress.isCompleted = true;
    progress.completedAt = new Date();
    newlyCompleted = true;

    // Award badge
    if (path.badge) {
      const existingUserBadge = await UserBadge.findOne({ user: req.user._id, badge: path.badge });
      if (!existingUserBadge) {
        await UserBadge.create({
          user: req.user._id,
          badge: path.badge,
          verifiedBy: req.user._id // self verified by system
        });
        
        // Also update User badges array and points
        await User.findByIdAndUpdate(req.user._id, {
          $addToSet: { badges: path.badge },
          $inc: { points: 50 } // Give 50 points for completing a path
        });

        badgeAwarded = true;
        
        // Fetch badge to get name for notification
        const badgeObj = await Badge.findById(path.badge);
        
        if (badgeObj) {
          await createAndEmitNotification({
            recipientId: String(req.user._id),
            type: 'badge',
            message: `Congratulations! You've completed "${path.title}" and earned the ${badgeObj.name} badge!`,
            link: `/profile`
          });
        }
      }
    }
  }

  await progress.save();

  res.json({
    success: true,
    message: 'Step completed',
    isCorrect: true, // For quiz context
    data: {
      progress,
      pathCompleted: newlyCompleted,
      badgeAwarded
    }
  });
});
