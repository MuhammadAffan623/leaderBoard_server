import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { Request, Response } from "express";
import logger from "../utils/logger";
import { User } from "../models/user";
import { createToken } from "../utils";
import { CustomRequest } from "../types";
import fs from "fs";
import { parseCsv } from "../utils/csvParser";
import passport from "passport";
import { config } from "../config";
import mongoose, { Types } from "mongoose";

const userController = () => {
  const getOrCreateUser = async (req: Request, res: Response) => {
    logger.info(`userController get or create user`);
    const session = await mongoose.startSession();
    session.startTransaction();
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
      const existingUser = await User.findOne({ walletAddress }).session(
        session
      );
      const existingUserId = await User.findOne({ twitterId }).session(session);

      if (existingUser?._id && existingUserId?._id) {
        if (
          (existingUser._id as Types.ObjectId).equals(
            existingUserId._id as Types.ObjectId
          )
        ) {
          const token = await createToken(existingUser);
          await session.commitTransaction();
          session.endSession();
          sendSuccessResponse({
            res,
            data: { user: existingUser, token },
            message: "User created successfully",
          });
        } else {
          const updatedUser = await User.findByIdAndUpdate(
            existingUser._id,
            {
              twitterId: existingUserId.twitterId,
              twitterUsername: existingUserId.twitterUsername,
              profileImage: existingUserId.profileImage,
              telegramId: existingUser.telegramId || existingUserId.telegramId,
            },
            {
              new: true,
              session,
            }
          ).lean();
          if (!updatedUser) {
            await session.abortTransaction();
            session.endSession();
            return sendErrorResponse({
              req,
              res,
              error: "Failed to update user",
              statusCode: 500,
            });
          }
          await User.findByIdAndDelete(existingUserId._id, { session });
          //complete here
          await session.commitTransaction();
          session.endSession();
          const token = await createToken(updatedUser);
          sendSuccessResponse({
            res,
            data: { user: updatedUser, token },
            message: "User created successfully, merged",
          });
        }
      } else {
        // this is for testing; creating user with endpoint
        logger.info(
          `User not found with wallet address: ${walletAddress}, creating new user `
        );
        const newUser = new User({ walletAddress, twitterId });
        const savedUser = await newUser.save({ session });
        const token = await createToken(savedUser);
        await session.commitTransaction();
        session.endSession();
        sendSuccessResponse({
          res,
          data: { user: savedUser, token },
          message: "User created successfully",
        });
      }
    } catch (error) {
      await session.abortTransaction(); // Rollback on error
      session.endSession();
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

  const checkWhiteList = async (req: Request, res: Response) => {
    logger.info("checking is the wallet white listed ");
    try {
      const { walletAddress } = req.body;
      logger.info("walletAddress => ", walletAddress);
      if (!walletAddress) {
        return sendErrorResponse({
          req,
          res,
          error: "wallet address is required",
          statusCode: 404,
        });
      }

      const existingUser = await User.findOne({ walletAddress });
      if (existingUser && existingUser.isWhiteListed) {
        const token = await createToken(existingUser);
        return sendSuccessResponse({
          res,
          data: { isWhitelist: true, user: existingUser, token },
          message: "wallet address is white listed",
        });
      }
      if (existingUser && !existingUser.isWhiteListed) {
        const token = await createToken(existingUser);
        return sendSuccessResponse({
          res,
          data: { isWhitelist: false, user: existingUser, token },
          message: "wallet address is not white listed",
        });
      }
      if (!existingUser) {
        const newUser = new User({ walletAddress, isWhiteListed: false });
        const savedUser = await newUser.save();
        const token = await createToken(savedUser);
        return sendSuccessResponse({
          res,
          data: { isWhitelist: false, user: savedUser, token },
          message: "wallet address is not white listed",
        });
      }
    } catch (error) {
      logger.error(
        `Error while checking user whotelist status==> `,
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

  const addTelegram = async (req: CustomRequest, res: Response) => {
    try {
      const { userId } = req;
      const { telegramId } = req.body;
      console.log("user", userId);
      const existingUser = await User.findById(userId);
      if (!existingUser) {
        return sendErrorResponse({
          req,
          res,
          error: "token has been expired",
          statusCode: 404,
        });
      }
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { telegramId },
        {
          new: true, // Return the updated document
          runValidators: true, // Run schema validations
        }
      );
      if (!updatedUser) {
        return sendErrorResponse({
          req,
          res,
          error: "failed to add telegram",
          statusCode: 500,
        });
      }
      const token = await createToken(updatedUser);
      return sendSuccessResponse({
        res,
        data: { user: updatedUser, token },
        message: "add telegram successfully",
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
  const getUserbyToken = async (req: CustomRequest, res: Response) => {
    try {
      const { userId } = req;
      console.log("user", userId);
      const existingUser = await User.findById(userId);
      if (!existingUser) {
        return sendErrorResponse({
          req,
          res,
          error: "token has been expired",
          statusCode: 404,
        });
      }
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
          { new: true, upsert: true }
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
  const login = passport.authenticate("twitter");
  const twitterCallback = passport.authenticate("twitter", {
    // successRedirect: "http://localhost:5173/twitterSuccess", //fe path to get
    failureRedirect: "/login",
  });
  const twitterCallbackToken = async (req: CustomRequest, res: Response) => {
    console.log("req.user", req.user);
    console.log("req.user", req?.session);
    const user = req.user;
    if (!user) return;
    const token = await createToken(user);
    console.log("token==>", { token });
    return res.redirect(`${config.frontend_url}/twitterSuccess?token=${token}`);
  };
  return {
    getOrCreateUser,
    getUserbyToken,
    getAllUsers,
    whiteListUser,
    adminUpdateUser,
    updateUser,
    login,
    twitterCallback,
    twitterCallbackToken,
    checkWhiteList,
    addTelegram,
  };
};

export default userController;
