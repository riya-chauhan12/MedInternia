import { Request, Response } from 'express';
import Collection from '../models/Collection';
import Case from '../models/Case';
import mongoose from 'mongoose';

// @route   POST /api/collections
// @desc    Create a new collection
// @access  Private
export const createCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, isPublic } = req.body;
    
    if (!name) {
      res.status(400).json({ success: false, message: 'Collection name is required' });
      return;
    }

    const collection = await Collection.create({
      name,
      description,
      isPublic: isPublic || false,
      user: (req as any).user.id,
      cases: []
    });

    res.status(201).json({ success: true, data: collection });
  } catch (error: any) {
    console.error('Create collection error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   GET /api/collections/me
// @desc    Get all collections for the logged in user
// @access  Private
export const getUserCollections = async (req: Request, res: Response): Promise<void> => {
  try {
    const collections = await Collection.find({ user: (req as any).user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: collections });
  } catch (error: any) {
    console.error('Get collections error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   GET /api/collections/:id
// @desc    Get single collection by ID and populate cases
// @access  Private
export const getCollectionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const collection = await Collection.findById(req.params.id).populate({
      path: 'cases',
      populate: { path: 'doctor', select: 'firstName lastName profilePicture specialization' }
    });
    
    if (!collection) {
      res.status(404).json({ success: false, message: 'Collection not found' });
      return;
    }
    
    // Check if user is owner or if it's public
    if (collection.user.toString() !== (req as any).user.id && !collection.isPublic) {
      res.status(403).json({ success: false, message: 'Not authorized to view this collection' });
      return;
    }

    res.status(200).json({ success: true, data: collection });
  } catch (error: any) {
    console.error('Get collection by ID error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   POST /api/collections/:id/cases
// @desc    Add a case to a collection
// @access  Private
export const addCaseToCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { caseId } = req.body;
    
    if (!caseId) {
      res.status(400).json({ success: false, message: 'Case ID is required' });
      return;
    }

    const collection = await Collection.findById(req.params.id);
    
    if (!collection) {
      res.status(404).json({ success: false, message: 'Collection not found' });
      return;
    }
    
    if (collection.user.toString() !== (req as any).user.id) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    // Check if case exists
    const caseItem = await Case.findById(caseId);
    if (!caseItem) {
      res.status(404).json({ success: false, message: 'Case not found' });
      return;
    }

    // Check if case is already in collection
    if (collection.cases.includes(new mongoose.Types.ObjectId(caseId))) {
      res.status(400).json({ success: false, message: 'Case already in collection' });
      return;
    }

    collection.cases.push(new mongoose.Types.ObjectId(caseId));
    await collection.save();

    res.status(200).json({ success: true, data: collection, message: 'Case added to collection' });
  } catch (error: any) {
    console.error('Add case to collection error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   DELETE /api/collections/:id/cases/:caseId
// @desc    Remove a case from a collection
// @access  Private
export const removeCaseFromCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const collection = await Collection.findById(req.params.id);
    
    if (!collection) {
      res.status(404).json({ success: false, message: 'Collection not found' });
      return;
    }
    
    if (collection.user.toString() !== (req as any).user.id) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    collection.cases = collection.cases.filter((id: any) => id.toString() !== req.params.caseId);
    await collection.save();

    res.status(200).json({ success: true, data: collection, message: 'Case removed from collection' });
  } catch (error: any) {
    console.error('Remove case from collection error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
