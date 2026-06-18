import { Response } from 'express';
import Worker from '../models/Worker';
import TeamInvite from '../models/TeamInvite';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getWorkerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const worker = await Worker.findOne({ user: req.user?.userId }).populate('user', 'mobile email status isVerified');
    if (!worker) {
      res.status(404).json({ message: 'Worker profile not found' });
      return;
    }
    res.json(worker);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const updateWorkerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skills, languages, experienceYears, preferredWage, availabilityStatus } = req.body;
    
    const worker = await Worker.findOne({ user: req.user?.userId });
    if (!worker) {
      res.status(404).json({ message: 'Worker profile not found' });
      return;
    }

    if (skills) worker.skills = skills;
    if (languages) worker.languages = languages;
    if (experienceYears !== undefined) worker.experienceYears = experienceYears;
    if (preferredWage !== undefined) worker.preferredWage = preferredWage;
    if (availabilityStatus) worker.availabilityStatus = availabilityStatus;

    // Trust Score Engine
    let profileCompletion = 20; // Base points for signup
    if (worker.aadhaarNumber) profileCompletion += 30; // 50%
    if (worker.skills && worker.skills.length > 0) profileCompletion += 25; // 75%
    if (worker.experienceYears > 0) profileCompletion += 15; // 90%
    if (worker.languages && worker.languages.length > 0) profileCompletion += 10; // 100%

    worker.profileCompletion = profileCompletion;

    let trustScore = 50; // Base
    trustScore += (profileCompletion * 0.2); // Up to +20 points for complete profile
    
    // In future, completed jobs will add to trust score.
    worker.trustScore = Math.min(100, Math.round(trustScore));

    await worker.save();
    
    res.json({ message: 'Profile updated successfully', worker });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const generateDigitalPassport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { aadhaarNumber, dob, profileImage } = req.body;

    if (!aadhaarNumber || !dob) {
      res.status(400).json({ message: 'Aadhaar Number and Date of Birth are required' });
      return;
    }

    const worker = await Worker.findOne({ user: req.user?.userId });
    if (!worker) {
      res.status(404).json({ message: 'Worker profile not found' });
      return;
    }

    if (worker.hasDigitalPassport) {
      res.status(400).json({ message: 'Digital Passport already generated' });
      return;
    }

    // Generate unique ID (WL + 8 random digits)
    const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
    worker.passportId = `WL-${randomDigits}`;
    
    // Set Expiry Date (2 years from now)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 2);
    worker.passportExpiry = expiryDate;

    // Update details
    worker.hasDigitalPassport = true;
    worker.aadhaarNumber = aadhaarNumber;
    worker.dob = new Date(dob);
    if (profileImage) {
      worker.profileImage = profileImage;
    }

    // Update Trust Score for providing Aadhaar (if not already added)
    if (worker.profileCompletion < 50) {
       worker.profileCompletion += 30;
       worker.trustScore = Math.min(100, worker.trustScore + 6);
    }

    await worker.save();

    res.status(201).json({ message: 'Digital Passport generated successfully', passport: {
      passportId: worker.passportId,
      passportExpiry: worker.passportExpiry,
      hasDigitalPassport: worker.hasDigitalPassport
    }});
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const applyForContractor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const worker = await Worker.findOne({ user: req.user?.userId });
    if (!worker) {
      res.status(404).json({ message: 'Worker profile not found' });
      return;
    }

    if (worker.contractorStatus === 'Approved') {
      res.status(400).json({ message: 'Already an approved contractor' });
      return;
    }

    worker.contractorStatus = 'Gathering Team';
    await worker.save();

    res.json({ message: 'Draft team started. You must gather 5 workers within 24 hours.', worker });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const createSubWorker = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, address, city, state, aadhaarNumber, dob, profileImage, skills } = req.body;
    
    const contractor = await Worker.findOne({ user: req.user?.userId });
    if (!contractor || contractor.contractorStatus !== 'Approved') {
      res.status(403).json({ message: 'Only approved contractors can create sub-workers' });
      return;
    }

    // Generate unique Passport ID for sub-worker
    const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
    const passportId = `WL-${randomDigits}`;
    
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 2);

    const subWorker = await Worker.create({
      user: req.user?.userId, // Sub-workers are tied to the contractor's user account for now
      managedBy: contractor._id,
      fullName,
      address,
      city,
      state,
      skills: skills || [],
      aadhaarNumber,
      dob: new Date(dob),
      profileImage,
      hasDigitalPassport: true,
      passportId,
      passportExpiry: expiryDate,
      profileCompletion: 80, // High completion since contractor verified them
      trustScore: 70
    });

    contractor.teamSize += 1;
    await contractor.save();

    res.status(201).json({ message: 'Sub-worker created successfully', subWorker });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getContractorTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contractor = await Worker.findOne({ user: req.user?.userId });
    if (!contractor) {
      res.status(404).json({ message: 'Contractor profile not found' });
      return;
    }

    const team = await Worker.find({ managedBy: contractor._id }).sort({ createdAt: -1 });
    res.json(team);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const searchWorkerByPassport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { passportId } = req.query;
    if (!passportId || typeof passportId !== 'string') {
      res.status(400).json({ message: 'Passport ID is required' });
      return;
    }
    
    // Auto-complete or exact match
    const workers = await Worker.find({ 
      passportId: { $regex: passportId, $options: 'i' },
      contractorStatus: 'None' // Can't invite someone who is already a contractor
    }).select('fullName city passportId').limit(5);

    res.json(workers);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const sendAgencyInvite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { targetWorkerId } = req.body;

    const contractor = await Worker.findOne({ user: req.user?.userId });
    if (!contractor || contractor.contractorStatus !== 'Gathering Team') {
      res.status(403).json({ message: 'You must be in the Gathering Team phase to send invites' });
      return;
    }

    const targetWorker = await Worker.findById(targetWorkerId);
    if (!targetWorker) {
      res.status(404).json({ message: 'Target worker not found' });
      return;
    }

    if (targetWorker.managedBy) {
      res.status(400).json({ message: 'Worker is already managed by a contractor' });
      return;
    }

    const existingInvite = await TeamInvite.findOne({ contractor: contractor._id, worker: targetWorker._id, status: { $in: ['Pending', 'Accepted'] } });
    if (existingInvite) {
      res.status(400).json({ message: 'Invite already sent or accepted' });
      return;
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const invite = await TeamInvite.create({
      contractor: contractor._id,
      worker: targetWorker._id,
      status: 'Pending',
      expiresAt
    });

    res.status(201).json({ message: 'Invite sent successfully', invite });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getSentInvites = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contractor = await Worker.findOne({ user: req.user?.userId });
    if (!contractor) return;

    const invites = await TeamInvite.find({ contractor: contractor._id }).populate('worker', 'fullName passportId city');
    res.json(invites);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getReceivedInvites = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const worker = await Worker.findOne({ user: req.user?.userId });
    if (!worker) return;

    const invites = await TeamInvite.find({ worker: worker._id, status: 'Pending' })
      .populate('contractor', 'fullName city');
    
    // Filter expired
    const validInvites = invites.filter(inv => new Date() < inv.expiresAt);
    res.json(validInvites);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const respondToInvite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'Accept' | 'Reject'

    const worker = await Worker.findOne({ user: req.user?.userId });
    if (!worker) return;

    const invite = await TeamInvite.findById(id);
    if (!invite || invite.worker.toString() !== worker._id.toString()) {
      res.status(404).json({ message: 'Invite not found' });
      return;
    }

    if (new Date() > invite.expiresAt) {
      invite.status = 'Expired';
      await invite.save();
      res.status(400).json({ message: 'This invite has expired' });
      return;
    }

    if (action === 'Reject') {
      invite.status = 'Rejected';
      await invite.save();
      res.json({ message: 'Invite rejected' });
      return;
    }

    if (action === 'Accept') {
      invite.status = 'Accepted';
      await invite.save();

      worker.managedBy = invite.contractor;
      await worker.save();

      // Check auto-approval for contractor
      const acceptedCount = await TeamInvite.countDocuments({ contractor: invite.contractor, status: 'Accepted' });
      const contractor = await Worker.findById(invite.contractor);
      
      if (contractor && contractor.contractorStatus === 'Gathering Team') {
        contractor.teamSize = acceptedCount + 1; // +1 includes the contractor themselves
        
        if (acceptedCount >= 5) {
          contractor.contractorStatus = 'Approved'; // Auto Approve!
          contractor.commissionRate = 5; // Default commission
          contractor.isContractor = true;
        }
        await contractor.save();
      }

      res.json({ message: 'Invite accepted! You are now part of their team.' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
