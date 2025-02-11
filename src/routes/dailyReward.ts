import { Router } from "express";
import DailyRewardController from "../controller/dailyRewardController";
import { authenticateAdmin } from "../utils";

const dailyreward = DailyRewardController();
const dailyRewardRouter = Router();

dailyRewardRouter.post("/", authenticateAdmin, dailyreward.adjustUserReward);
//removw specific tweet id , retweet id or comment id
dailyRewardRouter.post(
  "/removeid",
  authenticateAdmin,
  dailyreward.removeActivityId
);

export default dailyRewardRouter;
