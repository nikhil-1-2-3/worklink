import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import JobApplication from '../models/JobApplication';
import Job from '../models/Job';
import Worker from '../models/Worker';
import Employer from '../models/Employer';

// Worker: Apply for a job
export const applyForJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const { workerIds = [] } = req.body; // Array of Worker ObjectIds
    const worker = await Worker.findOne({ user: req.user?.userId });
    if (!worker) {
      res.status(404).json({ message: 'Worker profile not found' });
      return;
    }
    
    if (!worker.hasDigitalPassport) {
      res.status(403).json({ message: 'You must create a Digital Passport before applying for jobs' });
      return;
    }

    const job = await Job.findById(jobId);
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    if (job.status !== 'Open' || job.workersRequired <= 0) {
      res.status(400).json({ message: 'This job is no longer accepting applications' });
      return;
    }

    // Determine who we are applying for
    let targetWorkerIds = [worker._id.toString()];
    let isGroup = false;
    let groupId = undefined;

    if (worker.isContractor && workerIds.length > 0) {
      // Contractor applying on behalf of team
      targetWorkerIds = workerIds;
      isGroup = true;
      groupId = `grp_${Date.now()}_${worker._id}`;
      
      if (targetWorkerIds.length > job.workersRequired) {
        res.status(400).json({ message: `This job only needs ${job.workersRequired} more workers.` });
        return;
      }
    }

    const applicationsCreated = [];
    
    for (const twId of targetWorkerIds) {
      // Check for existing application
      const existing = await JobApplication.findOne({ job: jobId, worker: twId });
      if (!existing) {
        const application = await JobApplication.create({
          job: job._id,
          worker: twId,
          employer: job.employer,
          appliedBy: isGroup ? worker._id : undefined,
          groupId: isGroup ? groupId : undefined,
          workersProvided: 1
        });
        applicationsCreated.push(application);
      }
    }

    if (applicationsCreated.length === 0) {
      res.status(400).json({ message: 'All selected workers have already applied for this job' });
      return;
    }

    res.status(201).json({ message: 'Applied successfully', applications: applicationsCreated });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Worker: Get my applications
export const getWorkerApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const worker = await Worker.findOne({ user: req.user?.userId });
    if (!worker) {
      res.status(404).json({ message: 'Worker profile not found' });
      return;
    }

    const applications = await JobApplication.find({ worker: worker._id })
      .populate({ 
        path: 'job', 
        populate: { 
          path: 'employer', 
          populate: [
            { path: 'company' },
            { path: 'user', select: 'mobile' }
          ] 
        } 
      })
      .populate('appliedBy', 'fullName')
      .sort({ createdAt: -1 });
    
    res.json(applications);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Worker: Cancel an application
export const cancelApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const worker = await Worker.findOne({ user: req.user?.userId });
    if (!worker) {
      res.status(404).json({ message: 'Worker profile not found' });
      return;
    }

    const application = await JobApplication.findOne({ _id: id, worker: worker._id });
    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    if (application.status !== 'Pending') {
      res.status(400).json({ message: 'Only pending applications can be cancelled' });
      return;
    }

    application.status = 'Cancelled';
    await application.save();

    res.json(application);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Employer: Get applicants for a job
export const getJobApplicants = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const employer = await Employer.findOne({ user: req.user?.userId });
    if (!employer) {
      // If admin, we don't strictly require an employer profile to view applicants.
      if (req.user?.role !== 'admin') {
        res.status(404).json({ message: 'Employer profile not found' });
        return;
      }
    }

    let job;
    if (req.user?.role === 'admin') {
      job = await Job.findById(jobId);
    } else {
      // Verify job belongs to employer
      job = await Job.findOne({ _id: jobId, employer: employer?._id });
    }
    
    if (!job) {
      res.status(403).json({ message: 'Not authorized to view these applications or job not found' });
      return;
    }

    const applications = await JobApplication.find({ job: jobId, status: { $ne: 'Cancelled' } })
      .populate({
        path: 'worker',
        populate: { path: 'user', select: 'mobile' }
      })
      .populate('appliedBy', 'fullName')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Employer: Update application status (Accept/Reject)
