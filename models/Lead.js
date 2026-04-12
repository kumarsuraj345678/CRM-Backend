import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    source: String,
    date: Date,
    location: String,
    language: String,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["Ongoing", "Closed"], default: "Ongoing" },
    type: {
      type: String,
      enum: ["Hot", "Warm", "Cold"],
      default: "Warm",
    },
    scheduledDate: Date,
    scheduledTime: String,
  },
  { timestamps: true },
);

leadSchema.index({ assignedTo: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ language: 1 });
leadSchema.index({ createdAt: 1 });

export default mongoose.model("Lead", leadSchema);
