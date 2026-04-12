import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import breakRoutes from "./routes/breakRoutes.js";
import seedAdmin from "./seed/seedAdmin.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";

dotenv.config();

const app = express();
app.use(cors({
  origin: "*", // for now (later restrict to Vercel URL)
  credentials: true
}));app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/break", breakRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/activity", activityRoutes);
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

const PORT = process.env.PORT || 5000;
const startServer = async () => {
  await connectDB();
  await seedAdmin();
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
};

startServer();
