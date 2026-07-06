import { createAndEmitNotification } from './notificationController';
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import JobOpportunity from '../models/JobOpportunity';
import User from '../models/User';
import UserBadge from '../models/UserBadge';

// Create job opportunity (doctors and admins only)
export const createJobOpportunity = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      company,
      location,
      type,
      specialization,
      description,
      requirements,
      salary,
      applicationDeadline,
      contactEmail,
      externalUrl
    } = req.body;

    // Job managers can post after route-level permission checks.
    if (req.user!.userType !== 'doctor' && req.user!.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors or admins can post job opportunities'
      });
    }

    const jobOpportunity = new JobOpportunity({
      title,
      company,
      location,
      type,
      specialization,
      description,
      requirements,
      salary,
      applicationDeadline,
      contactEmail,
      externalUrl,
      postedBy: req.user!._id
    });

    await jobOpportunity.save();
    await jobOpportunity.populate('postedBy', 'firstName lastName specialization');

    res.status(201).json({
      success: true,
      message: 'Job opportunity created successfully',
      data: { jobOpportunity }
    });
  } catch (error) {
    console.error('Create job opportunity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all job opportunities with filtering
export const getJobOpportunities = async (req: Request, res: Response) => {
  try {
    const {
      type,
      specialization,
      location,
      isRemote,
      isActive,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter: any = {};
    if (type) filter.type = type;
    if (specialization) filter.specialization = { $in: [specialization] };
    if (location) {
      filter.$or = [
        { 'location.city': new RegExp(location as string, 'i') },
        { 'location.state': new RegExp(location as string, 'i') },
        { 'location.country': new RegExp(location as string, 'i') }
      ];
    }
    if (isRemote !== undefined) filter['location.isRemote'] = isRemote === 'true';
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Filter out expired opportunities
    filter.applicationDeadline = { $gte: new Date() };

    const skip = (Number(page) - 1) * Number(limit);
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const jobOpportunities = await JobOpportunity.find(filter)
      .populate('postedBy', 'firstName lastName specialization isVerifiedDoctor')
      .populate('requirements.requiredBadges', 'name description icon')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await JobOpportunity.countDocuments(filter);

    res.json({
      success: true,
      data: { jobOpportunities, total, page, totalPages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    console.error('Get job opportunities error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get job opportunity by ID
export const getJobOpportunityById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const jobOpportunity = await JobOpportunity.findById(id)
      .populate('postedBy', 'firstName lastName specialization isVerifiedDoctor profilePicture')
      .populate('requirements.requiredBadges', 'name description icon color');

    if (!jobOpportunity) {
      return res.status(404).json({
        success: false,
        message: 'Job opportunity not found'
      });
    }

    res.json({
      success: true,
      data: { jobOpportunity }
    });
  } catch (error) {
    console.error('Get job opportunity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Fields a job owner is allowed to edit via updateJobOpportunity.
// System-managed fields such as postedBy, applicants, and applications
// are intentionally excluded from this allow-list.
const JOB_UPDATABLE_FIELDS = [
  'title', 'company', 'location', 'type', 'specialization',
  'description', 'requirements', 'salary', 'applicationDeadline',
  'contactEmail', 'externalUrl', 'isActive'
] as const;

export const updateJobOpportunity = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req.user!._id as any).toString();

    const jobOpportunity = await JobOpportunity.findOne({
      _id: id, 
      postedBy: userId
    });

    if (!jobOpportunity) {
      return res.status(404).json({
        success: false,
        message: 'Job opportunity not found or you are not authorized to update it'
      });
    }
    
    for (const field of JOB_UPDATABLE_FIELDS) {
      if (req.body[field] !== undefined) {
        (jobOpportunity as any)[field] = req.body[field];
      }
    }
    await jobOpportunity.save();
    await jobOpportunity.populate('postedBy', 'firstName lastName specialization');

    res.json({
      success: true,
      message: 'Job opportunity updated successfully',
      data: { jobOpportunity }
    });
  } catch (error) {
    console.error('Update job opportunity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete job opportunity
export const deleteJobOpportunity = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req.user!._id as any).toString();

    const jobOpportunity = await JobOpportunity.findOne({
      _id: id,
      postedBy: userId
    });

    if (!jobOpportunity) {
      return res.status(404).json({
        success: false,
        message: 'Job opportunity not found or you are not authorized to delete it'
      });
    }

    await JobOpportunity.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Job opportunity deleted successfully'
    });
  } catch (error) {
    console.error('Delete job opportunity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Check if user is eligible for job
export const checkJobEligibility = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const jobOpportunity = await JobOpportunity.findById(id)
      .populate('requirements.requiredBadges');

    if (!jobOpportunity) {
      return res.status(404).json({
        success: false,
        message: 'Job opportunity not found'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const eligibility = {
      isEligible: true,
      reasons: [] as string[],
      pointsRequirement: {
        required: jobOpportunity.requirements.minimumPoints || 0,
        current: user.points,
        meets: user.points >= (jobOpportunity.requirements.minimumPoints || 0)
      },
      badgeRequirements: [] as any[]
    };

    // Check points requirement
    if (!eligibility.pointsRequirement.meets) {
      eligibility.isEligible = false;
      eligibility.reasons.push(`Minimum ${jobOpportunity.requirements.minimumPoints} points required`);
    }

    // Check badge requirements
    if (jobOpportunity.requirements.requiredBadges?.length) {
      const userBadges = await UserBadge.find({ user: userId })
        .populate('badge')
        .select('badge');

      const userBadgeIds = userBadges.map(ub => (ub.badge as any)._id.toString());

      for (const requiredBadge of jobOpportunity.requirements.requiredBadges) {
        const badgeId = (requiredBadge as any)._id.toString();
        const hasBadge = userBadgeIds.includes(badgeId);
        
        eligibility.badgeRequirements.push({
          badge: requiredBadge,
          required: true,
          hasIt: hasBadge
        });

        if (!hasBadge) {
          eligibility.isEligible = false;
          eligibility.reasons.push(`Required badge: ${(requiredBadge as any).name}`);
        }
      }
    }

    res.json({
      success: true,
      data: { eligibility }
    });
  } catch (error) {
    console.error('Check job eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Apply to job (records applicant identity, prevents duplicate applications)
export const applyToJob = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req.user!._id as any).toString();

    // 1. Fetch the requested job and validate it exists.
    const existingJob = await JobOpportunity.findById(id);

    if (!existingJob) {
      return res.status(404).json({
        success: false,
        message: 'Job opportunity not found'
      });
    }

    // 2. Prevent duplicate applications (fast-path check for a clean 409
    //    message; the atomic update below is what actually enforces this
    //    under concurrent requests).
    const alreadyApplied = existingJob.applicants.some(
      (applicant) => applicant.user.toString() === userId
    );

    if (alreadyApplied) {
      return res.status(409).json({
        success: false,
        message: 'You have already applied to this job.'
      });
    }

    // 3 & 4. Store applicant info and increment the count in a single
    //    atomic operation. The filter re-checks 'applicants.user' is not
    //    already present, so concurrent duplicate requests from the same
    //    user cannot both succeed — only one can match this condition.
    const jobOpportunity = await JobOpportunity.findOneAndUpdate(
      {
        _id: id,
        'applicants.user': { $ne: userId }
      },
      {
        $push: { applicants: { user: userId, appliedAt: new Date() } },
        $inc: { applications: 1 }
      },
      { new: true }
    ).populate('postedBy', 'firstName lastName specialization');

    if (!jobOpportunity) {
      // Lost the race to a concurrent request from the same user.
      return res.status(409).json({
        success: false,
        message: 'You have already applied to this job.'
      });
    }

    // Notify the job poster that someone applied
    if (jobOpportunity.postedBy) {
      const poster = jobOpportunity.postedBy as any;
      await createAndEmitNotification({
        recipientId: poster._id.toString(),
        type:        'job_status',
        message:     `Someone applied to your job posting: "${jobOpportunity.title}"`,
        link:        `/jobs/${(jobOpportunity._id as any).toString()}`,
        payload:     { jobId: (jobOpportunity._id as any).toString() },
      });
    }

    // 5. Return the updated job information exactly as before.
    res.json({
      success: true,
      message: 'Application recorded successfully',
      data: { jobOpportunity }
    });
  } catch (error) {
    console.error('Apply to job error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get job opportunities posted by doctor
export const getMyJobOpportunities = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { isActive } = req.query;

    const filter: any = { postedBy: userId };
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const jobOpportunities = await JobOpportunity.find(filter)
      .populate('requirements.requiredBadges', 'name description icon')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        jobOpportunities,
        total: jobOpportunities.length
      }
    });
  } catch (error) {
    console.error('Get my job opportunities error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