export const updateApplicationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Accepted' | 'Rejected'
    const employer = await Employer.findOne({ user: req.user?.userId });
    if (!employer && req.user?.role !== 'admin') {
      res.status(404).json({ message: 'Employer profile not found' });
      return;
    }

    if (!['Offer Sent', 'Rejected', 'Completed'].includes(status)) {
      res.status(400).json({ message: 'Invalid status update from employer' });
      return;
    }

    let application;
    if (req.user?.role === 'admin') {
      application = await JobApplication.findById(id);
    } else {
      application = await JobApplication.findOne({ _id: id, employer: employer?._id });
    }
    
    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    if (status === 'Offer Sent' && application.status !== 'Pending') {
      res.status(400).json({ message: `Cannot send offer, application is already ${application.status}` });
      return;
    }

    if (status === 'Completed' && application.status !== 'Accepted') {
      res.status(400).json({ message: 'Only Accepted applications can be marked as completed' });
      return;
    }

    // Check if part of a group
    if (application.groupId) {
      await JobApplication.updateMany(
        { groupId: application.groupId, job: application.job },
        { status }
      );
    } else {
      application.status = status;
      await application.save();
    }

    res.json({ message: 'Status updated', status });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Worker: Update status (Accept Offer)
export const updateWorkerStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Accepted'
    const worker = await Worker.findOne({ user: req.user?.userId });
    
    if (!worker) {
      res.status(404).json({ message: 'Worker profile not found' });
      return;
    }

    if (status !== 'Accepted') {
      res.status(400).json({ message: 'Invalid status update from worker' });
      return;
    }

    const application = await JobApplication.findOne({ 
      _id: id, 
      $or: [{ worker: worker._id }, { appliedBy: worker._id }] 
    });
    if (!application) {
      res.status(404).json({ message: 'Application not found or unauthorized' });
      return;
    }

    if (status === 'Accepted' && application.status !== 'Offer Sent') {
      res.status(400).json({ message: 'Can only accept when an Offer is Sent' });
      return;
    }

    let updatedCount = 1;

    if (application.groupId) {
      const result = await JobApplication.updateMany(
        { groupId: application.groupId, job: application.job },
        { status }
      );
      updatedCount = result.modifiedCount || 1;
    } else {
      application.status = status;
      await application.save();
    }

    // Decrease Workers Needed count if Accepted
    if (status === 'Accepted') {
      const job = await Job.findById(application.job);
      if (job && job.workersRequired > 0) {
        job.workersRequired -= updatedCount; // Reduce by the number of workers accepted
        if (job.workersRequired <= 0) {
          job.workersRequired = 0;
          job.status = 'In Progress'; 
        }
        await job.save();
      }
    }

    res.json({ message: 'Offer accepted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

import User from '../models/User';

// Employer/Admin: Leave Review for a completed application
export const leaveReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ message: 'Rating must be between 1 and 5' });
      return;
    }

    const application = await JobApplication.findById(id);
    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    if (application.status !== 'Completed') {
      res.status(400).json({ message: 'Can only review completed jobs' });
      return;
    }

    // Employer reviews worker
    const worker = await Worker.findById(application.worker);
    if (!worker) {
      res.status(404).json({ message: 'Worker not found' });
      return;
    }

    // Update worker ratings
    worker.totalReviews += 1;
    worker.sumRatings += rating;
    worker.averageRating = Number((worker.sumRatings / worker.totalReviews).toFixed(1));
    await worker.save();

    // Blacklist Security Engine
    if (worker.totalReviews >= 3 && worker.averageRating < 2.5) {
      const user = await User.findById(worker.user);
      if (user && !user.isBanned) {
        user.isBanned = true;
        user.banReason = `Auto-banned due to consistently poor ratings (Average: ${worker.averageRating})`;
        user.status = 'Banned';
        await user.save();
      }
    }

    res.json({ message: 'Review submitted successfully', workerAverage: worker.averageRating });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Worker: Leave Review for an employer after a completed application
export const workerLeaveReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ message: 'Rating must be between 1 and 5' });
      return;
    }

    const application = await JobApplication.findById(id);
    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    if (application.status !== 'Completed') {
      res.status(400).json({ message: 'Can only review completed jobs' });
      return;
    }

    const worker = await Worker.findOne({ user: req.user?.userId });
    if (!worker || worker._id.toString() !== application.worker.toString()) {
      res.status(403).json({ message: 'Unauthorized to review this job' });
      return;
    }

    // Worker reviews employer
    const employer = await Employer.findById(application.employer);
    if (!employer) {
      res.status(404).json({ message: 'Employer not found' });
      return;
    }

    // Update employer ratings
    employer.totalReviews += 1;
    employer.sumRatings += rating;
    employer.averageRating = Number((employer.sumRatings / employer.totalReviews).toFixed(1));
    await employer.save();

    // Blacklist Security Engine for Employers
    if (employer.totalReviews >= 3 && employer.averageRating < 2.5) {
      const user = await User.findById(employer.user);
      if (user && !user.isBanned) {
        user.isBanned = true;
        user.banReason = `Auto-banned due to consistently poor ratings from workers (Average: ${employer.averageRating})`;
        user.status = 'Banned';
        await user.save();
      }
    }

    res.json({ message: 'Review submitted successfully', employerAverage: employer.averageRating });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
