import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { Response } from "express";
import logger from "../utils/logger";
import { RewardPrice } from "../models/rewardPrice";
import { CustomRequest } from "../types";

const rewardPriceController = () => {
  const createPrice = async (req: CustomRequest, res: Response) => {
    try {
      const {
        impressionReward,
        tweetsReward,
        retweetsReward,
        spacesAttendedReward,
        telegramReward,
        commentReward,
      } = req.body;

      // Log the request body for debugging
      logger.info("Received request to create reward price", req.body);

      // Create a new RewardPrice entry
      const newPrice = await RewardPrice.create({
        impressionReward,
        tweetsReward,
        retweetsReward,
        spacesAttendedReward,
        telegramReward,
        commentReward,
      });

      // Check if the entry was created successfully
      if (newPrice) {
        logger.info("Reward price created successfully", newPrice);
        return sendSuccessResponse({
          res,
          data: { success: true, data: newPrice },
          message: "price created successfully",
        });
      } else {
        logger.error("Failed to create reward price");
        sendErrorResponse({
          req,
          res,
          error: "Failed to create reward price",
          statusCode: 500,
        });
      }
    } catch (error) {
      // Handle errors and log them
      logger.error("Error in createPrice:", error);
      sendErrorResponse({
        req,
        res,
        error: error.message,
        statusCode: 500,
      });
    }
  };

  return {
    createPrice,
  };
};

export default rewardPriceController;
