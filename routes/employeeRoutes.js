import express from "express";
import {
  createEmployee,
  getEmployees,
  deleteEmployees,
  updateEmployee,
  updateEmployeeStatus,
} from "../controllers/employeeController.js";

const router = express.Router();

router.post("/", createEmployee);
router.get("/", getEmployees);
router.put("/:id", updateEmployee);
router.put("/:id/status", updateEmployeeStatus);
router.delete("/", deleteEmployees);

export default router;
