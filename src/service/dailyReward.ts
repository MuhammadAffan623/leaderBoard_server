import mongoose, { ClientSession, Types } from "mongoose";
import { DailyReward } from "../models/dailyReward";
import rewardPriceService from "./rewardPrice";
import { UserActivity } from "../models/userActivity";
import { mergeArrays } from "../utils";
import userActivityService from "./userActivity";
import MetaDataController from "../controller/metaData";
import { IUser, User } from "../models/user";

const dailyRewardService = () => {
  const rewardService = rewardPriceService();
  const activityService = userActivityService();
  const getUsersDailyRewards = async () => {
    const latestMetaData = await MetaDataController().getLatestObj();
    if (!latestMetaData) return [];
    const leaderDate = latestMetaData.leaderBoardCreation;
    try {
      const groupedRewards = await DailyReward.aggregate([
        // match me created at awala seen add krna
        { $match: { createdAt: { $gte: leaderDate } } },
        {
          $group: {
            _id: "$userId", // Group by userId
            totalImpressions: { $sum: "$impressionsCount" },
            totalTweets: { $sum: "$tweetCounts" },
            totalRetweets: { $sum: "$retweetCounts" },
            totalComments: { $sum: "$commentCounts" },
            totalSpaces: { $sum: "$spacesAttendedCount" },
            totalTelegramMessages: { $sum: "$telegramMessagesCount" },
            score: { $sum: "$calculatedReward" },
            rewards: { $push: "$$ROOT" }, // Include all original reward records for each user
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: {
            path: "$userDetails",
            preserveNullAndEmptyArrays: true, // Optional: Retain users even if no userDetails are found
          },
        },
        {
          $project: {
            _id: 0,
            userId: "$_id",
            userDetails: 1,
            totalImpressions: 1,
            totalTweets: 1,
            totalRetweets: 1,
            totalComments: 1,
            totalSpaces: 1,
            totalTelegramMessages: 1,
            score: 1,
            rewards: 1,
          },
        },
        {
          $sort: { score: -1 }, // Sort by score in descending order
        },
      ]);

      return groupedRewards;
    } catch (error) {
      throw new Error(`Failed to fetch grouped user rewards: ${error.message}`);
    }
  };

  const getSpecificUserRewards = async (userId: string) => {
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }

      const userRewards = await DailyReward.aggregate([
        {
          $match: { userId }, // Filter records for the specific user ID
        },
        {
          $group: {
            _id: "$userId", // Group by userId
            totalImpressions: { $sum: "$impressionsCount" },
            totalTweets: { $sum: "$tweetCounts" },
            totalRetweets: { $sum: "$retweetCounts" },
            totalComments: { $sum: "$commentCounts" },
            totalSpaces: { $sum: "$spacesAttendedCount" },
            totalTelegramMessages: { $sum: "$telegramMessagesCount" },
            score: { $sum: "$calculatedReward" },
            rewards: { $push: "$$ROOT" }, // Include all original reward records for the user
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: {
            path: "$userDetails",
            preserveNullAndEmptyArrays: true, // Optional: Retain record even if userDetails are not found
          },
        },
        {
          $project: {
            _id: 0,
            userId: "$_id",
            userDetails: 1,
            totalImpressions: 1,
            totalTweets: 1,
            totalRetweets: 1,
            totalComments: 1,
            totalSpaces: 1,
            totalTelegramMessages: 1,
            score: 1,
            rewards: 1,
          },
        },
      ]);

      return userRewards;
    } catch (error) {
      throw new Error(
        `Failed to fetch rewards for user ${userId}: ${error.message}`
      );
    }
  };
  const createInitialReward = async (
    userId: string,
    session: ClientSession
  ) => {
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }
      const id = new Types.ObjectId(userId);
      const newReward = new DailyReward({ userId: id });
      const reward = await newReward.save({ session });
      return reward;
    } catch (error) {
      throw new Error(
        `Failed to create reward for user ${userId}: ${error.message}`
      );
    }
  };

  const createInitialRewardForAllUsers = async (
    time: string
  ): Promise<boolean> => {
    const session = await mongoose.startSession();
    console.log("time >> ",time)
    console.log("time >> ",new Date(time))
    try {
      await session.withTransaction(async () => {
        // await is missing in original code
        const users = await User.find({
          twitterId: { $exists: true, $ne: null },
        }).lean();

        // Process users in batches to avoid memory issues
        const batchSize = 100;
        for (let i = 0; i < users.length; i += batchSize) {
          const batch = users.slice(i, i + batchSize);
          const rewardPromises = batch.map((user: IUser) => {
            const id = new Types.ObjectId(user._id as string);
            const newReward = new DailyReward({
              userId: id,
              createdAt: new Date(time),
            });
            return newReward.save({ session });
          });

          await Promise.all(rewardPromises);
        }
      });

      return true;
    } catch (error) {
      console.error("Error creating initial rewards:", error);
      return false;
    } finally {
      await session.endSession();
    }
  };

  const createSmsReward = async (
    userId: string,
    messageId: string
  ) => {
    try {
      if (!userId || !messageId) {
        throw new Error("User ID and messageId is required");
      }
      const latestReward = await rewardService.getLatestPrice();
      if (!latestReward) {
        throw new Error("No reward price data found");
      }
      const id = new Types.ObjectId(userId);
      const userActivity = await UserActivity.findOne({ userId: id });
      const totalTelegramSmsId = await mergeArrays(
        userActivity?.telegramSmsIds ?? [],
        [messageId]
      );
      // await activityService.createOrUpdateUserActivity(
      //   userId,
      //   {
      //     telegramSmsIds: totalTelegramSmsId,
      //   }
      // );
      const newReward = new DailyReward({
        userId: id,
        telegramMessagesCount: 1,
        calculatedReward: latestReward.telegramReward,
      });
      const reward = await newReward.save();
      return reward;
    } catch (error) {
      throw new Error(
        `Failed to create reward for user ${userId}: ${error.message}`
      );
    }
  };
  return {
    getUsersDailyRewards,
    getSpecificUserRewards,
    createInitialReward,
    createSmsReward,
    createInitialRewardForAllUsers,
  };
};

export default dailyRewardService;
