import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { Request, Response } from "express";
import logger from "../utils/logger";
import { Leaderboard } from "../models/leaderBoard";

const leaderboardController = () => {
  const getTodaysBoard = async (req: Request, res: Response): Promise<void> => {
    logger.info("get todays leader board");
    try {
      // Create start and end of today
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0); // Set to midnight UTC
      const tomorrow = new Date(today);
      tomorrow.setUTCDate(today.getUTCDate() + 1); // Start of the next day

      logger.info("today ==> ",today); // Debugging
      logger.info("tomorrow ==> ",tomorrow); // Debugging

      // Fetch leaderboard data for today
      const lboard = await Leaderboard.find({
        date: {
          $gte: today, // Greater than or equal to today
          $lt: tomorrow, // Less than tomorrow
        },
      })
        .sort("rank")
        .populate({
          path: "userId", // Populate the userId field
          select: "twitterUsername walletAddress isWhiteListed profileImage", // Select specific fields to include from User
        });

      sendSuccessResponse({
        res,
        data: {
          leaderBoard: lboard,
          total: lboard?.length,
        },
        message: "Leader board fetched successfully!",
      });
    } catch (error) {
      logger.error(error);
      sendErrorResponse({
        req,
        res,
        error: "Error while getting board",
        statusCode: 500,
      });
    }
  };

  const getLeaderboardByDateRange = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      logger.info("get leader bord woth date range");
      // Parse start and end dates from the request query or body
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        sendErrorResponse({
          req,
          res,
          error: "Both startDate and endDate are required",
          statusCode: 400,
        });
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      if (start > end) {
        sendErrorResponse({
          req,
          res,
          error: "Start date must be earlier than or equal to the end date",
          statusCode: 400,
        });
        return;
      }
      end.setUTCHours(23, 59, 59, 999); // Include the entire end day

      // Aggregate leaderboard data
      const aggregatedData = await Leaderboard.aggregate([
        // Match documents within the specified date range
        {
          $match: {
            date: {
              $gte: start,
              $lte: end,
            },
          },
        },
        // Group by userId and accumulate scores and metrics
        {
          $group: {
            _id: "$userId",
            totalScore: { $sum: "$score" },
            totalImpressionsCount: { $sum: "$metrics.impressionsCount" },
            totalTweetsCount: { $sum: "$metrics.tweetsCount" },
            totalRetweetsCount: { $sum: "$metrics.retweetsCount" },
            totalTelegramMessagesCount: {
              $sum: "$metrics.telegramMessagesCount",
            },
            totalSpaceAttendedCount: { $sum: "$metrics.spaceAttendedCount" },
            totalCommentCount: { $sum: "$metrics.commentCount" },
          },
        },
        // Sort by totalScore in descending order
        {
          $sort: { totalScore: -1 },
        },
        // Optionally reshape the output (optional step)
        {
          $project: {
            userId: "$_id",
            _id: 0, // Remove MongoDB's default _id field
            totalScore: 1,
            metrics: {
              totalImpressionsCount: "$totalImpressionsCount",
              totalTweetsCount: "$totalTweetsCount",
              totalRetweetsCount: "$totalRetweetsCount",
              totalTelegramMessagesCount: "$totalTelegramMessagesCount",
              totalSpaceAttendedCount: "$totalSpaceAttendedCount",
              totalCommentCount: "$totalCommentCount",
            },
          },
        },
      ]);

      // Send success response with aggregated data
      sendSuccessResponse({
        res,
        data: { leaderboard: aggregatedData },
        message: "Leaderboard data fetched successfully!",
      });
    } catch (error) {
      logger.error(error);
      sendErrorResponse({
        req,
        res,
        error: "Error while fetching leaderboard data",
        statusCode: 500,
      });
    }
  };

  return {
    getTodaysBoard,
    getLeaderboardByDateRange,
  };
};

export default leaderboardController;
