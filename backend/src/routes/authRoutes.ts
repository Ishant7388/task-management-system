import express from "express";
import {
  getCurrentUser,
  getUsers,
  loginUser,
  logoutUser,
  registerUser,
} from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/me", authMiddleware, getCurrentUser);
router.get("/users", authMiddleware, getUsers);

export default router;
