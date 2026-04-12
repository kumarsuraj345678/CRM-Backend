import mongoose from "mongoose";

const breakSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    date: String,
    breakStart: Date,
    breakEnd: Date,
  },
  { timestamps: true },
);

export default mongoose.model("BreakLog", breakSchema);
