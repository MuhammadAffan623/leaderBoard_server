import { Router } from "express";
import DailyRewardController from "../controller/dailyRewardController";
import { authenticateAdmin } from "../utils";

const dailyreward = DailyRewardController();
const dailyRewardRouter = Router();

dailyRewardRouter.post("/", authenticateAdmin, dailyreward.adjustUserReward);

export default dailyRewardRouter;
