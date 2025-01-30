import { Router } from "express";
import MetaDataController from "../controller/metaData";
const metaDataController = MetaDataController();
const metaDataRouter = Router();

metaDataRouter.get("/latest", metaDataController.getLatest);
metaDataRouter.post("/", metaDataController.createFirst);
metaDataRouter.post("/update/:id", metaDataController.updateExisting);

export default metaDataRouter;
