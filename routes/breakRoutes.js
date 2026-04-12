import express from "express";
import {
  toggleBreak,
  getTodayBreak,
  getBreakLogs,
} from "../controllers/breakController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/toggle", authMiddleware, toggleBreak);
router.get("/today", authMiddleware, getTodayBreak);
router.get("/logs", authMiddleware, getBreakLogs);

export default router;
