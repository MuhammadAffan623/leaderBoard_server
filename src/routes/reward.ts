import { Router } from "express";
import rewardPriceController from "../controller/rewardPriceController";
const reward = rewardPriceController();
const rewardRouter = Router();

rewardRouter.post("/", reward.createPrice);
// update and delete endpoint

export default rewardRouter;
