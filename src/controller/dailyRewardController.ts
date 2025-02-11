import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { Request, Response } from "express";
import logger from "../utils/logger";
import { DailyReward } from "../models/dailyReward";
import rewardPriceService from "../service/rewardPrice";

const DailyRewardController = () => {
  const rewardService = rewardPriceService();

  const adjustUserReward = async (req: Request, res: Response): Promise<void> => {
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

  return { adjustUserReward };
};

export default DailyRewardController;
