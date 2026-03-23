import express from "express";
import {
  createTask,
  getTasks,
  updateTaskStatus,
  deleteTask,
} from "../controllers/taskController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();
router.post("/", authMiddleware, createTask);

router.get("/", authMiddleware, getTasks);

router.patch("/:id/status", authMiddleware, updateTaskStatus);

router.delete("/:id", authMiddleware, deleteTask);

export default router;
