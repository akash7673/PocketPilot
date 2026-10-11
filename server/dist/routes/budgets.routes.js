import { Router } from "express";
import { pool } from "../config/db.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
const router = Router();
router.use(authMiddleware);
function validMonthYear(month, year) {
    const m = Number(month);
    const y = Number(year);
    return (Number.isInteger(m) &&
        m >= 1 &&
        m <= 12 &&
        Number.isInteger(y) &&
        y >= 2000 &&
        y <= 9999);
}
function validAmount(value) {
    if (value === null ||
        value === undefined ||
        (typeof value !== "number" && typeof value !== "string") ||
        String(value).trim() === "") {
        return false;
    }
    const amount = Number(value);
    return (Number.isFinite(amount) &&
        amount > 0 &&
        amount <= 9999999999.99 &&
        Math.round(amount * 100) / 100 === amount);
}
// POST /api/budgets
// Create a budget or update the existing budget for that category/month.
router.post("/", async (req, res) => {
    try {
        const userId = req.userId;
        const { category, amount, month, year } = req.body ?? {};
        if (typeof category !== "string" ||
            !category.trim() ||
            category.trim().length > 80 ||
            !validAmount(amount) ||
            !validMonthYear(month, year)) {
            return res.status(400).json({
                message: "Provide a valid category, positive amount, month and year"
            });
        }
        const [result] = await pool.execute(`INSERT INTO budgets (user_id, category, amount, month, year)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         amount = VALUES(amount),
         updated_at = CURRENT_TIMESTAMP`, [
            userId,
            category.trim(),
            Number(amount).toFixed(2),
            Number(month),
            Number(year)
        ]);
        return res.status(200).json({
            message: "Budget saved successfully",
            budget: {
                id: result.insertId || null,
                category: category.trim(),
                amount: Number(amount).toFixed(2),
                month: Number(month),
                year: Number(year)
            }
        });
    }
    catch (error) {
        console.error("Save budget error:", error);
        return res.status(500).json({
            message: "Failed to save budget"
        });
    }
});
// GET /api/budgets?month=10&year=2026
// Returns budgets and spending for each category.
router.get("/", async (req, res) => {
    try {
        const userId = req.userId;
        const { month, year } = req.query;
        if (!validMonthYear(month, year)) {
            return res.status(400).json({
                message: "Provide month (1-12) and year (2000-9999)"
            });
        }
        const [budgets] = await pool.execute(`SELECT
         b.id,
         b.category,
         b.amount AS budget_amount,
         b.month,
         b.year,
         COALESCE(SUM(e.amount), 0) AS spent,
         b.amount - COALESCE(SUM(e.amount), 0) AS remaining,
         CASE
           WHEN COALESCE(SUM(e.amount), 0) > b.amount
             THEN 'exceeded'
           WHEN COALESCE(SUM(e.amount), 0) = b.amount
             THEN 'reached'
           ELSE 'within_budget'
         END AS budget_status
       FROM budgets b
       LEFT JOIN expenses e
         ON e.user_id = b.user_id
         AND e.category = b.category
         AND e.expense_date >=
           STR_TO_DATE(
             CONCAT(b.year, '-', LPAD(b.month, 2, '0'), '-01'),
             '%Y-%m-%d'
           )
         AND e.expense_date <
           DATE_ADD(
             STR_TO_DATE(
               CONCAT(b.year, '-', LPAD(b.month, 2, '0'), '-01'),
               '%Y-%m-%d'
             ),
             INTERVAL 1 MONTH
           )
       WHERE b.user_id = ?
         AND b.month = ?
         AND b.year = ?
       GROUP BY
         b.id, b.category, b.amount, b.month, b.year
       ORDER BY b.category ASC`, [userId, Number(month), Number(year)]);
        const result = budgets.map((budget) => ({
            ...budget,
            budget_amount: Number(budget.budget_amount),
            spent: Number(budget.spent),
            remaining: Number(budget.remaining)
        }));
        return res.json({
            month: Number(month),
            year: Number(year),
            budgets: result
        });
    }
    catch (error) {
        console.error("Fetch budgets error:", error);
        return res.status(500).json({
            message: "Failed to fetch budgets"
        });
    }
});
// DELETE /api/budgets/:id
router.delete("/:id", async (req, res) => {
    try {
        const userId = req.userId;
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id < 1) {
            return res.status(400).json({ message: "Invalid budget ID" });
        }
        const [result] = await pool.execute("DELETE FROM budgets WHERE id = ? AND user_id = ?", [id, userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Budget not found" });
        }
        return res.json({ message: "Budget deleted successfully" });
    }
    catch (error) {
        console.error("Delete budget error:", error);
        return res.status(500).json({
            message: "Failed to delete budget"
        });
    }
});
export default router;
