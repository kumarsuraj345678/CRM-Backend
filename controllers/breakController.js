import BreakLog from "../models/BreakLog.js";
import Activity from "../models/Activity.js";
import Attendance from "../models/Attendance.js";

export const toggleBreak = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date().toISOString().split("T")[0];

    const attendance = await Attendance.findOne({
      user: userId,
      date: today,
    });

    if (!attendance || !attendance.checkInTime) {
      return res.status(400).json({ message: "Check-in required" });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({ message: "Already checked out" });
    }

    let breakLog = await BreakLog.findOne({
      user: userId,
      date: today,
    });

    if (!breakLog) {
      breakLog = await BreakLog.create({
        user: userId,
        date: today,
        breakStart: new Date(),
      });

      await Activity.create({
        user: userId,
        message: "Started break",
      });

      return res.json(breakLog);
    }

    if (!breakLog.breakEnd) {
      breakLog.breakEnd = new Date();
      await breakLog.save();

      await Activity.create({
        user: userId,
        message: "Ended break",
      });

      return res.json(breakLog);
    }

    return res.status(400).json({
      message: "Break already completed",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getTodayBreak = async (req, res) => {
  const userId = req.user._id;
  const today = new Date().toISOString().split("T")[0];

  const breakLog = await BreakLog.findOne({
    user: userId,
    date: today,
  });

  res.json(breakLog || null);
};

export const getBreakLogs = async (req, res) => {
  const userId = req.user._id;

  const logs = await BreakLog.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(10);

  res.json(logs);
};
