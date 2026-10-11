
import { Router, type Request, type Response } from "express";
import type { RowDataPacket } from "mysql2";
import { pool } from "../config/db.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

function parseYear(value: unknown): number | null {
  if (
    typeof value !== "string" ||
    !/^\d{4}$/.test(value)
  ) return null;

  const year = Number(value);
  return year >= 2000 && year <= 9999 ? year : null;
}

function parseMonth(value: unknown): number | null {
  if (
    typeof value !== "string" ||
    !/^(0?[1-9]|1[0-2])$/.test(value)
  ) return null;

  return Number(value);
}

// GET /api/reports/dashboard
router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        (SELECT COALESCE(SUM(amount), 0)
         FROM expenses
         WHERE user_id = ?) AS total_spent,

        (SELECT COUNT(*)
         FROM expenses
         WHERE user_id = ?) AS total_expenses,

        (SELECT COALESCE(SUM(amount), 0)
         FROM expenses
         WHERE user_id = ?
           AND expense_date >= DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01')
           AND expense_date < DATE_ADD(
             DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01'),
             INTERVAL 1 MONTH
           )) AS current_month_spent,

        (SELECT COALESCE(SUM(amount), 0)
         FROM budgets
         WHERE user_id = ?
           AND month = MONTH(CURRENT_DATE())
           AND year = YEAR(CURRENT_DATE())) AS current_month_budget`,
      [userId, userId, userId, userId]
    );

    const data = rows[0];

    return res.json({
      dashboard: {
        totalSpent: Number(data.total_spent),
        totalExpenses: Number(data.total_expenses),
        currentMonthSpent: Number(data.current_month_spent),
        currentMonthBudget: Number(data.current_month_budget),
        currentMonthRemaining:
          Number(data.current_month_budget) -
          Number(data.current_month_spent)
      }
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return res.status(500).json({
      message: "Failed to load dashboard"
    });
  }
});

// GET /api/reports/summary?period=monthly&year=2026&month=10
// GET /api/reports/summary?period=yearly&year=2026
router.get("/summary", async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const period = req.query.period;
    const year = parseYear(req.query.year);

    if (
      (period !== "monthly" && period !== "yearly") ||
      year === null
    ) {
      return res.status(400).json({
        message: "Provide period=monthly or yearly and a valid year"
      });
    }

    let startDate: string;
    let endDate: string;

    if (period === "monthly") {
      const month = parseMonth(req.query.month);

      if (month === null) {
        return res.status(400).json({
          message: "Monthly reports require month between 1 and 12"
        });
      }

      startDate = `${year}-${String(month).padStart(2, "0")}-01`;

      const nextMonth = new Date(Date.UTC(year, month, 1));
      endDate = nextMonth.toISOString().slice(0, 10);
    } else {
      startDate = `${year}-01-01`;

      // Use an exclusive end date; this also handles year 9999 safely.
      endDate = year === 9999 ? "10000-01-01" : `${year + 1}-01-01`;
    }

    const [categories] = await pool.execute<RowDataPacket[]>(
      `SELECT
         category,
         COALESCE(SUM(amount), 0) AS total,
         COUNT(*) AS expense_count
       FROM expenses
       WHERE user_id = ?
         AND expense_date >= ?
         AND expense_date < ?
       GROUP BY category
       ORDER BY total DESC`,
      [userId, startDate, endDate]
    );

    const [totals] = await pool.execute<RowDataPacket[]>(
      `SELECT
         COALESCE(SUM(amount), 0) AS total_spent,
         COUNT(*) AS total_expenses
       FROM expenses
       WHERE user_id = ?
         AND expense_date >= ?
         AND expense_date < ?`,
      [userId, startDate, endDate]
    );

    return res.json({
      period,
      year,
      ...(period === "monthly"
        ? { month: Number(req.query.month) }
        : {}),
      totalSpent: Number(totals[0].total_spent),
      totalExpenses: Number(totals[0].total_expenses),
      categories: categories.map((item) => ({
        category: item.category,
        total: Number(item.total),
        expenseCount: Number(item.expense_count)
      }))
    });
  } catch (error) {
    console.error("Report summary error:", error);
    return res.status(500).json({
      message: "Failed to generate report"
    });
  }
});

// Escape CSV cells and prevent spreadsheet formula injection.
function csvCell(value: unknown): string {
  let text = value == null ? "" : String(value);

  if (/^[\s]*[=+\-@]/.test(text)) {
    text = "'" + text;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

// GET /api/reports/export?period=monthly&year=2026&month=10
// GET /api/reports/export?period=yearly&year=2026
router.get("/export", async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const period = req.query.period;
    const year = parseYear(req.query.year);

    if (
      (period !== "monthly" && period !== "yearly") ||
      year === null
    ) {
      return res.status(400).json({
        message: "Provide period=monthly or yearly and a valid year"
      });
    }

    let startDate: string;
    let endDate: string;

    if (period === "monthly") {
      const month = parseMonth(req.query.month);

      if (month === null) {
        return res.status(400).json({
          message: "Monthly exports require month between 1 and 12"
        });
      }

      startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      endDate = new Date(Date.UTC(year, month, 1))
        .toISOString()
        .slice(0, 10);
    } else {
      startDate = `${year}-01-01`;
      endDate = year === 9999 ? "10000-01-01" : `${year + 1}-01-01`;
    }

    const [expenses] = await pool.execute<RowDataPacket[]>(
      `SELECT title, amount, category, expense_date, notes
       FROM expenses
       WHERE user_id = ?
         AND expense_date >= ?
         AND expense_date < ?
       ORDER BY expense_date DESC, id DESC`,
      [userId, startDate, endDate]
    );

    const headers = [
      "Title",
      "Amount",
      "Category",
      "Expense Date",
      "Notes"
    ];

    const lines = [
      headers.map(csvCell).join(","),
      ...expenses.map((expense) =>
        [
          expense.title,
          Number(expense.amount).toFixed(2),
          expense.category,
          String(expense.expense_date).slice(0, 10),
          expense.notes
        ].map(csvCell).join(",")
      )
    ];

    const csv = "\uFEFF" + lines.join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="expenses-${period}-${year}${
        period === "monthly"
          ? `-${String(req.query.month).padStart(2, "0")}`
          : ""
      }.csv"`
    );

    return res.status(200).send(csv);
  } catch (error) {
    console.error("Export report error:", error);
    return res.status(500).json({
      message: "Failed to export report"
    });
  }
});

export default router;
