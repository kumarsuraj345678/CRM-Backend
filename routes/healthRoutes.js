import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "CRM Backend is running",
    timestamp: new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    }),
  });
});

export default router;
