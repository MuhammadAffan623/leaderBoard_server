import { Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../config";
import { CustomRequest } from "../types";
import { User, USERROLE } from "../models/user";

export const createToken = async (
  user: Record<string, any>
): Promise<string> => {
  try {
    // Ensure user object contains necessary fields
    if (!user || typeof user !== "object" || !user._id) {
      throw new Error("User object is invalid or missing required fields.");
    }

    const token = await jwt.sign({ id: user._id }, config.jwt_secret);
    return token;
  } catch (error) {
    console.error("Error creating token:", error);
    throw new Error("Failed to create token");
  }
};

export const decodeTokenFromRequest = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"] || "";

  if (!authHeader.startsWith("Bearer ")) {
    return next(new Error("Authorization token is missing or invalid"));
  }

  const token = authHeader.split(" ")[1]; // Extract token after "Bearer "

  try {
    const decodedUser = jwt.verify(token, config.jwt_secret) as JwtPayload;
    console.log({ decodedUser });

    if (!decodedUser) {
      return next(new Error("Invalid or expired token"));
    }

    req.userId = decodedUser.id; // Assign decoded user to the request object
    next(); // Pass control to the next middleware
  } catch (error) {
    return next(new Error("Invalid or expired token"));
  }
};

export const authorizeRoles = (role: USERROLE) => {
  return async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.userId) {
      return res.status(403).json({ message: "Access denied" });
    } else {
      const existingUser = await User.findById(req.userId);
      if (!existingUser)
        return res.status(403).json({ message: "User not found" });

      if (existingUser.role === role) {
        req.user = existingUser;
        next();
      } else {
        return res
          .status(403)
          .json({ message: "User not Authorized for this action" });
      }
    }
  };
};
