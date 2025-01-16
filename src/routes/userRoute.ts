import { Router } from "express";
import userController from "../controller/userController";
import { authenticateAdmin, decodeTokenFromRequest } from "../utils";
import { upload } from "../utils/multer";

const user = userController();
const userRouter = Router();

userRouter.post("/", user.getOrCreateUser);
userRouter.get("/", decodeTokenFromRequest, user.getUserbyToken);
// update user endpoint
userRouter.post("/me", decodeTokenFromRequest, user.updateUser);
userRouter.post(
  "/whiteList",
  authenticateAdmin,
  upload.single("file"),
  user.whiteListUser
);

// admin update
userRouter.post("/update/:id", authenticateAdmin, user.adminUpdateUser);
userRouter.get("/all", user.getAllUsers);
userRouter.get("/twitterlogin", user.login);
userRouter.get(
  "/twitterCallback",
  user.twitterCallback,
  user.twitterCallbackToken
);

export default userRouter;
