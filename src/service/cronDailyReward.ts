import { ICreateCron, TotalCounts } from "../types";
import { CronDailyReward } from "../models/dailyReward";

const cronDailyRewardService = () => {
  const getAllCronReward = async (userId: string): Promise<TotalCounts> => {
    try {
      const allCronData = await CronDailyReward.find({ userId }).lean();

      const totals = allCronData.reduce(
        (acc, item) => {
          // Add all counts to their respective totals
          acc.totalImpressionCount += item.impressionsCount || 0;
          acc.totalTweetCount += item.tweetCounts || 0;
          acc.totalRetweetCount += item.retweetCounts || 0;
          acc.totalSpacesAttendedCount += item.spacesAttendedCount || 0;
          acc.totalTelegramMessagesCount += item.telegramMessagesCount || 0;
          acc.totalCalculatedReward += item.calculatedReward || 0;
          acc.totalCommentCounts += item.commentCounts || 0;
          return acc;
        },
        {
          totalImpressionCount: 0,
          totalTweetCount: 0,
          totalRetweetCount: 0,
          totalSpacesAttendedCount: 0,
          totalTelegramMessagesCount: 0,
          totalCalculatedReward: 0,
          totalCommentCounts: 0,
        }
      );

      return totals;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to all CronDailyReward: ${error.message}`);
      }
      throw new Error("Failed to all CronDailyReward");
    }
  };

  // Create new CronDailyReward entry
  const createCronDailyReward = async (data: ICreateCron) => {
    try {
      // Validate userId
      if (!data.userId) {
        throw new Error("userId is required");
      }

      // Create the new CronDailyReward document
      const newCronReward = await CronDailyReward.create({
        userId: data.userId,
        impressionsCount: data.impressionsCount || 0,
        tweetCounts: data.tweetCounts || 0,
        retweetCounts: data.retweetCounts || 0,
        commentCounts: data.commentCounts || 0,
        spacesAttendedCount: data.spacesAttendedCount || 0,
        telegramMessagesCount: data.telegramMessagesCount || 0,
        calculatedReward: data.calculatedReward || 0,
      });

      // Remember: Due to the pre-save middleware we added earlier,
      // this will automatically create a corresponding DailyReward document

      return newCronReward;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create CronDailyReward: ${error.message}`);
      }
      throw new Error("Failed to create CronDailyReward");
    }
  };

  return { getAllCronReward, createCronDailyReward };
};

export default cronDailyRewardService;
