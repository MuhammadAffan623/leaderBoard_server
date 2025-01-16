import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import { Request, Response } from "express";
import logger from "../utils/logger";
import { createToken } from "../utils";
import { Admin } from "../models/admin";

const adminController = () => {
  // Admin Sign-Up
  const adminSignUp = async (req: Request, res: Response): Promise<void> => {
    logger.info("creating admin in ==> adminSignUp method ");
    const { email, password } = req.body;

    try {
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        sendErrorResponse({
          req,
          res,
          error: "Admin already exists!",
          statusCode: 400,
        });
        return;
      }

      const admin = new Admin({ email, password });
      await admin.save();

      sendSuccessResponse({
        res,
        message: "Admin registered successfully!",
        statusCode: 201,
      });
    } catch (error) {
      logger.error(error);
      sendErrorResponse({
        req,
        res,
        error: "Error while creating admin",
        statusCode: 500,
      });
    }
  };

  // Admin Sign-In
  const adminSignIn = async (req: Request, res: Response): Promise<void> => {
    logger.info("admin sign in => ", req.body);
    const { email, password } = req.body;

    try {
      const admin = await Admin.findOne({ email });
      if (!admin) {
        sendErrorResponse({
          req,
          res,
          error: "Admin with this eamil not exist",
          statusCode: 401,
        });
        return;
      }

      const isPasswordValid = await admin.comparePassword(password);
      if (!isPasswordValid) {
        sendErrorResponse({
          req,
          res,
          error: "Invalid email or password!",
          statusCode: 401,
        });
        return;
      }
      const token = await createToken(admin);
      sendSuccessResponse({
        res,
        message: "Admin logged in successfully!",
        statusCode: 200,
        data: {
          token,
          email: admin.email,
        },
      });
    } catch (error) {
      logger.error(`Error while admin sign in ==> `, error.message);
      sendErrorResponse({
        req,
        res,
        error: error.message,
        statusCode: 500,
      });
    }
  };

  return {
    adminSignUp,
    adminSignIn,
  };
};

export default adminController;
