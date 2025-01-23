import logger from "../utils/logger";
import { User } from "../models/user";
import mongoose from "mongoose";
import dailyRewardService from "./dailyReward";
import { createDailyLeaderboard } from "../cron/leaderboard";

const telegramService = () => {
  const dailyService = dailyRewardService();
  const incrementUserMessage = async (
    messageId: string,
    telegramId: string
  ) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const user = await User.findOne({ telegramId });
      if (!user) {
        logger.error(`User not found, with telegramId: ${telegramId}`);
        return;
      } else {
        logger.info(`User found, with telegramId: ${telegramId}`);

        const d = await dailyService.createSmsReward(
          user._id as string,
          session,
          messageId
        );

        logger.info(`Reward created for user: ${user._id}, rewardId: ${d._id}`);
      }
      await session.commitTransaction();
      // creating leader board
      createDailyLeaderboard();
    } catch (error) {
      await session.abortTransaction();
      logger.error(
        `failed to increment user message: ${error.message} of user: ${telegramId}`
      );
    } finally {
      await session.endSession();
    }
  };

  return { incrementUserMessage };
};

export default telegramService;
