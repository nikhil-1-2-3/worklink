import { Request, Response } from 'express';
import SupportRequest from '../models/SupportRequest';

// Public: Submit a call back request
export const requestCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      res.status(400).json({ message: 'Phone number is required' });
      return;
    }

    const newRequest = await SupportRequest.create({ phoneNumber });
    res.status(201).json(newRequest);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Admin: Get all callbacks
export const getCallbacks = async (req: Request, res: Response): Promise<void> => {
  try {
    const requests = await SupportRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Admin: Mark callback as resolved
export const resolveCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const request = await SupportRequest.findById(id);
    if (!request) {
      res.status(404).json({ message: 'Request not found' });
      return;
    }

    request.status = 'Resolved';
    await request.save();

    res.json({ message: 'Request marked as resolved', request });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
