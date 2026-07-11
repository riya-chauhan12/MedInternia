import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Webinar from '../models/Webinar';
import Notification from '../models/Notification';
import User from '../models/User';
import { getSocketIO } from '../utils/socket';

const getWebinarEndTime = (webinar: { scheduledAt: Date; duration?: number }) => {
  const durationInMinutes = webinar.duration || 0;
  return new Date(new Date(webinar.scheduledAt).getTime() + durationInMinutes * 60 * 1000);
};

const isWebinarExpired = (webinar: { scheduledAt: Date; duration?: number; status: string }) => {
  const now = new Date();

  if (webinar.status === 'completed' || webinar.status === 'cancelled') {
    return true;
  }

  if (webinar.status === 'live') {
    return getWebinarEndTime(webinar) <= now;
  }

  return new Date(webinar.scheduledAt) <= now;
};

const syncExpiredWebinars = async () => {
  const now = new Date();

  await Webinar.updateMany(
    {
      status: 'scheduled',
      scheduledAt: { $lte: now }
    },
    { $set: { status: 'completed' } }
  );

  const liveWebinars = await Webinar.find({ status: 'live' }).select('scheduledAt duration status');
  const expiredLiveIds = liveWebinars
    .filter(webinar => isWebinarExpired(webinar))
    .map(webinar => webinar._id);

  if (expiredLiveIds.length > 0) {
    await Webinar.updateMany(
      { _id: { $in: expiredLiveIds } },
      { $set: { status: 'completed' } }
    );
  }
};

