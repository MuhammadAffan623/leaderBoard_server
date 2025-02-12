import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { Request, Response } from "express";
import logger from "../utils/logger";
import { DailyReward } from "../models/dailyReward";
import rewardPriceService from "../service/rewardPrice";
import { IUserActivity, UserActivity } from "../models/userActivity";
import { Types } from "mongoose";
// import { UserActivity } from "../models/userActivity";

const DailyRewardController = () => {
  const rewardService = rewardPriceService();

  const adjustUserReward = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    logger.info("Adjusting user reward");

    try {
      const {
        userId,
        impressionsCount = 0,
        tweetCounts = 0,
        telegramMessagesCount = 0,
        retweetCounts = 0,
        commentCounts = 0,
      } = req.body;

      // Validate required fields
      if (!userId) {
        sendErrorResponse({
          req,
          res,
          error: "User ID is required",
          statusCode: 400,
        });
        return;
      }

      const latestReward = await rewardService.getLatestPrice();
      if (!latestReward) {
        sendErrorResponse({
          req,
          res,
          error: "You need to add reward price first",
          statusCode: 500,
        });
        return;
      }

      // Calculate reward safely
      const totalPrice =
        (latestReward.impressionReward || 0) * impressionsCount +
        (latestReward.tweetsReward || 0) * tweetCounts +
        (latestReward.retweetsReward || 0) * retweetCounts +
        (latestReward.commentReward || 0) * commentCounts +
        (latestReward.telegramReward || 0) * telegramMessagesCount;

      // Save the reward entry
      const newReward = await DailyReward.create({
        userId,
        impressionsCount,
        tweetCounts,
        telegramMessagesCount,
        retweetCounts,
        commentCounts,
        calculatedReward: totalPrice,
      });

      sendSuccessResponse({
        res,
        data: {
          success: true,
          reward: newReward,
        },
      });
    } catch (error) {
      logger.error(error);
      sendErrorResponse({
        req,
        res,
        error: "Error adjusting user reward",
        statusCode: 500,
      });
    }
  };

  const removeActivityId = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { userId, activityId } = req.body; // User ID and the ID to remove

      if (!userId || !activityId) {
        sendErrorResponse({
          req,
          res,
          error: "User ID and Activity ID are required",
          statusCode: 400,
        });
        return;
      }

      // Find the user activity document
      const userActivity = await UserActivity.findOne({ userId });
      if (!userActivity) {
        sendErrorResponse({
          req,
          res,
          error: "User activity not found",
          statusCode: 404,
        });
        return;
      }

      // Cast userActivity as IUserActivity to avoid TypeScript error
      const activityDoc = userActivity as IUserActivity;

      // List of fields that contain activity IDs
      const fields: (keyof IUserActivity)[] = [
        "tweetIds",
        "retweetIds",
        "commentIds",
        "spaceAttendedIds",
        "telegramSmsIds",
      ];

      let updated = false;

      // Remove the activity ID from the relevant array
      fields.forEach((field) => {
        if (Array.isArray(activityDoc[field])) {
          const index = (activityDoc[field] as string[]).indexOf(activityId);
          if (index !== -1) {
            (activityDoc[field] as string[]).splice(index, 1); // Remove the ID
            updated = true;
          }
        }
      });

      if (!updated) {
        sendErrorResponse({
          req,
          res,
          error: "Activity ID not found in any field",
          statusCode: 404,
        });
        return;
      }

      // Save the updated document
      await userActivity.save();

      sendSuccessResponse({
        res,
        data: {
          success: true,
          message: "Activity ID removed successfully",
        },
      });
    } catch (error) {
      logger.error(error);
      sendErrorResponse({
        req,
        res,
        error: "Error removing activity ID",
        statusCode: 500,
      });
    }
  };

  const userActivity = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info("get user UserActivity");
      const { userId } = req.params;

      const userActivity = await UserActivity.findOne({
        userId: new Types.ObjectId(userId),
      });
      sendSuccessResponse({
        res,
        data: {
          success: true,
          message: "successfully fetched user activity",
          tweetIds: userActivity?.tweetIds || [],
          retweetIds: userActivity?.retweetIds || [],
          commentIds: userActivity?.commentIds || [],
          userActivity
        },
      });
    } catch (error) {
      logger.error("Error fetching user activity:", error);
      sendErrorResponse({
        req,
        res,
        error: "Failed to fetch user activity",
        statusCode: 500,
      });
    }
  };

  return { adjustUserReward, removeActivityId, userActivity };
};

export default DailyRewardController;
