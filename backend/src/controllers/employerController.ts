import { Response } from 'express';
import Employer from '../models/Employer';
import Company from '../models/Company';
import Job from '../models/Job';
import JobApplication from '../models/JobApplication';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getEmployerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employer = await Employer.findOne({ user: req.user?.userId }).populate('company');
    if (!employer) {
      res.status(404).json({ message: 'Employer profile not found' });
      return;
    }
    res.json(employer);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const updateEmployerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, city, state, companyName, registrationNumber, address } = req.body;
    
    const employer = await Employer.findOne({ user: req.user?.userId });
    if (!employer) {
      res.status(404).json({ message: 'Employer profile not found' });
      return;
    }

    if (fullName) employer.fullName = fullName;
    if (city) employer.city = city;
    if (state) employer.state = state;
    if (address) employer.address = address;

    if (companyName || registrationNumber) {
      if (employer.company) {
        await Company.findByIdAndUpdate(employer.company, { companyName, registrationNumber, businessAddress: address || employer.address });
      } else {
        const company = await Company.create({
          employer: employer._id,
          companyName,
          businessAddress: address || employer.address,
          registrationNumber
        });
        employer.company = company._id as any;
      }
    }

    await employer.save();
    
    const updatedEmployer = await Employer.findById(employer._id).populate('company');
    res.json(updatedEmployer);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getEmployerStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employer = await Employer.findOne({ user: req.user?.userId });
    if (!employer) {
      res.status(404).json({ message: 'Employer profile not found' });
      return;
    }

    const activeJobs = await Job.countDocuments({ employer: employer._id, status: 'Open' });
    const totalApplicantsCount = await JobApplication.countDocuments({ employer: employer._id });
    const hiredWorkersCount = await JobApplication.countDocuments({ employer: employer._id, status: 'Accepted' });

    res.json({
      activeJobs,
      totalApplicants: totalApplicantsCount,
      hiredWorkers: hiredWorkersCount
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getEmployerPublicProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const employer = await Employer.findById(id).populate('company').select('-user');
    
    if (!employer) {
      res.status(404).json({ message: 'Employer not found' });
      return;
    }

    const openJobs = await Job.find({ employer: employer._id, status: 'Open' }).sort({ createdAt: -1 });
    
    res.json({
      employer,
      openJobs
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
