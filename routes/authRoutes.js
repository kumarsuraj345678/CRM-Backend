import express from "express";
import { login, updateProfile, getMe } from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();
router.get("/me", authMiddleware, getMe);
router.post("/login", login);
router.put("/update-profile", authMiddleware, updateProfile);

export default router;
