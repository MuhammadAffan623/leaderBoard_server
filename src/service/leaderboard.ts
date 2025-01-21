import { CreateLeaderboardObject } from "../types";
import { Leaderboard } from "../models/leaderBoard";
import { ClientSession } from "mongoose";

const leaderBoardService = () => {
  const createMultipleLeaderBoards = async (
    leaderboardData: CreateLeaderboardObject[],
    session?: ClientSession
  ) => {
    // delete todays leaderboard data created earlier
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Set to midnight UTC
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(today.getUTCDate() + 1); // Start of the next day

    await Leaderboard.deleteMany(
      {
        date: {
          $gte: today,
          $lte: tomorrow,
        },
      },
      { session }
    );
    const result = await Leaderboard.insertMany(leaderboardData, {
      session,
      ordered: true, // Ensures the operation stops at the first error
    });

    return result;
  };

  return {
    createMultipleLeaderBoards,
  };
};

export default leaderBoardService;
// // Create a new leaderboard entry
// const newEntry = await Leaderboard.create({
//   userId: someUserId,
//   leaderboardType: LeaderboardTypes.Program_Members,
//   rank: 1,
//   score: 1000,
//   metrics: {
//     impressions: 500,
//     tweets: 50,
//     retweets: 25,
//     telegramMessages: 100,
//   },
//   date: new Date(), // Today's date
// });

// // Get top 10 users for today
// const topUsers = await Leaderboard.find({
//   leaderboardType: LeaderboardTypes.Program_Members,
//   date: new Date(),
// })
//   .sort({ score: -1 })
//   .limit(10)
//   .populate("userId");

// // Get user's rank for a specific date
// const userRank = await Leaderboard.findOne({
//   userId: userId,
//   leaderboardType: LeaderboardTypes.Program_Members,
//   date: specificDate,
// });

// // Get user's history
// const userHistory = await Leaderboard.find({
//   userId: userId,
//   leaderboardType: LeaderboardTypes.Program_Members,
// })
//   .sort({ date: -1 })
//   .limit(7); // Last 7 days
