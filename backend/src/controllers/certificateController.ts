import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Certificate from '../models/Certificate';
import User from '../models/User';
import Case from '../models/Case';
import crypto from 'crypto';

// Generate certificate for intern
export const generateCertificate = async (req: AuthRequest, res: Response) => {
  try {
    const {
      internId,
      title,
      description,
      casesReviewed,
      pointsEarned,
      duration,
      skills
    } = req.body;

    const doctorId = req.user!._id;

    // Certificate issuers can generate certificates after route-level permission checks.
    const doctor = await User.findById(doctorId);
    if (!doctor || (doctor.userType !== 'doctor' && doctor.userType !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Only doctors or admins can generate certificates'
      });
    }

    if (doctor.userType !== 'admin' && (doctor.mentoringCredits || 0) < casesReviewed) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient mentoring credits'
      });
    }

    // Verify intern exists
    const intern = await User.findOne({ _id: internId, userType: 'intern' });
    if (!intern) {
      return res.status(404).json({
        success: false,
        message: 'Intern not found'
      });
    }

    // Generate unique certificate ID
    const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Generate verification hash
    const verificationHash = crypto
      .createHash('sha256')
      .update(certificateId + internId + doctorId + Date.now())
      .digest('hex');

    const session = await mongoose.startSession();
    let committed = false;
    let certificate: any;
    try {
      session.startTransaction();

      [certificate] = await Certificate.create([{
        intern: internId,
        doctor: doctorId,
        title,
        description,
        casesReviewed,
        pointsEarned,
        duration,
        skills,
        certificateId,
        verificationHash
      }], { session });

      // Deduct mentoring credits from doctor
      if (doctor.userType !== 'admin') {
        const updated = await User.findOneAndUpdate(
          { _id: doctorId, mentoringCredits: { $gte: casesReviewed } },
          { $inc: { mentoringCredits: -casesReviewed } },
          { new: true, session }
        );
        if (!updated) {
          await session.abortTransaction();
          committed = true;
          return res.status(400).json({
            success: false,
            message: 'Insufficient mentoring credits'
          });
        }
      }

      // Update intern's certificates count
      await User.findByIdAndUpdate(internId, {
        $inc: { certificatesEarned: 1 }
      }, { session });

      await session.commitTransaction();
      committed = true;

      await certificate.populate([
        { path: 'intern', select: 'firstName lastName email' },
        { path: 'doctor', select: 'firstName lastName specialization' }
      ]);
    } finally {
      if (!committed) await session.abortTransaction();
      session.endSession();
    }

    res.status(201).json({
      success: true,
      message: 'Certificate generated successfully',
      data: { certificate }
    });
  } catch (error) {
    console.error('Generate certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get certificates for user
export const getUserCertificates = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const certificates = await Certificate.find({ intern: userId })
      .populate('doctor', 'firstName lastName specialization isVerifiedDoctor')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Certificate.countDocuments({ intern: userId });

    res.json({
      success: true,
      data: {
        certificates,
        total,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page)
      }
    });
  } catch (error) {
    console.error('Get user certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get certificate by ID (for verification)
export const getCertificateById = async (req: AuthRequest, res: Response) => {
  try {
    const { certificateId } = req.params;
    const requester = req.user!;

    const certificate = await Certificate.findOne({ certificateId })
      .populate('intern', 'firstName lastName email')
      .populate('doctor', 'firstName lastName specialization isVerifiedDoctor');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    const internId = (certificate.intern as any)._id.toString();
    const doctorId = (certificate.doctor as any)._id.toString();
    const requesterId = (requester._id as any).toString();

    const isOwnerOrIssuer =
      requesterId === internId ||
      requesterId === doctorId ||
      requester.userType === 'admin';

    // Increment download count
    certificate.downloadCount += 1;
    await certificate.save();

    if (isOwnerOrIssuer) {
      // Full detail view for the intern who owns it, the doctor who issued it, or an admin
      return res.json({
        success: true,
        data: {
          certificate,
          isRevoked: !certificate.isVerified
        }
      });
    }

    // Anyone else gets a limited, public-safe payload — no email, and revoked status is explicit
    res.json({
      success: true,
      data: {
        certificate: {
          certificateId: certificate.certificateId,
          title: certificate.title,
          intern: {
            firstName: (certificate.intern as any).firstName,
            lastName: (certificate.intern as any).lastName
          },
          doctor: certificate.doctor,
          casesReviewed: certificate.casesReviewed,
          pointsEarned: certificate.pointsEarned,
          issuedAt: certificate.createdAt
        },
        isRevoked: !certificate.isVerified
      }
    });
  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Verify a certificate from the public URL included in exported certificate data
export const getPublicCertificateVerification = async (req: Request, res: Response) => {
  try {
    const { certificateId } = req.params;
    const certificate = await Certificate.findOne({ certificateId, isVerified: true })
      .populate('intern', 'firstName lastName')
      .populate('doctor', 'firstName lastName specialization isVerifiedDoctor');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found or not verified',
        data: { isValid: false }
      });
    }

    res.json({
      success: true,
      message: 'Certificate verified successfully',
      data: {
        isValid: true,
        certificate: {
          id: certificate.certificateId,
          intern: certificate.intern,
          doctor: certificate.doctor,
          title: certificate.title,
          issuedAt: certificate.createdAt,
          casesReviewed: certificate.casesReviewed,
          pointsEarned: certificate.pointsEarned
        }
      }
    });
  } catch (error) {
    console.error('Public certificate verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Verify certificate authenticity
export const verifyCertificate = async (req: Request, res: Response) => {
  try {
    const { certificateId, verificationHash } = req.body;

    const certificate = await Certificate.findOne({
      certificateId,
      verificationHash,
      isVerified: true
    }).populate([
      { path: 'intern', select: 'firstName lastName' },
      { path: 'doctor', select: 'firstName lastName specialization isVerifiedDoctor' }
    ]);

    if (!certificate) {
      return res.json({
        success: false,
        message: 'Certificate verification failed',
        data: { isValid: false }
      });
    }

    res.json({
      success: true,
      message: 'Certificate verified successfully',
      data: {
        isValid: true,
        certificate: {
          id: certificate.certificateId,
          intern: certificate.intern,
          doctor: certificate.doctor,
          title: certificate.title,
          issuedAt: certificate.createdAt,
          casesReviewed: certificate.casesReviewed,
          pointsEarned: certificate.pointsEarned
        }
      }
    });
  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get certificates issued by doctor
export const getDoctorIssuedCertificates = async (req: AuthRequest, res: Response) => {
  try {
    const doctorId = req.user!._id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const certificates = await Certificate.find({ doctor: doctorId })
      .populate('intern', 'firstName lastName email profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Certificate.countDocuments({ doctor: doctorId });

    res.json({
      success: true,
      data: {
        certificates,
        total,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page)
      }
    });
  } catch (error) {
    console.error('Get doctor issued certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Revoke certificate
export const revokeCertificate = async (req: AuthRequest, res: Response) => {
  try {
    const { certificateId } = req.params;
    const doctorId = (req.user!._id as any).toString();

    const certificate = await Certificate.findOne({
      certificateId,
      doctor: doctorId
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found or you are not authorized to revoke it'
      });
    }

    certificate.isVerified = false;
    await certificate.save();

    res.json({
      success: true,
      message: 'Certificate revoked successfully',
      data: { certificate }
    });
  } catch (error) {
    console.error('Revoke certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Export certificate data for LinkedIn/GitHub
export const exportCertificateData = async (req: Request, res: Response) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({ certificateId, isVerified: true })
      .populate('intern', 'firstName lastName')
      .populate('doctor', 'firstName lastName specialization isVerifiedDoctor');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found or not verified'
      });
    }

    const exportData = {
      certificateId: certificate.certificateId,
      title: certificate.title,
      description: certificate.description,
      intern: {
        name: `${(certificate.intern as any).firstName} ${(certificate.intern as any).lastName}`
      },
      mentor: {
        name: `${(certificate.doctor as any).firstName} ${(certificate.doctor as any).lastName}`,
        specialization: (certificate.doctor as any).specialization,
        isVerified: (certificate.doctor as any).isVerifiedDoctor
      },
      achievement: {
        casesReviewed: certificate.casesReviewed,
        pointsEarned: certificate.pointsEarned,
        skills: certificate.skills,
        duration: certificate.duration
      },
      verification: {
        verificationUrl: `${req.protocol}://${req.get('host')}/api/certificates/verify/${certificate.certificateId}`,
        issuedAt: certificate.createdAt,
        hash: certificate.verificationHash.substring(0, 8) + '...'
      }
    };

    res.json({
      success: true,
      data: { exportData }
    });
  } catch (error) {
    console.error('Export certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
