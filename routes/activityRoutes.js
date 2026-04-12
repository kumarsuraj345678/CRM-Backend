import express from "express";
import {
  getMyActivity,
  getAllActivity,
} from "../controllers/activityController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/my", authMiddleware, getMyActivity);
router.get("/all", authMiddleware, getAllActivity);

export default router;
