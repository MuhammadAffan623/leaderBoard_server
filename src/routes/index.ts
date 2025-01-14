import { Router } from "express";
import userRouter from "./userRoute";
import rewardRouter from "./reward";

const router = Router();

router.use("/users", userRouter);
router.use("/rewards", rewardRouter);

export default router;
