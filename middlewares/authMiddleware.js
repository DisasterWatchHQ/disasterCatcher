import jwt from "jsonwebtoken";
import User from "../models/users.js";

export const protectRoute = async (req, res, next) => {
  try {
    let token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];
    let user = null;

    if (token) {
      try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        user = await User.findById(decodedToken.userId);
        if (!user) throw new Error("Invalid token or user not found");
      } catch (error) {
        if (error.name === "TokenExpiredError") {
          return res.status(401).json({ success: false, message: "Token expired, please log in again." });
        } else if (error.name === "JsonWebTokenError") {
          return res.status(401).json({ success: false, message: "Invalid token format." });
        } else {
          return res.status(401).json({ success: false, message: "Error verifying token." });
        }
      }
    } else {
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
    console.error("Auth Error:", error);
    return res.status(401).json({ success: false, message: "Not authorized." });
  }
};

export const verifyVerifiedUser = async (req, res, next) => {
  try {
    if (!req.user || !req.user.isVerified) {
      return res.status(403).json({ success: false, message: "Access denied. This action requires a verified user." });
    }
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error checking user verification status." });
  }
};

export const verifyToken = async (req, res, next) => {
  console.log("Cookies:", req.cookies);
  console.log("Headers:", req.headers);

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "Access Denied. No Token Provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found." });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid Token." });
  }
};

export const authenticate = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route.",
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found.",
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route.",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error in authentication.",
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route.`,
      });
    }
    next();
  };
};
