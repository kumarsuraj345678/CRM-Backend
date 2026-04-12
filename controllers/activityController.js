import Activity from "../models/Activity.js";

export const getMyActivity = async (req, res) => {
  try {
    const userId = req.user._id;

    const activities = await Activity.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllActivity = async (req, res) => {
  const activities = await Activity.find()
    .populate("user", "firstName lastName")
    .sort({ createdAt: -1 })
    .limit(20);

  res.json(activities);
};