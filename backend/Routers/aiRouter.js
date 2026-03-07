import express from "express";
import { generateInsightsController } from "../controllers/aiController.js";

const router = express.Router();

router.post("/insights", generateInsightsController);

export default router;
