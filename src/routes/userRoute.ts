import { Router } from "express";
import userController from "../controller/userController";
import { decodeTokenFromRequest } from "../utils";
const user = userController();
const userRouter = Router();

userRouter.post("/", user.getOrCreateUser);
userRouter.get("/", decodeTokenFromRequest, user.getUserbyToken);

export default userRouter;
