import Lead from "../models/Lead.js";
import User from "../models/User.js";
import { reassignUnassignedLeads } from "./leadController.js";
import bcrypt from "bcryptjs";

export const createEmployee = async (req, res) => {
  try {
    const { firstName, lastName, email, language } = req.body;
    const salt = await bcrypt.genSalt(10);
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: await bcrypt.hash(email, salt),
      role: "employee",
      language,
    });
    await reassignUnassignedLeads(user.language);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEmployees = async (req, res) => {
  const users = await User.find({ role: "employee" }).sort({ createdAt: -1 });
  res.json({ users, total: users.length });
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, req.body, { new: true });
    if (req.body.status === "active") {
      await reassignUnassignedLeads(user.language);
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to update employee" });
  }
};

export const updateEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await User.findByIdAndUpdate(id, { status }, { new: true });

    if (status === "active") {
      await reassignUnassignedLeads(user.language);
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to update employee" });
  }
};

export const deleteEmployees = async (req, res) => {
  try {
    const { ids } = req.body;

    await Lead.updateMany(
      { assignedTo: { $in: ids } },
      { $set: { assignedTo: null } },
    );

    await User.deleteMany({ _id: { $in: ids } });

    res.json({ message: "Employees deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