// Create webinar
export const createWebinar = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      type,
      specialization,
      scheduledAt,
      duration,
      maxParticipants,
      registrationDeadline,
      materials,
      tags
    } = req.body;

    // Webinar managers can create webinars after route-level permission checks.
    if (req.user!.userType !== 'doctor' && req.user!.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors or admins can create webinars'
      });
    }

    const webinar = new Webinar({
      title,
      description,
      host: req.user!._id,
      type,
      specialization,
      scheduledAt,
      duration,
      maxParticipants,
      registrationDeadline,
      materials,
      tags,
      meetingLink: `https://meet.jit.si/webinar-${new Date().getTime()}-${Math.floor(Math.random()*10000)}`
    });

    await webinar.save();
    await webinar.populate('host', 'firstName lastName specialization isVerifiedDoctor');

    // Ensure webinar.host is a populated document
    const host = webinar.host as any;

    // Respond immediately — notify interns asynchronously in batches
    setImmediate(async () => {
      try {
        const internIds = await User.find({ userType: 'intern' }).select('_id');
        const batchSize = 500;
        for (let i = 0; i < internIds.length; i += batchSize) {
          const batch = internIds.slice(i, i + batchSize).map(intern => ({
            recipient: intern._id,
            message: `New webinar scheduled: ${webinar.title} by ${host.firstName} ${host.lastName}`,
            type: 'webinar',
            link: webinar.meetingLink
          }));
          await Notification.insertMany(batch);
        }
      } catch (notifyErr) {
        console.error('Failed to send webinar notifications:', notifyErr);
      }
    });

    res.status(201).json({
      success: true,
      message: 'Webinar created successfully',
      data: { webinar, meetingLink: webinar.meetingLink }
    });
  } catch (error: any) {
    console.error('Create webinar error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all webinars with filtering
export const getWebinars = async (req: Request, res: Response) => {
  try {
    await syncExpiredWebinars();

    const {
      type,
      specialization,
      status,
      upcoming,
      page = 1,
      limit = 10,
      sortBy = 'scheduledAt',
      sortOrder = 'asc'
    } = req.query;

    const filter: any = { isActive: true };
    
    if (type) filter.type = type;
    if (specialization) filter.specialization = { $in: [specialization] };
    if (status) filter.status = status;
    
    if (upcoming === 'true') {
      const now = new Date();
      filter.status = { $in: ['scheduled', 'live'] };
      filter.$or = [
        { scheduledAt: { $gt: now } },
        { status: 'live' }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    let webinars;

    if (sortBy === 'most_registered') {
      webinars = await Webinar.aggregate([
        { $match: filter },
        { $addFields: { participantCount: { $size: { $ifNull: ["$participants", []] } } } },
        { $sort: { participantCount: -1, scheduledAt: 1 } },
        { $skip: skip },
        { $limit: Number(limit) }
      ]);
      webinars = await Webinar.populate(webinars, [
        { path: 'host', select: 'firstName lastName specialization isVerifiedDoctor profilePicture' }
      ]);
    } else if (sortBy === 'highest_rated') {
      webinars = await Webinar.aggregate([
        { $match: filter },
        { 
          $addFields: { 
            avgRating: { 
              $avg: "$participants.feedback.rating" 
            } 
          } 
        },
        { $sort: { avgRating: -1, scheduledAt: 1 } },
        { $skip: skip },
        { $limit: Number(limit) }
      ]);
      webinars = await Webinar.populate(webinars, [
        { path: 'host', select: 'firstName lastName specialization isVerifiedDoctor profilePicture' }
      ]);
    } else {
      const sort: any = {};
      sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;
      webinars = await Webinar.find(filter)
        .populate('host', 'firstName lastName specialization isVerifiedDoctor profilePicture')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit));
    }

    const total = await Webinar.countDocuments(filter);

    res.json({
      success: true,
      data: {
        webinars,
        total,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page)
      }
    });
  } catch (error: any) {
    console.error('Get webinars error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get webinar by ID
export const getWebinarById = async (req: Request, res: Response) => {
  try {
    await syncExpiredWebinars();

    const { id } = req.params;

    const webinar = await Webinar.findById(id)
      .populate('host', 'firstName lastName specialization isVerifiedDoctor profilePicture bio')
      .populate('participants.user', 'firstName lastName userType profilePicture');

    if (!webinar) {
      return res.status(404).json({
        success: false,
        message: 'Webinar not found'
      });
    }

    res.json({
      success: true,
      data: { webinar }
    });
  } catch (error: any) {
    console.error('Get webinar error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Register for webinar
export const registerForWebinar = async (req: AuthRequest, res: Response) => {
  try {
    await syncExpiredWebinars();

    const { id } = req.params;
    const userId = req.user!._id;

    const webinar = await Webinar.findById(id);
    if (!webinar) {
      return res.status(404).json({
        success: false,
        message: 'Webinar not found'
      });
    }

    if (isWebinarExpired(webinar) || webinar.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'This webinar has expired and registration is closed'
      });
    }

    // Check if registration is still open
    if (webinar.registrationDeadline && new Date() > webinar.registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed'
      });
    }

    // Check if webinar is full
    if (webinar.maxParticipants && webinar.participants.length >= webinar.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Webinar is full'
      });
    }

    // Check if user is already registered
    const isAlreadyRegistered = webinar.participants.some(
      p => (p.user as any).toString() === (userId as any).toString()
    );

    if (isAlreadyRegistered) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this webinar'
      });
    }

    webinar.participants.push({
      user: userId as any,
      registeredAt: new Date(),
      attended: false
    });

    await webinar.save();

    res.json({
      success: true,
      message: 'Successfully registered for webinar',
      data: { webinar }
    });
  } catch (error: any) {
    console.error('Register for webinar error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Unregister from webinar
export const unregisterFromWebinar = async (req: AuthRequest, res: Response) => {
  try {
    await syncExpiredWebinars();

    const { id } = req.params;
    const userId = (req.user!._id as any).toString();

    const webinar = await Webinar.findById(id);
    if (!webinar) {
      return res.status(404).json({
        success: false,
        message: 'Webinar not found'
      });
    }

    // Check if webinar has already started
    if (webinar.status === 'live' || webinar.status === 'completed' || new Date(webinar.scheduledAt) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot unregister from a webinar that has started or completed'
      });
    }

    const participantIndex = webinar.participants.findIndex(
      p => (p.user as any).toString() === userId
    );

    if (participantIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'You are not registered for this webinar'
      });
    }

    webinar.participants.splice(participantIndex, 1);
    await webinar.save();

    res.json({
      success: true,
      message: 'Successfully unregistered from webinar'
    });
  } catch (error: any) {
    console.error('Unregister from webinar error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update webinar
export const updateWebinar = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const hostId = (req.user!._id as any).toString();

    const webinar = await Webinar.findOne({ _id: id, host: hostId });
    if (!webinar) {
      return res.status(404).json({
        success: false,
        message: 'Webinar not found or you are not authorized to update it'
      });
    }

    Object.assign(webinar, updateData);
    await webinar.save();
    await webinar.populate('host', 'firstName lastName specialization');

    res.json({
      success: true,
      message: 'Webinar updated successfully',
      data: { webinar }
    });
  } catch (error: any) {
    console.error('Update webinar error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Mark attendance
export const markAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, attended } = req.body;
    const hostId = (req.user!._id as any).toString();

    const webinar = await Webinar.findOne({ _id: id, host: hostId });
    if (!webinar) {
      return res.status(404).json({
        success: false,
        message: 'Webinar not found or you are not authorized to mark attendance'
      });
    }

    const participant = webinar.participants.find(
      p => (p.user as any).toString() === userId
    );

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    participant.attended = attended;
    await webinar.save();

    res.json({
      success: true,
      message: 'Attendance marked successfully'
    });
  } catch (error: any) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Submit feedback
export const submitFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, comments } = req.body;
    const userId = (req.user!._id as any).toString();

    const webinar = await Webinar.findById(id);
    if (!webinar) {
      return res.status(404).json({
        success: false,
        message: 'Webinar not found'
      });
    }

    const participant = webinar.participants.find(
      p => (p.user as any).toString() === userId
    );

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'You are not registered for this webinar'
      });
    }

    if (!participant.attended) {
      return res.status(400).json({
        success: false,
        message: 'You must attend the webinar to provide feedback'
      });
    }

    participant.feedback = { rating, comments };
    await webinar.save();

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });
  } catch (error: any) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user's webinars (hosted and attended)
