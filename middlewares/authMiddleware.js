import jwt from "jsonwebtoken";
import User from "../models/users.js";

// Main authentication middleware
export const protectRoute = async (req, res, next) => {
  try {
    let token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];
    let user = null;

    if (token) {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      user = await User.findById(decodedToken.userId);
      if (!user) throw new Error("Invalid token or user not found");
    } else {
      // Handle anonymous users
      if (!req.session.pseudoUser) {
        req.session.pseudoUser = {
          id: `anon_${Date.now()}`,
          userType: "anonymous",
          location: req.body.location || null,
        };
      }
      user = req.session.pseudoUser;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Error:', error);
    return res.status(401).json({ success: false, message: "Not authorized." });
  }
};

// Middleware for checking user types
export const verifyUserType = (allowedTypes) => {
  return (req, res, next) => {
    try {
      // Check if user exists and has the correct type
      if (!req.user || !allowedTypes.includes(req.user.type)) { // Changed from userType to type
        return res.status(403).json({
          success: false,
          message: "Access denied. Insufficient permissions.",
        });
      }
      next();
    } catch (error) {
      console.error('User Type Verification Error:', error);
      return res.status(500).json({
        success: false,
        message: "Error verifying user type.",
      });
    }
  };
};

// Middleware for verified users
export const verifyVerifiedUser = async (req, res, next) => {
  try {
    // Check if user exists and is verified
    if (!req.user || !req.user.verification_status) { // Changed from isVerified to verification_status
      return res.status(403).json({
        success: false,
        message: "Access denied. This action requires a verified user.",
      });
    }
    next();
  } catch (error) {
    console.error('Verified User Check Error:', error);
    return res.status(500).json({
      success: false,
      message: "Error checking user verification status.",
    });
  }
};

export const verifyAdmin = async (req, res, next) => {
  try {
    if (req.user?.userType !== "admin") {
      return res.status(403).json({
        status: false,
        message: "Access denied. Admin privileges are required.",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error.",
    });
  }
};
