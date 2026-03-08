import express from "express";
import {
  generateInsightsController,
  predictCategoryController,
} from "../controllers/aiController.js";

const router = express.Router();

router.post("/insights", generateInsightsController);
router.post("/predict-category", predictCategoryController);

export default router;
