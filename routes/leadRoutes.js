import express from "express";
import multer from "multer";
import {
  uploadCSV,
  updateLead,
  getLeads,
  updateLeadStatus,
  assignLead,
  createLead,
  getMyLeads,
  getMySchedule,
} from "../controllers/leadController.js";
import Lead from "../models/Lead.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });
router.get("/my", authMiddleware, getMyLeads);
router.get("/leads", authMiddleware, getLeads);
router.get("/schedule/my", authMiddleware, getMySchedule);
router.post("/upload", authMiddleware, upload.single("file"), uploadCSV);
router.post("/", authMiddleware, createLead);
router.put("/:id", authMiddleware, updateLead);
router.put("/:id/status", authMiddleware, updateLeadStatus);
router.put("/:id/assign", authMiddleware, assignLead);
router.put("/:id/type", authMiddleware, async (req, res) => {
  const updated = await Lead.findByIdAndUpdate(
    req.params.id,
    { type: req.body.type },
    { new: true },
  );
  res.json(updated);
});

router.put("/:id/type", authMiddleware, async (req, res) => {
  try {
    const updated = await Lead.findByIdAndUpdate(
      req.params.id,
      { type: req.body.type },
      { new: true },
    ).populate("assignedTo", "firstName lastName email");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Type update failed" });
  }
});

router.put("/:id/schedule", authMiddleware, async (req, res) => {
  try {
    const updated = await Lead.findByIdAndUpdate(
      req.params.id,
      {
        scheduledDate: req.body.date,
        scheduledTime: req.body.time,
      },
      { new: true },
    ).populate("assignedTo", "firstName lastName email");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Schedule update failed" });
  }
});

export default router;
