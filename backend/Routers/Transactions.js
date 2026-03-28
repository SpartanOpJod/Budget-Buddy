import express from 'express';
import { addTransactionController, deleteTransactionController, getAllTransactionController, updateTransactionController } from '../controllers/transactionController.js';
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/addTransaction").post(requireAuth, addTransactionController);

router.route("/getTransaction").post(requireAuth, getAllTransactionController);

router.route("/deleteTransaction/:id").post(requireAuth, deleteTransactionController);

router.route('/updateTransaction/:id').put(requireAuth, updateTransactionController);

export default router;
