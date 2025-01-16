import { Router } from "express";
import userRouter from "./userRoute";
import rewardRouter from "./reward";
import adminRouter from "./adminRoute";
import leaderboardRouter from "./leaderboard";

const router = Router();

router.use("/users", userRouter);
router.use("/admin", adminRouter);
router.use("/rewards", rewardRouter);
router.use("/leaderboard", leaderboardRouter);

export default router;
