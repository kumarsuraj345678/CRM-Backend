import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  date: {
    type: String,
  },

  checkInTime: Date,
  checkOutTime: Date,

  status: {
    type: String,
    enum: ["not-started", "checked-in", "checked-out"],
    default: "not-started",
  },
});

export default mongoose.model("Attendance", attendanceSchema);
