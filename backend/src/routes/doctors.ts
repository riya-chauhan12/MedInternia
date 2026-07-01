import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Get all doctors
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { specialization } = req.query;
    
    const filter: any = { userType: 'doctor', isActive: true };
    if (specialization) {
      filter.specialization = { $regex: specialization, $options: 'i' };
    }

    const doctors = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        doctors,
        total: doctors.length
      }
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get doctor by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const doctor = await User.findOne({
      _id: id,
      userType: 'doctor',
      isActive: true
    }).select('-password');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      data: {
        doctor
      }
    });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update doctor professional information (only the doctor themselves)
router.put('/:id/professional-info', authenticate, authorize('doctor'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;
    const { specialization, experience, qualifications } = req.body;

    // Doctors can only update their own profile
    if ((currentUser._id as any).toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updateData: any = {};
    if (specialization !== undefined) updateData.specialization = specialization;
    if (experience !== undefined) updateData.experience = experience;
    if (qualifications !== undefined) updateData.qualifications = qualifications;

    const doctor = await User.findOneAndUpdate(
      { _id: id, userType: 'doctor' },
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      message: 'Professional information updated successfully',
      data: {
        doctor
      }
    });
  } catch (error) {
    console.error('Update doctor professional info error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get specializations list
router.get('/meta/specializations', authenticate, async (req: AuthRequest, res) => {
  try {
    const specializations = await User.distinct('specialization', {
      userType: 'doctor',
      isActive: true,
      specialization: { $exists: true, $ne: null }
    });

    res.json({
      success: true,
      data: {
        specializations
      }
    });
  } catch (error) {
    console.error('Get specializations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get mentees of a doctor
router.get('/:id/mentees', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const mentees = await User.find({ userType: 'intern', mentorDoctor: id, isActive: true })
      .select('firstName lastName email medicalSchool yearOfStudy points averageRating streak');
    res.json({
      success: true,
      data: {
        mentees
      }
    });
  } catch (error) {
    console.error('Get mentees error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
