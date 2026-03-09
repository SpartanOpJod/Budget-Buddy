import express from "express";
import {
  budgetAdvisorController,
  generateInsightsController,
  predictCategoryController,
} from "../controllers/aiController.js";

const router = express.Router();

router.post("/insights", generateInsightsController);
router.post("/predict-category", predictCategoryController);
router.post("/budget-advisor", budgetAdvisorController);

export default router;
