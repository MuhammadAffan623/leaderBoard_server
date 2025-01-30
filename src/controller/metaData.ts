import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { Response } from "express";
import logger from "../utils/logger";
import { CustomRequest } from "../types";
import { MetaData } from "../models/metaData";
const MetaDataController = () => {
  const createFirst = async (req: CustomRequest, res: Response) => {
    try {
      const { fetchDate, leaderBoardCreation } = req.body;
      // Log the request body for debugging
      logger.info("Received request to create metadata", req.body);
      if (!fetchDate || !leaderBoardCreation) {
        sendErrorResponse({
          req,
          res,
          error: "fetchdata and leaderboardcreation is required",
          statusCode: 500,
        });
      }
      const metdata = await MetaData.create({
        fetchDate,
        leaderBoardCreation,
      });
      if (metdata) {
        logger.info("Meta data created successfully", metdata);
        return sendSuccessResponse({
          res,
          data: { success: true, data: metdata },
          message: "Meta data created successfully",
        });
      } else {
        logger.error("Failed to create meta data");
        sendErrorResponse({
          req,
          res,
          error: "Failed to create meta data",
          statusCode: 500,
        });
      }
    } catch (error) {
      logger.error("Error in createmetData:", error);
      sendErrorResponse({
        req,
        res,
        error: error.message,
        statusCode: 500,
      });
    }
  };
  const updateExisting = async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { fetchDate, leaderBoardCreation } = req.body;

      logger.info("Received request to updatemeta data", {
        id,
        updates: req.body,
      });
      if (!fetchDate || !leaderBoardCreation) {
        sendErrorResponse({
          req,
          res,
          error: "fetchdata and leaderboardcreation is required",
          statusCode: 500,
        });
      }
      const updatedData = await MetaData.findByIdAndUpdate(
        id,
        { fetchDate, leaderBoardCreation },
        {
          new: true,
          runValidators: true,
        }
      );
      if (updatedData) {
        logger.info("meta data updated successfully", updatedData);
        return sendSuccessResponse({
          res,
          data: { success: true, data: updatedData },
          message: "meta data updated successfully",
        });
      } else {
        logger.error("meta data not found");
        sendErrorResponse({
          req,
          res,
          error: "meta data not found",
          statusCode: 404,
        });
      }
    } catch (error) {
      logger.error("Error in updating meta data:", error);
      sendErrorResponse({
        req,
        res,
        error: error.message,
        statusCode: 500,
      });
    }
  };

  const getLatest = async (req: CustomRequest, res: Response) => {
    try {
      const latestMeta = await MetaData.find().sort("-createdAt");
      return sendSuccessResponse({
        res,
        data: { success: true, data: latestMeta },
        message: "meta data updated successfully",
      });
    } catch (error) {
      logger.error("Error in fetching meta data:", error);
      sendErrorResponse({
        req,
        res,
        error: error.message,
        statusCode: 500,
      });
    }
  };
  return {
    createFirst,
    updateExisting,
    getLatest,
  };
};

export default MetaDataController;
