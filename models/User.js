import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, enum: ["admin", "employee"], default: "employee" },
    language: String,
    status: { type: String, default: "active" },
  },
  { timestamps: true },
);

userSchema.index({ status: 1 });
userSchema.index({ language: 1 });

export default mongoose.model("User", userSchema);
