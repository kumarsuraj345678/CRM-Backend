import Attendance from "../models/Attendance.js";
import Activity from "../models/Activity.js";
export const toggleCheckIn = async (req, res) => {
  try {
    const userId = req.user._id;

    const today = new Date().toISOString().split("T")[0];

    let attendance = await Attendance.findOne({
      user: userId,
      date: today,
    });

    if (!attendance) {
      attendance = await Attendance.create({
        user: userId,
        date: today,
        checkInTime: new Date(),
        status: "checked-in",
      });

      await Activity.create({
        user: userId,
        message: "Checked in",
      });

      return res.json(attendance);
    } else if (!attendance.checkOutTime) {
      attendance.checkOutTime = new Date();
      attendance.status = "checked-out";

      await Activity.create({
        user: userId,
        message: "Checked out",
      });
    } else {
      return res.status(400).json({
        message: "Already checked out today",
      });
    }

    await attendance.save();
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getTodayStatus = async (req, res) => {
  const userId = req.user._id;

  const today = new Date().toISOString().split("T")[0];

  const attendance = await Attendance.findOne({
    user: userId,
    date: today,
  });

  res.json(attendance || null);
};
