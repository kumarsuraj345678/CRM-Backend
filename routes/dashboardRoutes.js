import express from "express";
import {
  getStats,
  getSalesData,
  getActivities,
  getEmployeeStats,
  getMyActivity,
} from "../controllers/dashboardController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/stats", getStats);
router.get("/employee-stats", getEmployeeStats);
router.get("/sales", getSalesData);
router.get("/activities", getActivities);
router.get("/activity", authMiddleware, getMyActivity);

export default router;
