import { Request, Response } from 'express';
import Review from '../models/Review';
import JobApplication from '../models/JobApplication';
import Employer from '../models/Employer';
import Worker from '../models/Worker';
import { AuthRequest } from '../middlewares/authMiddleware';

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { applicationId, rating, comment } = req.body;
    
    if (!rating || !comment || rating < 1 || rating > 5) {
      res.status(400).json({ message: 'Valid rating and comment are required' });
      return;
    }

    const employer = await Employer.findOne({ user: req.user?.userId });
    if (!employer) {
      res.status(404).json({ message: 'Employer profile not found' });
      return;
    }

    const application = await JobApplication.findOne({ _id: applicationId, employer: employer._id });
    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    if (application.status !== 'Completed') {
      res.status(400).json({ message: 'Only completed jobs can be reviewed' });
      return;
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ job: application.job, employer: employer._id, worker: application.worker });
    if (existingReview) {
      res.status(400).json({ message: 'You have already reviewed this worker for this job' });
      return;
    }

    const review = await Review.create({
      job: application.job,
      employer: employer._id,
      worker: application.worker,
      rating,
      comment
    });

    // Update Worker's rating
    const worker = await Worker.findById(application.worker);
    if (worker) {
      const newTotalReviews = worker.totalReviews + 1;
      const newAverageRating = ((worker.averageRating * worker.totalReviews) + rating) / newTotalReviews;
      
      worker.totalReviews = newTotalReviews;
      worker.averageRating = Number(newAverageRating.toFixed(1));

      // Gamification: Badges
      if (!worker.badges) worker.badges = [];
      if (worker.averageRating >= 4.5 && worker.totalReviews >= 3 && !worker.badges.includes('Top Rated ⭐')) {
        worker.badges.push('Top Rated ⭐');
      }
      if (worker.totalReviews >= 10 && !worker.badges.includes('Reliable Pro 🏆')) {
        worker.badges.push('Reliable Pro 🏆');
      }

      await worker.save();
    }

    res.status(201).json(review);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getWorkerReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workerId } = req.params;
    const reviews = await Review.find({ worker: workerId }).populate('employer', 'fullName company').sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
