import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  toggleCheckIn,
  getTodayStatus,
} from "../controllers/attendanceController.js";

const router = express.Router();

router.post("/toggle", authMiddleware, toggleCheckIn);
router.get("/today", authMiddleware, getTodayStatus);

export default router;
