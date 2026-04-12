import User from "../models/User.js";
import bcrypt from "bcryptjs";

const seedAdmin = async () => {
  try {
    const exists = await User.findOne({ email: "admin@gmail.com" });

    if (!exists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);

      await User.create({
        firstName: "Admin",
        lastName: "User",
        email: "admin@gmail.com",
        password: hashedPassword,
        role: "admin",
        language: "Hindi",
      });

      console.log("Default admin created");
    } else {
      console.log("ℹAdmin already exists");
    }
  } catch (err) {
    console.error("Seed admin error:", err);
  }
};

export default seedAdmin;