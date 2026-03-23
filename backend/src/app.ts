import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import { authMiddleware } from "./middleware/authMiddleware";
import taskRoutes from "./routes/taskRoutes";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Task Manager API Running");
});
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});
app.get("/protected", authMiddleware, (req, res) => {
  res.send("Protected route accessed");
});

app.use("/api/tasks", taskRoutes);

export default app;
