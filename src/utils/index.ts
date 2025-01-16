import { Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../config";
import { CustomRequest } from "../types";
import { User, USERROLE } from "../models/user";
import { Admin } from "../models/admin";
import logger from "./logger";
import { sendErrorResponse } from "./response";

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

export const matchKeywordInString = async (
  text: string,
  keyword: string
): Promise<string[]> => {
  const pattern = new RegExp(
    `(\\$${keyword}|\\s${keyword}(?![a-zA-Z])|#${keyword}|${keyword}\\b)`,
    "g"
  );
  const matches = text.matchAll(pattern);
  return Array.from(matches, (match) => match[0]);
};

export const isKeywordinPost = (text: string): boolean => {
  const keywords = ["@tardionmoon", "$TARDI", "tardi", "TARDI", "@Tardionmoon"];
  return keywords.some((keyword) => text.includes(keyword));
};

// merging 2 arrays without making duplicates
export async function mergeArrays<T>(array1: T[], array2: T[]): Promise<T[]> {
  const mergedSet = new Set([...array1, ...array2]);
  return Array.from(mergedSet);
}
export async function getDifference(number1: number, number2: number) {
  return Math.abs(number1 - number2);
}
// async function countKeywords(
//   arrayOfTweet: { text?: string }[],
//   keyword: string
// ): Promise<number> {
//   let count = 0;
//   await Promise.all(
//     arrayOfTweet.map(async (tweet) => {
//       if (tweet?.text) {
//         const occurred = await matchKeywordInString(tweet.text, keyword);
//         count += occurred.length || 0;
//       }
//     })
//   );
//   return count;
// }

export const authenticateAdmin = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  logger.info("Authenticating admin in authenticateAdmin");
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    sendErrorResponse({
      req,
      res,
      error: "Unauthorized: No token provided!",
      statusCode: 401,
    });
    return;
  }

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, config.jwt_secret) as JwtPayload;
    logger.info("decoded response => ", decoded);
    req.userId = decoded.id;

    // Check if admin exists in the database
    const admin = await Admin.findById(req.userId);
    logger.info(`Admin =>`, admin);
    if (!admin) {
      sendErrorResponse({
        req,
        res,
        error: "Unauthorized: Your are not authorized for this method",
        statusCode: 401,
      });
      return;
    }

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    logger.error("Authentication error:", error);
    sendErrorResponse({
      req,
      res,
      error: "Unauthorized: Invalid or expired token!",
      statusCode: 401,
    });
  }
};
