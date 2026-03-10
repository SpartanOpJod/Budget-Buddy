import express from "express";
import {
  budgetAdvisorController,
  generateInsightsController,
  parseTransactionTextController,
  predictCategoryController,
  spendingPredictionController,
} from "../controllers/aiController.js";

const router = express.Router();

router.post("/insights", generateInsightsController);
router.post("/predict-category", predictCategoryController);
router.post("/budget-advisor", budgetAdvisorController);
router.post("/parse-transaction-text", parseTransactionTextController);
router.post("/spending-prediction", spendingPredictionController);

export default router;
