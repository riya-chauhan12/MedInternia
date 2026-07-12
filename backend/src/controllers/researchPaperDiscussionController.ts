import { Response } from 'express';
import ResearchPaper from '../models/ResearchPaper';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';

export const addComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user as { _id: string } | undefined;
  if (!user) throw new AppError('User not authenticated', 401);

  const { id } = req.params;
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    throw new AppError('Comment content is required', 400);
  }

  const paper = await ResearchPaper.findById(id);
  if (!paper) throw new AppError('Research paper not found', 404);

  const comment = {
    author: user._id as any,
    content: content.trim(),
    replies: [],
    likes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  paper.comments.push(comment as any);
  await paper.save();

  const addedComment = paper.comments[paper.comments.length - 1];
  res.status(201).json({ success: true, data: { comment: addedComment } });
});

export const replyToComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user as { _id: string } | undefined;
  if (!user) throw new AppError('User not authenticated', 401);

  const { paperId, commentId } = req.params;
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    throw new AppError('Reply content is required', 400);
  }

  const paper = await ResearchPaper.findById(paperId);
  if (!paper) throw new AppError('Research paper not found', 404);

  const parentComment = paper.comments.find(
    (c: any) => c._id?.toString() === commentId,
  );
  if (!parentComment) throw new AppError('Comment not found', 404);

  const reply = {
    author: user._id as any,
    content: content.trim(),
    replies: [],
    likes: [],
    replyTo: (parentComment as any)._id,
    createdAt: new Date(),
    updatedAt: new Date(),
    _id: new mongoose.Types.ObjectId(),
  };

  paper.comments.push(reply as any);
  (parentComment as any).replies.push(reply._id);
  await paper.save();

  res.status(201).json({ success: true, data: { reply } });
});

import mongoose from 'mongoose';

export const likeComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user as { _id: string } | undefined;
  if (!user) throw new AppError('User not authenticated', 401);

  const { paperId, commentId } = req.params;
  const userIdObj = new mongoose.Types.ObjectId(user._id);

  let liked = false;
  const pullResult = await ResearchPaper.updateOne(
    { _id: paperId, 'comments._id': commentId },
    { $pull: { 'comments.$.likes': userIdObj } },
  );

  if (pullResult.modifiedCount === 0) {
    await ResearchPaper.updateOne(
      { _id: paperId, 'comments._id': commentId },
      { $addToSet: { 'comments.$.likes': userIdObj } },
    );
    liked = true;
  }

  const updated = await ResearchPaper.findById(paperId, {
    comments: { $elemMatch: { _id: commentId } },
  });
  const likes = ((updated?.comments as any)?.[0]?.likes as any[])?.length ?? 0;

  res.json({ success: true, message: liked ? 'Comment liked' : 'Comment unliked', data: { likes, liked } });
});

export const deleteComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user as { _id: string } | undefined;
  if (!user) throw new AppError('User not authenticated', 401);

  const { paperId, commentId } = req.params;

  const paper = await ResearchPaper.findById(paperId);
  if (!paper) throw new AppError('Research paper not found', 404);

  const commentIndex = paper.comments.findIndex(
    (c: any) => c._id?.toString() === commentId,
  );
  if (commentIndex === -1) throw new AppError('Comment not found', 404);

  const comment = paper.comments[commentIndex] as any;
  if (comment.author.toString() !== user._id.toString()) {
    throw new AppError('You can only delete your own comments', 403);
  }

  paper.comments.splice(commentIndex, 1);
  await paper.save();

  res.json({ success: true, message: 'Comment deleted successfully' });
});

export const getComments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { page = '1', limit = '20' } = req.query;

  const paper = await ResearchPaper.findById(id).populate(
    'comments.author',
    'firstName lastName',
  );
  if (!paper) throw new AppError('Research paper not found', 404);

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const totalComments = paper.comments.length;
  const paginatedComments = paper.comments.slice(skip, skip + limitNum);

  res.json({
    success: true,
    data: {
      comments: paginatedComments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalComments,
        pages: Math.ceil(totalComments / limitNum),
      },
    },
  });
});
