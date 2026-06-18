import { Request, Response } from 'express';
import Job from '../models/Job';
import Employer from '../models/Employer';
import Worker from '../models/Worker';
import { AuthRequest } from '../middlewares/authMiddleware';

export const createJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employer = await Employer.findOne({ user: req.user?.userId });
    if (!employer) {
      res.status(404).json({ message: 'Employer profile not found' });
      return;
    }

    const { title, description, category, locationCoordinates, address, requiredSkills, workersRequired, dailyWage, perks, startDate, endDate, applicationDeadline, workDuration, timing, reportingTime, jobType, workloadLevel, urgencyLevel } = req.body;

    let finalDeadline = new Date();
    if (applicationDeadline) {
      finalDeadline = new Date(applicationDeadline);
    } else {
      finalDeadline.setDate(finalDeadline.getDate() + 7); // Default 7 days
    }

    const job = await Job.create({
      employer: employer._id,
      title,
      description,
      category,
      location: {
        type: 'Point',
        coordinates: locationCoordinates || [77.2090, 28.6139] // Default New Delhi for testing
      },
      address,
      requiredSkills,
      workersRequired,
      dailyWage,
      perks,
      startDate,
      endDate,
      applicationDeadline: finalDeadline,
      workDuration,
      timing,
      reportingTime,
      jobType,
      workloadLevel,
      urgencyLevel,
      status: 'Open'
    });

    res.status(201).json(job);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getNearbyJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lng, lat, distance } = req.query;
    
    if (!lng || !lat) {
      res.status(400).json({ message: 'Longitude and latitude are required' });
      return;
    }

    const maxDistanceInMeters = distance ? parseInt(distance as string) * 1000 : 10000;

    const jobs = await Job.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng as string), parseFloat(lat as string)]
          },
          $maxDistance: maxDistanceInMeters
        }
      },
      status: 'Open',
      applicationDeadline: { $gte: new Date() },
      $or: [{ endDate: { $exists: false } }, { endDate: { $gte: new Date() } }]
    }).populate({ path: 'employer', select: 'fullName company', populate: { path: 'company', select: 'companyName' } });

    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getEmployerJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employer = await Employer.findOne({ user: req.user?.userId });
    if (!employer) {
      res.status(404).json({ message: 'Employer profile not found' });
      return;
    }

    const jobs = await Job.find({ employer: employer._id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getAllJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobs = await Job.find({ 
      status: 'Open', 
      applicationDeadline: { $gte: new Date() },
      $or: [{ endDate: { $exists: false } }, { endDate: { $gte: new Date() } }]
    })
      .sort({ createdAt: -1 })
      .populate({ path: 'employer', select: 'fullName company', populate: { path: 'company', select: 'companyName' } });
    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getMatchedJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const worker = await Worker.findOne({ user: req.user?.userId });
    if (!worker) {
      res.status(404).json({ message: 'Worker profile not found' });
      return;
    }

    const { query } = req.query; // optional search query

    const searchFilter: any = { 
      status: 'Open', 
      applicationDeadline: { $gte: new Date() },
      $or: [{ endDate: { $exists: false } }, { endDate: { $gte: new Date() } }]
    };
    if (query) {
      searchFilter.$and = [
        { $or: [{ endDate: { $exists: false } }, { endDate: { $gte: new Date() } }] },
        {
          $or: [
            { title: { $regex: query, $options: 'i' } },
            { requiredSkills: { $regex: query, $options: 'i' } },
            { address: { $regex: query, $options: 'i' } },
            { city: { $regex: query, $options: 'i' } }
          ]
        }
      ];
      delete searchFilter.$or;
    }

    const jobs = await Job.find(searchFilter).populate({ path: 'employer', select: 'fullName company', populate: { path: 'company', select: 'companyName' } }).lean();

    // Score jobs
    const workerSkills = worker.skills?.map((s: string) => s.toLowerCase()) || [];
    
    const scoredJobs = jobs.map((job: any) => {
      let score = 0;
      const jobSkills = job.requiredSkills?.map((s: string) => s.toLowerCase()) || [];
      jobSkills.forEach((skill: string) => {
        if (workerSkills.includes(skill)) score += 2;
      });

      // Bonus if location matches slightly
      if (job.city && worker.city && job.city.toLowerCase() === worker.city.toLowerCase()) {
        score += 1;
      }
      
      // Bonus if text query matches job title exactly
      if (query && job.title.toLowerCase().includes((query as string).toLowerCase())) {
         score += 3;
      }

      return { ...job, matchScore: score };
    });

    // Sort by match score descending, then by created at
    scoredJobs.sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json(scoredJobs);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
