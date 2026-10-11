
import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./config/db.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import { authMiddleware } from "./middleware/auth.middleware.js";
import expenseRoutes from "./routes/expenses.routes.js";
import budgetRoutes from "./routes/budgets.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/reports", reportsRoutes);
app.get("/api/protected", authMiddleware, (req, res) => {
  return res.json({
    message: "Authentication successful",
    userId: req.userId
  });
});

// Test API
app.get("/", (_req, res) => {
  res.json({
    message: "Expense Tracker API is running"
  });
});

// Test MySQL connection
app.get("/api/health", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS result");

    res.status(200).json({
      status: "success",
      message: "MySQL connected successfully",
      database: rows
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      status: "error",
      message: "Database connection failed"
    });
  }
});

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
