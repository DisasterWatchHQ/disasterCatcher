import Feedback from '../models/feedback.js';
import { createSystemLog } from './adminLogsController.js';

export const createFeedback = async (req, res) => {
  try {
    const newFeedback = await Feedback.create({
      user_id: req.user.id, // Get user ID from authenticated request
      feedback_type: req.body.feedback_type,
      message: req.body.message,
      status: 'pending' // Default status for new feedback
    });

    const populatedFeedback = await newFeedback.populate('user_id', 'name email');
    res.status(201).json(populatedFeedback);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getFeedbacks = async (req, res) => {
  try {
    const {
      feedback_type,
      status,
      startDate,
      endDate,
      limit = 10,
      page = 1
    } = req.query;

    // Build query
    const query = {};

    if (feedback_type) query.feedback_type = feedback_type;
    if (status) query.status = status;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // If regular user, only show their feedback
    if (req.user.role !== 'admin') {
      query.user_id = req.user.id;
    }

    // Pagination
    const skip = (page - 1) * limit;

    const feedbacks = await Feedback.find(query)
      .populate('user_id', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Feedback.countDocuments(query);

    res.status(200).json({
      feedbacks,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalFeedbacks: total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('user_id', 'name email');

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Check if user is authorized to view this feedback
    if (req.user.role !== 'admin' && feedback.user_id._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this feedback' });
    }

    res.status(200).json(feedback);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateFeedback = async (req, res) => {
  try {
    // Only admins can update feedback status and add responses
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update feedback' });
    }

    const originalFeedback = await Feedback.findById(req.params.id);
    if (!originalFeedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    const updatedFeedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        admin_response: req.body.admin_response
          ? {
              message: req.body.admin_response,
              responded_by: req.user.id,
              responded_at: new Date()
            }
          : undefined
      },
      { new: true, runValidators: true }
    ).populate('user_id', 'name email');

    // Log admin's response/update
    await createSystemLog(
      req.user.id,
      'UPDATE_FEEDBACK',
      'feedback',
      updatedFeedback._id,
      {
        previous_state: originalFeedback.toObject(),
        new_state: updatedFeedback.toObject(),
        message: `Feedback from ${updatedFeedback.user_id.name} was updated`
      }
    );

    res.status(200).json(updatedFeedback);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Only admin or the feedback owner can delete
    if (req.user.role !== 'admin' && feedback.user_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this feedback' });
    }

    await feedback.remove();

    // Log deletion if done by admin
    if (req.user.role === 'admin') {
      await createSystemLog(
        req.user.id,
        'DELETE_FEEDBACK',
        'feedback',
        feedback._id,
        {
          previous_state: feedback.toObject(),
          message: `Feedback from user ${feedback.user_id} was deleted`
        }
      );
    }

    res.status(200).json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user's own feedback
export const getMyFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ user_id: req.user.id })
      .sort({ createdAt: -1 });
    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};