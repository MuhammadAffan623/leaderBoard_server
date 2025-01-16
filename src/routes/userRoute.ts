import { Router } from "express";
import userController from "../controller/userController";
import { decodeTokenFromRequest } from "../utils";
import { upload } from "../utils/multer";
const user = userController();
const userRouter = Router();

userRouter.post("/", user.getOrCreateUser);
userRouter.get("/", decodeTokenFromRequest, user.getUserbyToken);
// userRouter.post("/admin", user.createAdmin);
userRouter.post("/whiteList",upload.single("file"), user.whiteListUser)

export default userRouter;
