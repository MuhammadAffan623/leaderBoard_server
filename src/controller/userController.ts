import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { Request, Response } from "express";
import logger from "../utils/logger";
import { User } from "../models/user";
import { createToken } from "../utils";
import { CustomRequest } from "../types";
import fs from "fs";
import { parseCsv } from "../utils/csvParser";
const userController = () => {
  const getOrCreateUser = async (req: Request, res: Response) => {
    logger.info(`userController get or create user`);
    try {
      const { walletAddress, twitterId } = req.body;

      if (!walletAddress || !twitterId) {
        return sendErrorResponse({
          req,
          res,
          error: "wallet address is required",
          statusCode: 404,
        });
      }
      const existingUser = await User.findOne({ walletAddress });
      if (existingUser) {
        logger.info(`User found with wallet address: ${walletAddress}`);
        const token = await createToken(existingUser);
        sendSuccessResponse({
          res,
          data: { user: existingUser, token },
          message: "User fetched successfully",
        });
      } else {
        logger.info(
          `User not found with wallet address: ${walletAddress}, creating new user `
        );
        const newUser = new User({ walletAddress, twitterId });
        const savedUser = await newUser.save();
        const token = await createToken(savedUser);
        sendSuccessResponse({
          res,
          data: { user: savedUser, token },
          message: "User created successfully",
        });
      }
    } catch (error) {
      logger.error(
        `Error while getting user by wallet address ==> `,
        error.message
      );
      sendErrorResponse({
        req,
        res,
        error: error.message,
        statusCode: 500,
      });
    }
  };

  const getUserbyToken = async (req: CustomRequest, res: Response) => {
    try {
      const { userId } = req;
      console.log("user", userId);
      const existingUser = await User.findById(userId);
      return sendSuccessResponse({
        res,
        data: { user: existingUser },
        message: "User fetched successfully",
      });
    } catch (error) {
      logger.error(`Error while fetching all users ==> `, error.message);
      sendErrorResponse({
        req,
        res,
        error: error.message,
        statusCode: 500,
      });
    }
  };

  const getAllUsers = async (req: Request, res: Response) => {
    logger.info(`userController get all users`);
    try {
      const { page = 1, limit = 10, search } = req.query;
      const query: any = { role: "USER" }; // Ensure we only fetch users with role USER

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
        ];
      }

      const users = await User.find(query)
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

      const totalUsers = await User.countDocuments(query);

      sendSuccessResponse({
        res,
        data: {
          users,
          totalUsers,
          totalPages: Math.ceil(totalUsers / Number(limit)),
          currentPage: Number(page),
        },
        message: "Users fetched successfully",
      });
    } catch (error) {
      logger.error(`Error while fetching all users ==> `, error.message);
      sendErrorResponse({
        req,
        res,
        error: error.message,
        statusCode: 500,
      });
    }
  };

  // const createAdmin = async (req: Request, res: Response) => {
  //   logger.info(`userController get or create user`);
  //   try {
  //     const { email, password } = req.body;

  //     if (!email || !password) {
  //       return sendErrorResponse({
  //         req,
  //         res,
  //         error: "email and password are required",
  //         statusCode: 404,
  //       });
  //     }
  //     const existingUser = await User.findOne({ email });
  //     if (existingUser) {
  //       logger.info(`User found with email address: ${email}`);
  //       const token = await createToken(existingUser);
  //       sendSuccessResponse({
  //         res,
  //         data: { user: existingUser, token },
  //         message: "User fetched successfully",
  //       });
  //     } else {
  //       logger.info(
  //         `User not found with email address: ${email}, creating new user `
  //       );
  //       const newUser = new User({ email });
  //       const hashedPassword = bcrypt.hashSync(password, 10);
  //       newUser.password = hashedPassword;
  //       const savedUser = await newUser.save();
  //       const token = await createToken(savedUser);
  //       sendSuccessResponse({
  //         res,
  //         data: { user: savedUser, token },
  //         message: "User created successfully",
  //       });
  //     }
  //   } catch (error) {
  //     logger.error(
  //       `Error while getting user by wallet address ==> `,
  //       error.message
  //     );
  //     sendErrorResponse({
  //       req,
  //       res,
  //       error: error.message,
  //       statusCode: 500,
  //     });
  //   }
  // };

  const whiteListUser = async (req: Request, res: Response) => {
    logger.info("white list user with address");
    try {
      if (!req.file) {
        sendErrorResponse({
          req,
          res,
          error: "No file uploaded!",
          statusCode: 500,
        });
        return;
      }
      const filePath = req.file.path;
      const csvRows = await parseCsv(filePath);

      for (const row of csvRows) {
        const { walletAddress } = row;
        if (!walletAddress) continue;

        // Update user's isWishlist value to true if user exists
        await User.findOneAndUpdate(
          { walletAddress },
          { isWhiteListed: true },
          { new: true }
        );
      }
      // Delete the file after processing
      fs.unlink(filePath, (err) => {
        if (err) {
          logger.error("Error deleting file:", err);
        }
      });
      sendSuccessResponse({
        res,
        message: "Users white listed successfully",
      });
    } catch (error) {
      logger.error(`Error while white listing the user ==> `, error.message);
      sendErrorResponse({
        req,
        res,
        error: error.message,
        statusCode: 500,
      });
    }
  };

  const adminUpdateUser = async (req: Request, res: Response) => {
    logger.info("userController admin update user");
    try {
      const { id } = req.params; // Extract user ID from the route parameter
      const updates = req.body; // Extract update keys and values from the request body

      // Validate that the updates object is not empty
      if (!updates || Object.keys(updates).length === 0) {
        logger.error(`Error updating user ==> `);
        sendErrorResponse({
          req,
          res,
          error: "No updates provided",
          statusCode: 400,
        });
        return;
      }

      // Find the user by ID and update the fields
      const updatedUser = await User.findByIdAndUpdate(id, updates, {
        new: true, // Return the updated document
        runValidators: true, // Run schema validations
      });

      // If the user does not exist
      if (!updatedUser) {
        logger.error(`Error updating user ==> `);
        sendErrorResponse({
          req,
          res,
          error: "User not found",
          statusCode: 404,
        });
        return;
      }

      // Respond with the updated user
      sendSuccessResponse({
        res,
        data: { updatedUser },
        message: "User updated successfully",
      });
    } catch (error) {
      logger.error(`Error updating user ==> `, error.message);
      sendErrorResponse({
        req,
        res,
        error: error.message,
        statusCode: 500,
      });
    }
  };

  const updateUser = async (req: CustomRequest, res: Response) => {
    logger.info("userController update user");
    try {
      const { userId } = req;
      const updates = req.body; // Extract update keys and values from the request body

      // Validate that the updates object is not empty
      if (!updates || Object.keys(updates).length === 0) {
        logger.error(`Error updating user ==> `);
        sendErrorResponse({
          req,
          res,
          error: "No updates provided",
          statusCode: 400,
        });
        return;
      }

      // Find the user by ID and update the fields
      const updatedUser = await User.findByIdAndUpdate(userId, updates, {
        new: true, // Return the updated document
        runValidators: true, // Run schema validations
      });

      // If the user does not exist
      if (!updatedUser) {
        logger.error(`Error updating user ==> `);
        sendErrorResponse({
          req,
          res,
          error: "User not found",
          statusCode: 404,
        });
        return;
      }

      // Respond with the updated user
      sendSuccessResponse({
        res,
        data: { updatedUser },
        message: "User updated successfully",
      });
    } catch (error) {
      logger.error(`Error updating user ==> `, error.message);
      sendErrorResponse({
        req,
        res,
        error: error.message,
        statusCode: 500,
      });
    }
  };

  return {
    getOrCreateUser,
    getUserbyToken,
    getAllUsers,
    whiteListUser,
    adminUpdateUser,
    updateUser,
  };
};

export default userController;