export const getUserWebinars = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { type = 'all' } = req.query; // 'hosted', 'attended', 'registered', 'all'

    let query: any = {};
    
    if (type === 'hosted') {
      query = { host: userId };
    } else if (type === 'attended') {
      query = { 'participants.user': userId, 'participants.attended': true };
    } else if (type === 'registered') {
      query = { 'participants.user': userId };
    } else {
      // Get all webinars user is involved with
      query = {
        $or: [
          { host: userId },
          { 'participants.user': userId }
        ]
      };
    }

    const webinars = await Webinar.find(query)
      .populate('host', 'firstName lastName specialization')
      .sort({ scheduledAt: -1 });

    res.json({
      success: true,
      data: {
        webinars,
        total: webinars.length
      }
    });
  } catch (error: any) {
    console.error('Get user webinars error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Generate meeting link (for integration with video conferencing)
export const generateMeetingLink = async (req: AuthRequest, res: Response) => {
  try {
    await syncExpiredWebinars();

    const { id } = req.params;
    const hostId = (req.user!._id as any).toString();

    const webinar = await Webinar.findOne({ _id: id, host: hostId });
    if (!webinar) {
      return res.status(404).json({
        success: false,
        message: 'Webinar not found or you are not authorized'
      });
    }

    if (isWebinarExpired(webinar)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot generate a meeting link for an expired webinar'
      });
    }

    // Generate a simple meeting link (in production, integrate with Zoom, Google Meet, etc.)
    const meetingLink = `https://meet.example.com/webinar-${webinar._id}`;
    
    webinar.meetingLink = meetingLink;
    webinar.status = 'live';
    await webinar.save();

    res.json({
      success: true,
      message: 'Meeting link generated successfully',
      data: { 
        meetingLink,
        webinar 
      }
    });
  } catch (error: any) {
    console.error('Generate meeting link error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ------------------------------------------------------------------
// POLLING CONTROLLERS
// ------------------------------------------------------------------

export const createPoll = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { question, options } = req.body;
    
    if (req.user!.userType !== 'doctor' && req.user!.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const webinar = await Webinar.findById(id);
    if (!webinar) return res.status(404).json({ success: false, message: 'Webinar not found' });
    if (webinar.host.toString() !== String(req.user!._id) && req.user!.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the host can create polls' });
    }

    webinar.polls.push({
      question,
      options,
      active: true,
      votes: new Map(),
      createdAt: new Date()
    });

    await webinar.save();

    const io = getSocketIO();
    if (io) io.to(`webinar:${id}`).emit('webinar_update', webinar);

    res.status(201).json({ success: true, data: webinar });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const votePoll = async (req: AuthRequest, res: Response) => {
  try {
    const { id, pollId } = req.params;
    const { optionIndex } = req.body;
    const userId = String(req.user!._id);

    const webinar = await Webinar.findById(id);
    if (!webinar) return res.status(404).json({ success: false, message: 'Webinar not found' });

    const poll = webinar.polls.find(p => p._id?.toString() === pollId);
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found' });
    if (!poll.active) return res.status(400).json({ success: false, message: 'Poll is closed' });

    poll.votes.set(userId, optionIndex);
    await webinar.save();

    const io = getSocketIO();
    if (io) io.to(`webinar:${id}`).emit('webinar_update', webinar);

    res.json({ success: true, data: webinar });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const closePoll = async (req: AuthRequest, res: Response) => {
  try {
    const { id, pollId } = req.params;

    const webinar = await Webinar.findById(id);
    if (!webinar) return res.status(404).json({ success: false, message: 'Webinar not found' });
    if (webinar.host.toString() !== String(req.user!._id) && req.user!.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the host can close polls' });
    }

    const poll = webinar.polls.find(p => p._id?.toString() === pollId);
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found' });

    poll.active = false;
    await webinar.save();

    const io = getSocketIO();
    if (io) io.to(`webinar:${id}`).emit('webinar_update', webinar);

    res.json({ success: true, data: webinar });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ------------------------------------------------------------------
// Q&A CONTROLLERS
// ------------------------------------------------------------------

export const askQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { question } = req.body;

    const webinar = await Webinar.findById(id);
    if (!webinar) return res.status(404).json({ success: false, message: 'Webinar not found' });

    webinar.qna.push({
      question,
      author: req.user!._id,
      upvotes: [],
      isAnswered: false,
      createdAt: new Date()
    });

    await webinar.save();
    await webinar.populate('qna.author', 'firstName lastName profilePicture');

    const io = getSocketIO();
    if (io) io.to(`webinar:${id}`).emit('webinar_update', webinar);

    res.status(201).json({ success: true, data: webinar });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const upvoteQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id, qnaId } = req.params;
    const userId = req.user!._id;

    const webinar = await Webinar.findById(id);
    if (!webinar) return res.status(404).json({ success: false, message: 'Webinar not found' });

    const question = webinar.qna.find(q => q._id?.toString() === qnaId);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    const upvoteIndex = question.upvotes.findIndex((v: any) => v.toString() === (userId as any).toString());
    if (upvoteIndex > -1) {
      question.upvotes.splice(upvoteIndex, 1);
    } else {
      question.upvotes.push(userId as any);
    }

    await webinar.save();
    await webinar.populate('qna.author', 'firstName lastName profilePicture');

    const io = getSocketIO();
    if (io) io.to(`webinar:${id}`).emit('webinar_update', webinar);

    res.json({ success: true, data: webinar });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const markQuestionAnswered = async (req: AuthRequest, res: Response) => {
  try {
    const { id, qnaId } = req.params;

    const webinar = await Webinar.findById(id);
    if (!webinar) return res.status(404).json({ success: false, message: 'Webinar not found' });
    if (webinar.host.toString() !== String(req.user!._id) && req.user!.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the host can mark questions answered' });
    }

    const question = webinar.qna.find(q => q._id?.toString() === qnaId);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    question.isAnswered = true;
    await webinar.save();
    await webinar.populate('qna.author', 'firstName lastName profilePicture');

    const io = getSocketIO();
    if (io) io.to(`webinar:${id}`).emit('webinar_update', webinar);

    res.json({ success: true, data: webinar });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
