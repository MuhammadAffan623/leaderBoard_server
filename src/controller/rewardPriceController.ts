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
          message: "Price created successfully",
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

  // Get all reward prices
  const getAllPrices = async (req: CustomRequest, res: Response) => {
    try {
      logger.info("Received request to fetch all reward prices");

      const prices = await RewardPrice.find().lean();

      return sendSuccessResponse({
        res,
        data: { success: true, data: prices },
        message: "No prices found",
      });
    } catch (error) {
      logger.error("Error in getAllPrices:", error);
      sendErrorResponse({
        req,
        res,
        error: error.message,
        statusCode: 500,
      });
    }
  };

  // Update a reward price by ID
  const updatePriceById = async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      logger.info("Received request to update reward price", { id, updates });

      const updatedPrice = await RewardPrice.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      });

      if (updatedPrice) {
        logger.info("Reward price updated successfully", updatedPrice);
        return sendSuccessResponse({
          res,
          data: { success: true, data: updatedPrice },
          message: "Price updated successfully",
        });
      } else {
        logger.error("Reward price not found");
        sendErrorResponse({
          req,
          res,
          error: "Reward price not found",
          statusCode: 404,
        });
      }
    } catch (error) {
      logger.error("Error in updatePriceById:", error);
      sendErrorResponse({
        req,
        res,
        error: error.message,
        statusCode: 500,
      });
    }
  };

  // Delete a reward price by ID
  const deletePriceById = async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;

      logger.info("Received request to delete reward price", { id });

      const deletedPrice = await RewardPrice.findByIdAndDelete(id);

      if (deletedPrice) {
        logger.info("Reward price deleted successfully", deletedPrice);
        return sendSuccessResponse({
          res,
          data: { success: true },
          message: "Price deleted successfully",
        });
      } else {
        logger.error("Reward price not found");
        sendErrorResponse({
          req,
          res,
          error: "Reward price not found",
          statusCode: 404,
        });
      }
    } catch (error) {
      logger.error("Error in deletePriceById:", error);
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
    getAllPrices,
    updatePriceById,
    deletePriceById,
  };
};

export default rewardPriceController;
