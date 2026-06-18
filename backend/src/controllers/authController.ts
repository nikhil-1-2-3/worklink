import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Worker from '../models/Worker';
import Employer from '../models/Employer';
import Company from '../models/Company';
import { AuthRequest } from '../middlewares/authMiddleware';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const generateToken = (userId: string, role: string) => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '30d' });
};

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, mobile, password, fullName } = req.body;

    let user = await User.findOne({ mobile });
    if (user) {
      res.status(400).json({ message: 'User with this mobile number already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await User.create({
      mobile,
      password: hashedPassword,
      role,
      status: 'Verified', // Auto-verify upon registration as requested
      isVerified: true
    });

    if (role === 'worker') {
      await Worker.create({
        user: user._id,
        fullName,
        address: 'To be updated',
        city: 'Delhi', // Default for now
        state: 'Delhi',
        skills: [],
        languages: []
      });
    } else if (role === 'employer') {
      await Employer.create({
        user: user._id,
        fullName,
        address: 'To be updated',
        city: 'Delhi',
        state: 'Delhi'
      });
    }

    // Immediately log them in
    res.status(201).json({
      message: 'Registration successful.',
      _id: user._id,
      mobile: user.mobile,
      role: user.role,
      status: user.status,
      token: generateToken(user._id.toString(), user.role)
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mobile, password } = req.body;

    const user = await User.findOne({ mobile });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    if (user.status === 'Suspended') {
      res.status(403).json({ message: `Account is suspended.` });
      return;
    }

    res.json({
      _id: user._id,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
      status: user.status,
      token: generateToken(user._id.toString(), user.role)
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Post-Login Verification Submission
export const submitVerification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { aadhaarNumber, companyName, registrationNumber } = req.body;
    
    const user = await User.findById(req.user?.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (user.role === 'worker' && aadhaarNumber) {
      const updateData: any = { aadhaarNumber };
      if (req.file) {
        updateData.aadhaarDocumentUrl = `/uploads/${req.file.filename}`;
      }
      await Worker.findOneAndUpdate({ user: user._id }, updateData);
    } else if (user.role === 'employer' && companyName && registrationNumber) {
      const employer = await Employer.findOne({ user: user._id });
      if (employer) {
        // If company exists, update it, otherwise create it
        if (employer.company) {
           await Company.findByIdAndUpdate(employer.company, { companyName, registrationNumber });
        } else {
           const company = await Company.create({
             employer: employer._id,
             companyName,
             businessAddress: employer.address || employer.city,
             registrationNumber
           });
           employer.company = company._id as any;
           await employer.save();
        }
      }
    } else {
      res.status(400).json({ message: 'Missing required verification details.' });
      return;
    }

    // Move status to Pending Verification for Admin Queue
    user.status = 'Pending Verification';
    await user.save();

    res.json({ message: 'Verification details submitted successfully', status: user.status });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
