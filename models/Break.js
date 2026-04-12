const mongoose = require("mongoose");

const breakSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  breakStart: Date,
  breakEnd: Date,
  date: String,
});
module.exports = mongoose.model("Break", breakSchema);
