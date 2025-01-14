import { DailyReward } from "../models/dailyReward";

const dailyRewardService = () => {
  const getUsersDailyRewards = async () => {
    try {
      const groupedRewards = await DailyReward.aggregate([
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
  return { getUsersDailyRewards };
};

export default dailyRewardService;
