import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import Conversation from "../models/Conversation";
import Message from "../models/Message";
import User from "../models/User";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { emitToUser } from "../utils/socket";

// Get all conversations for a user
export const getConversations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id;

  const conversations = await Conversation.find({
    participants: userId
  })
    .populate('participants', 'firstName lastName profilePicture userType isVerifiedDoctor')
    .sort({ updatedAt: -1 });

  res.json({
    success: true,
    data: {
      conversations
    }
  });
});

// Get messages for a conversation
export const getMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { conversationId } = req.params;
  const userId = req.user?._id;

  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId
  });

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  const messages = await Message.find({ conversationId })
    .populate('sender', 'firstName lastName profilePicture')
    .sort({ createdAt: 1 });

  // Check if there are unread messages to mark as read
  const unreadCount = await Message.countDocuments({
    conversationId,
    sender: { $ne: userId },
    readAt: null
  });

  if (unreadCount > 0) {
    await Message.updateMany(
      { conversationId, sender: { $ne: userId }, readAt: null },
      { readAt: new Date() }
    );

    // Notify the sender that messages have been read
    const otherParticipant = conversation.participants.find(
      (p) => p.toString() !== userId?.toString()
    );
    if (otherParticipant) {
      emitToUser(otherParticipant.toString(), 'messages_read', {
        conversationId,
        readBy: userId
      });
    }
  }

  res.json({
    success: true,
    data: {
      messages
    }
  });
});

// Mark messages as read manually/in real-time
export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { conversationId } = req.params;
  const userId = req.user?._id;

  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId
  });

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  const result = await Message.updateMany(
    { conversationId, sender: { $ne: userId }, readAt: null },
    { readAt: new Date() }
  );

  if (result.modifiedCount > 0) {
    const otherParticipant = conversation.participants.find(
      (p) => p.toString() !== userId?.toString()
    );
    if (otherParticipant) {
      emitToUser(otherParticipant.toString(), 'messages_read', {
        conversationId,
        readBy: userId
      });
    }
  }

  res.json({
    success: true,
    message: "Messages marked as read"
  });
});

// Send a message
export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { receiverId, content } = req.body;
  const senderId = req.user?._id;
  const trimmedContent = typeof content === 'string' ? content.trim() : '';

  if (!senderId) {
    throw new AppError("Unauthorized", 401);
  }

  if (!trimmedContent) {
    throw new AppError("Message content is required", 400);
  }

  if (senderId.toString() === receiverId) {
    throw new AppError("You cannot message yourself", 400);
  }

  const receiver = await User.findById(receiverId);
  if (!receiver) {
    throw new AppError("Recipient not found", 404);
  }

  const sender = await User.findById(senderId);

  // Check privacy settings
  if (receiver.messagePrivacy === 'none') {
    throw new AppError("This user is not accepting direct messages", 403);
  }
  if (receiver.messagePrivacy === 'verified_only') {
    // Both isVerified (general) or isVerifiedDoctor can be checked. 
    // Let's assume isVerifiedDoctor or isVerified.
    if (!sender?.isVerifiedDoctor && !sender?.isVerified) {
      throw new AppError("This user only accepts messages from verified users", 403);
    }
  }

  // Find or create conversation
  let conversation = await Conversation.findOne({
    participants: { $all: [senderId, receiverId] }
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [senderId, receiverId]
    });
  }

  const message = await Message.create({
    conversationId: conversation._id,
    sender: senderId,
    content: trimmedContent
  });

  conversation.lastMessage = trimmedContent;
  conversation.updatedAt = new Date();
  await conversation.save();

  await message.populate('sender', 'firstName lastName profilePicture');

  // Emit to receiver
  emitToUser(receiverId.toString(), 'new_message', {
    message,
    conversationId: conversation._id
  });

  res.status(201).json({
    success: true,
    data: {
      message,
      conversationId: conversation._id
    }
  });
});
