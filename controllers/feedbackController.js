import Feedback from "../models/feedback.js";
import { createSystemLog } from "./adminLogsController.js";

export const createFeedback = async (req, res) => {
  try {
    if (req.user.type === "admin") {
      return res.status(403).json({ message: "Admins cannot create feedback" });
    }

    const newFeedback = await Feedback.create({
      user_id: req.user.id,
      feedback_type: req.body.feedback_type,
      message: req.body.message,
      status: "pending",
    });

    const populatedFeedback = await newFeedback.populate(
      "user_id",
      "name email",
    );
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
      page = 1,
    } = req.query;

    const query = {};

    if (feedback_type) query.feedback_type = feedback_type;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const feedbacks = await Feedback.find(query)
      .populate("user_id", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      feedbacks,
      success: true,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id).populate(
      "user_id",
      "name email",
    );

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    if (
      req.user.role !== "admin" &&
      feedback.user_id._id.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this feedback" });
    }

    res.status(200).json(feedback);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    if (!req.user || req.user.type !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can update feedback" });
    }

    const updatedFeedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        admin_response: {
          message: req.body.admin_response,
          responded_by: req.user.id,
          responded_at: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      },
    ).populate("user_id", "name email");

    res.status(200).json(updatedFeedback);
  } catch (error) {
    console.error("Update Feedback Error:", error);
    res.status(400).json({ error: error.message });
  }
};

export const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    if (!req.user || req.user.type !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can delete feedback" });
    }

    await Feedback.findByIdAndDelete(req.params.id);

    if (req.user.role === "admin") {
      await createSystemLog(
        req.user.id,
        "DELETE_FEEDBACK",
        "feedback",
        feedback._id,
        {
          previous_state: feedback.toObject(),
          message: `Feedback from user ${feedback.user_id} was deleted`,
        },
      );
    }

    res.status(200).json({ message: "Feedback deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ user_id: req.user.id }).sort({
      createdAt: -1,
    });
    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
