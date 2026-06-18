import { Request, Response } from 'express';
import User from '../models/User';
import Worker from '../models/Worker';
import Employer from '../models/Employer';
import Company from '../models/Company';

export const getPendingVerifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const pendingUsers = await User.find({ status: 'Pending Verification', role: { $ne: 'admin' } }).select('-password').lean();
    
    // Attach worker/employer details manually since they are separate collections
    const detailedUsers = await Promise.all(pendingUsers.map(async (user: any) => {
      let details = null;
      if (user.role === 'worker') {
        details = await Worker.findOne({ user: user._id }).select('aadhaarNumber fullName city state');
      } else if (user.role === 'employer') {
        const emp = await Employer.findOne({ user: user._id }).populate('company');
        details = {
           fullName: emp?.fullName,
           companyName: (emp?.company as any)?.companyName,
           registrationNumber: (emp?.company as any)?.registrationNumber
        };
      }
      return { ...user, details };
    }));

    res.json(detailedUsers);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const verifyUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (action === 'approve') {
      user.status = 'Verified';
      user.isVerified = true;
      
      if (user.role === 'employer') {
        const employer = await Employer.findOne({ user: user._id });
        if (employer && employer.company) {
          await Company.findByIdAndUpdate(employer.company, { isVerified: true });
        }
      }
    } else if (action === 'reject') {
      user.status = 'Rejected';
      user.isVerified = false;
    } else {
      res.status(400).json({ message: 'Invalid action' });
      return;
    }

    await user.save();
    res.json({ message: `User ${action}d successfully`, user });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getAllWorkers = async (req: Request, res: Response): Promise<void> => {
  try {
    const workers = await Worker.find().populate('user', '-password');
    res.json(workers);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getAllEmployers = async (req: Request, res: Response): Promise<void> => {
  try {
    const employers = await Employer.find().populate('user', '-password').populate('company');
    res.json(employers);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getPendingContractors = async (req: Request, res: Response): Promise<void> => {
  try {
    const pendingContractors = await Worker.find({ contractorStatus: 'Pending' })
      .populate('user', 'mobile email status')
      .lean();
    res.json(pendingContractors);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const approveContractor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, commissionRate } = req.body; // action: 'Approve' | 'Reject'

    const worker = await Worker.findById(id);
    if (!worker) {
      res.status(404).json({ message: 'Worker not found' });
      return;
    }

    if (action === 'Approve') {
      worker.contractorStatus = 'Approved';
      worker.commissionRate = commissionRate || 5; // Default 5% commission
      worker.isContractor = true; // For backward compatibility
    } else if (action === 'Reject') {
      worker.contractorStatus = 'Rejected';
      worker.isContractor = false;
    } else {
      res.status(400).json({ message: 'Invalid action' });
      return;
    }

    await worker.save();
    res.json({ message: `Contractor ${action}d successfully`, worker });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
