import { Router } from "express";
import adminController from "../controller/adminController";

const user = adminController();
const adminRouter = Router();

adminRouter.post("/signin", user.adminSignIn);
adminRouter.post("/signup", user.adminSignUp);

export default adminRouter;
