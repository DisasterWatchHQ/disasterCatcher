import User from "../models/users.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { notificationController } from "./notificationController.js";
import crypto from "crypto";
import nodemailer from "nodemailer";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createUser = async (req, res) => {
  try {
    const { name, email, password, workId, associated_department } = req.body;

    if (!name || !email || !password || !workId || !associated_department) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, work ID, and department are required.",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { workId: workId }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          existingUser.email === email.toLowerCase()
            ? "Email already registered."
            : "Work ID already registered.",
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      workId,
      associated_department,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully.",
      user,
    });
  } catch (error) {
    console.error("Create User Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating user.",
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { department, email } = req.query;

    const query = {};

    if (department) {
      query.associated_department = department;
    }
    if (email) {
      query.email = new RegExp(email, "i");
    }

    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-password");

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: users.length,
        totalRecords: total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving users.",
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    let id;

    // If using /me route, get ID from authenticated user
    if (req.path === "/me") {
      id = req.user._id;
    } else {
      id = req.params.id;
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format.",
      });
    }

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving user.",
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    let id;

    // If using /me route, get ID from authenticated user
    if (req.path === "/me") {
      id = req.user._id;
    } else {
      id = req.params.id;
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format.",
      });
    }

    const updates = { ...req.body };

    delete updates.password;

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully.",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error updating user.",
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    let id;

    // If using /me route, get ID from authenticated user
    if (req.path === "/me") {
      id = req.user._id;
    } else {
      id = req.params.id;
    }

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

export const authenticateUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "dev",
      sameSite: process.env.NODE_ENV === "dev" ? "lax" : "none",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        department: user.associated_department,
      },
    });
  } catch (error) {
    console.error("Authentication Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Authentication error.",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format.",
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error changing password.",
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email, workId, department } = req.body;

    if (!email || !workId || !department) {
      return res.status(400).json({
        success: false,
        message: "Email, Work ID, and Department are required.",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      workId: workId,
      associated_department: department,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with the provided credentials.",
      });
    }

    const resetToken = user.createPasswordResetToken();

    await user.save();

    // Send email with reset token
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const emailContent = `
      <h2>Password Reset Request</h2>
      <p>Hello ${user.name},</p>
      <p>You have requested to reset your password. Click the link below to reset it:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
      <p>This link will expire in 10 minutes.</p>
      <p>Best regards,<br>DisasterCatcher Team</p>
    `;

    // Send email using nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL, // Send to admin email
      subject: "Password Reset Request",
      html: emailContent,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Password reset instructions have been sent to the administrator.",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error processing forgot password request.",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token.",
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error resetting password.",
    });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    const { preferences } = req.body;
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { preferences } },
      { new: true, runValidators: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Preferences updated successfully.",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error updating preferences.",
    });
  }
};

export const updatePushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    const userId = req.user._id;

    if (!pushToken) {
      return res.status(400).json({
        success: false,
        message: "Push token is required.",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { pushToken } },
      { new: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Push token updated successfully.",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error updating push token.",
    });
  }
};

export const updateAvatar = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No avatar file uploaded.",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          avatar: `/uploads/avatars/${req.file.filename}`,
          avatarUpdatedAt: new Date(),
        },
      },
      { new: true, runValidators: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Avatar updated successfully.",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error updating avatar.",
    });
  }
};
