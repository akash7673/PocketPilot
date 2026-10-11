import { Router } from "express";
import { pool } from "../config/db.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
const router = Router();
router.use(authMiddleware);
function validDate(value) {
    if (typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value;
}
function validAmount(value) {
    const amount = Number(value);
    return value !== null &&
        value !== "" &&
        Number.isFinite(amount) &&
        amount > 0 &&
        amount <= 9999999999.99 &&
        Math.round(amount * 100) / 100 === amount;
}
// GET /api/expenses
// Optional filters: category, from, to, page, limit
router.get("/", async (req, res) => {
    try {
        const userId = req.userId;
        const conditions = ["user_id = ?"];
        const values = [userId];
        const { category, from, to } = req.query;
        if (category !== undefined) {
            if (typeof category !== "string" || !category.trim()) {
                return res.status(400).json({ message: "Invalid category" });
            }
            conditions.push("category = ?");
            values.push(category.trim());
        }
        if (from !== undefined) {
            if (!validDate(from)) {
                return res.status(400).json({
                    message: "from must be a valid date in YYYY-MM-DD format"
                });
            }
            conditions.push("expense_date >= ?");
            values.push(from);
        }
        if (to !== undefined) {
            if (!validDate(to)) {
                return res.status(400).json({
                    message: "to must be a valid date in YYYY-MM-DD format"
                });
            }
            conditions.push("expense_date <= ?");
            values.push(to);
        }
        if (from !== undefined && to !== undefined && from > to) {
            return res.status(400).json({
                message: "from cannot be later than to"
            });
        }
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 10);
        if (!Number.isInteger(page) || page < 1 ||
            !Number.isInteger(limit) || limit < 1 || limit > 100) {
            return res.status(400).json({
                message: "page must be positive and limit must be between 1 and 100"
            });
        }
        const offset = (page - 1) * limit;
        const whereClause = conditions.join(" AND ");
        const [expenses] = await pool.execute(`SELECT id, user_id, title, amount, category,
              expense_date, notes, created_at, updated_at
       FROM expenses
       WHERE ${whereClause}
       ORDER BY expense_date DESC, id DESC
       LIMIT ? OFFSET ?`, [...values, limit, offset]);
        const [countRows] = await pool.execute(`SELECT COUNT(*) AS total
       FROM expenses
       WHERE ${whereClause}`, values);
        return res.json({
            expenses,
            pagination: {
                page,
                limit,
                total: Number(countRows[0].total),
                totalPages: Math.ceil(Number(countRows[0].total) / limit)
            }
        });
    }
    catch (error) {
        console.error("Fetch expenses error:", error);
        return res.status(500).json({ message: "Failed to fetch expenses" });
    }
});
// POST /api/expenses
router.post("/", async (req, res) => {
    try {
        const userId = req.userId;
        const { title, amount, category, expense_date, notes } = req.body ?? {};
        if (typeof title !== "string" ||
            !title.trim() ||
            title.trim().length > 150 ||
            typeof category !== "string" ||
            !category.trim() ||
            category.trim().length > 80 ||
            !validAmount(amount) ||
            !validDate(expense_date) ||
            (notes != null &&
                (typeof notes !== "string" || notes.length > 500))) {
            return res.status(400).json({
                message: "Enter a valid title, amount, category, date and notes"
            });
        }
        const [result] = await pool.execute(`INSERT INTO expenses
       (user_id, title, amount, category, expense_date, notes)
       VALUES (?, ?, ?, ?, ?, ?)`, [
            userId,
            title.trim(),
            Number(amount).toFixed(2),
            category.trim(),
            expense_date,
            notes?.trim() || null
        ]);
        return res.status(201).json({
            message: "Expense created successfully",
            expense: {
                id: result.insertId,
                title: title.trim(),
                amount: Number(amount).toFixed(2),
                category: category.trim(),
                expense_date,
                notes: notes?.trim() || null
            }
        });
    }
    catch (error) {
        console.error("Create expense error:", error);
        return res.status(500).json({ message: "Failed to create expense" });
    }
});
// PUT /api/expenses/:id
router.put("/:id", async (req, res) => {
    try {
        const userId = req.userId;
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id < 1) {
            return res.status(400).json({ message: "Invalid expense ID" });
        }
        const { title, amount, category, expense_date, notes } = req.body ?? {};
        if (typeof title !== "string" ||
            !title.trim() ||
            title.trim().length > 150 ||
            typeof category !== "string" ||
            !category.trim() ||
            category.trim().length > 80 ||
            !validAmount(amount) ||
            !validDate(expense_date) ||
            (notes != null &&
                (typeof notes !== "string" || notes.length > 500))) {
            return res.status(400).json({
                message: "Provide valid title, amount, category, date and notes"
            });
        }
        const [result] = await pool.execute(`UPDATE expenses
       SET title = ?, amount = ?, category = ?,
           expense_date = ?, notes = ?
       WHERE id = ? AND user_id = ?`, [
            title.trim(),
            Number(amount).toFixed(2),
            category.trim(),
            expense_date,
            notes?.trim() || null,
            id,
            userId
        ]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }
        return res.json({ message: "Expense updated successfully" });
    }
    catch (error) {
        console.error("Update expense error:", error);
        return res.status(500).json({ message: "Failed to update expense" });
    }
});
// DELETE /api/expenses/:id
router.delete("/:id", async (req, res) => {
    try {
        const userId = req.userId;
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id < 1) {
            return res.status(400).json({ message: "Invalid expense ID" });
        }
        const [result] = await pool.execute("DELETE FROM expenses WHERE id = ? AND user_id = ?", [id, userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }
        return res.json({ message: "Expense deleted successfully" });
    }
    catch (error) {
        console.error("Delete expense error:", error);
        return res.status(500).json({ message: "Failed to delete expense" });
    }
});
export default router;
