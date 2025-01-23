import { CreateLeaderboardObject } from "../types";
import { LeaderboardTypes } from "../models/leaderBoard";
import dailyRewardService from "../service/dailyReward";
import leaderBoardService from "../service/leaderboard";
import mongoose from "mongoose";

const rewardService = dailyRewardService();
const leaderBoardMethods = leaderBoardService();
export const createDailyLeaderboard = async () => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const date = new Date();
    const usersDailyRewardSum = await rewardService.getUsersDailyRewards();
    let leaderBoardObject: CreateLeaderboardObject[] = usersDailyRewardSum.map(
      (item, ind) => {
        return {
          userId: item.userId,
          leaderboardType: LeaderboardTypes.Program_Members, // have to see doc
          rank: ind + 1,
          score: item.score,
          metrics: {
            impressionsCount: item.totalImpressions,
            tweetsCount: item.totalTweets,
            retweetsCount: item.totalRetweets,
            telegramMessagesCount: item.totalTelegramMessages,
            spaceAttendedCount: item.totalSpaces,
            commentCount: item.totalComments,
          },
          date,
        };
      }
    );
    const result = await leaderBoardMethods.createMultipleLeaderBoards(
      leaderBoardObject,
      session
    );
    console.log("result");
    console.dir(result);
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    console.error(`Error creating leader board:`, error);
    throw error;
  } finally {
    await session.endSession();
  }
};
