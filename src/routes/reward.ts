import { Router } from "express";
import rewardPriceController from "../controller/rewardPriceController";
import { authenticateAdmin } from "../utils";
const reward = rewardPriceController();
const rewardRouter = Router();

rewardRouter.post("/", authenticateAdmin, reward.createPrice);
// update and delete endpoint
rewardRouter.get("/", authenticateAdmin, reward.getAllPrices); // Get all reward prices
rewardRouter.put("/:id", authenticateAdmin, reward.updatePriceById); // Update a reward price by ID
rewardRouter.delete("/:id", authenticateAdmin, reward.deletePriceById); //

export default rewardRouter;
