import express from 'express';
import { loginControllers, registerControllers, setAvatarController } from '../controllers/userController.js';
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/register").post(registerControllers);

router.route("/login").post(loginControllers);

router.route("/setAvatar/:id").post(requireAuth, setAvatarController);

export default router;
