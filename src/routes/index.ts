import { Router } from "express";
import userRouter from "./userRoute";
import rewardRouter from "./reward";
import adminRouter from "./adminRoute";

const router = Router();

router.use("/users", userRouter);
router.use("/admin", adminRouter);
router.use("/rewards", rewardRouter);

export default router;
