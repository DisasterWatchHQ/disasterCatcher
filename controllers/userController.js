import User from '../models/user.js';
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

// Helper function to check MongoDB ObjectID validity
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Create User
export const createUser = async (req, res) => {
  try {
    const { name, email, password, type } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required."
      });
    }

    // Check existing user
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered."
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      type: type || "anonymous"
    });

    res.status(201).json({
      success: true,
      message: "User created successfully.",
      user
    });

  } catch (error) {
    console.error('Create User Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating user."
    });
  }
};

// Get All Users with Pagination
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { type, email } = req.query;

    const query = {};
    if (type) query.type = type;
    if (email) query.email = new RegExp(email, 'i');

    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-password');

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: users.length,
        totalRecords: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving users."
    });
  }
};

// Get User by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format."
      });
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving user."
    });
  }
};

// Update User
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format."
      });
    }

    // Prevent password update through this endpoint
    delete updates.password;

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully.",
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error updating user."
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting user.", error: error.message });
  }
};

// Authentication
export const authenticateUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials."
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials."
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, type: user.type },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        type: user.type
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Authentication error."
    });
  }
};
