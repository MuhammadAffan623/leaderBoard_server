import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { Request, Response } from "express";
import logger from "../utils/logger";
import { User } from "../models/user";
import { createToken } from "../utils";
import { CustomRequest } from "../types";

const userController = () => {
  const getOrCreateUser = async (req: Request, res: Response) => {
    logger.info(`userController get or create user`);
    try {
      const { walletAddress } = req.body;

      if (!walletAddress) {
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
        const newUser = new User({ walletAddress });
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
      const query: any = {};

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

  return {
    getOrCreateUser,
    getUserbyToken,
    getAllUsers,
  };
};

export default userController;
