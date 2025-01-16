import { Router } from "express";
import leaderboardController from "../controller/leaderboardController";
const leaderBoardController = leaderboardController();
const leaderboardRouter = Router();

leaderboardRouter.get("/today", leaderBoardController.getTodaysBoard);
leaderboardRouter.get("/", leaderBoardController.getLeaderboardByDateRange);

export default leaderboardRouter;
