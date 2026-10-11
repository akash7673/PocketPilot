
import { Router, Request, Response } from "express";
import { pool } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import crypto from "node:crypto";
import { authMiddleware } from "../middleware/auth.middleware.js";
const router = Router();

const JWT_SECRET = process.env.JWT_ACCESS_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_ACCESS_SECRET is missing in .env");
}

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password_hash: string;
}

function createAccessToken(userId: number) {
  return jwt.sign({ userId }, JWT_SECRET!, {
    expiresIn: "15m"
  });
}

function createRefreshToken() {
  return crypto.randomBytes(48).toString("hex");
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/auth"
};

// REGISTER
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 100 ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 72
    ) {
      return res.status(400).json({
        message: "Enter a valid name, email and password"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [existing] = await pool.execute<UserRow[]>(
      "SELECT id FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: "Email already registered"
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (name, email, password_hash)
       VALUES (?, ?, ?)`,
      [name.trim(), normalizedEmail, passwordHash]
    );

    return res.status(201).json({
      message: "Registration successful",
      user: {
        id: result.insertId,
        name: name.trim(),
        email: normalizedEmail
      }
    });
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Email already registered"
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Registration failed"
    });
  }
});

// LOGIN
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const [users] = await pool.execute<UserRow[]>(
      `SELECT id, name, email, password_hash
       FROM users
       WHERE email = ?`,
      [email.trim().toLowerCase()]
    );

    if (
      users.length === 0 ||
      !(await bcrypt.compare(password, users[0].password_hash))
    ) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const user = users[0];
    const refreshToken = createRefreshToken();

    await pool.execute(
      `INSERT INTO refresh_sessions
       (user_id, token_hash, expires_at)
       VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 DAY))`,
      [user.id, hashToken(refreshToken)]
    );

    res.cookie("refreshToken", refreshToken, {
      ...refreshCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      message: "Login successful",
      accessToken: createAccessToken(user.id),
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed"
    });
  }
});

// POST /refresh
router.post("/refresh", async (req: Request, res: Response) => {
  const oldToken: string | undefined = req.cookies?.refreshToken;

  if (!oldToken) {
    return res.status(401).json({ message: "Refresh token missing" });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [sessions] = await connection.execute<
      (RowDataPacket & { id: number; user_id: number })[]
    >(
      `SELECT id, user_id
       FROM refresh_sessions
       WHERE token_hash = ?
         AND revoked_at IS NULL
         AND expires_at > UTC_TIMESTAMP()
       FOR UPDATE`,
      [hashToken(oldToken)]
    );

    if (sessions.length === 0) {
      await connection.rollback();
      res.clearCookie("refreshToken", refreshCookieOptions);

      return res.status(401).json({
        message: "Refresh token is invalid or expired. Please log in again."
      });
    }

    const session = sessions[0];
    const newRefreshToken = createRefreshToken();

    // Revoke the old refresh token.
    await connection.execute(
      `UPDATE refresh_sessions
       SET revoked_at = UTC_TIMESTAMP()
       WHERE id = ? AND revoked_at IS NULL`,
      [session.id]
    );

    // Store only the hash of the new refresh token.
    await connection.execute(
      `INSERT INTO refresh_sessions (user_id, token_hash, expires_at)
       VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 DAY))`,
      [session.user_id, hashToken(newRefreshToken)]
    );

    await connection.commit();

    res.cookie("refreshToken", newRefreshToken, {
      ...refreshCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      message: "Token refreshed successfully",
      accessToken: createAccessToken(session.user_id)
    });
  } catch (error) {
    await connection.rollback();
    console.error("Refresh token error:", error);

    return res.status(500).json({
      message: "Unable to refresh token"
    });
  } finally {
    connection.release();
  }
});

// POST /logout
router.post("/logout", async (req: Request, res: Response) => {
  const refreshToken: string | undefined = req.cookies?.refreshToken;

  try {
    if (refreshToken) {
      await pool.execute(
        `UPDATE refresh_sessions
         SET revoked_at = UTC_TIMESTAMP()
         WHERE token_hash = ? AND revoked_at IS NULL`,
        [hashToken(refreshToken)]
      );
    }

    res.clearCookie("refreshToken", refreshCookieOptions);

    return res.status(200).json({
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      message: "Logout failed"
    });
  }
});



router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    // Ensure userId exists before querying the database
    if (userId === undefined) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [users] = await pool.execute<
      (RowDataPacket & {
        id: number;
        name: string;
        email: string;
      })[]
    >(
      "SELECT id, name, email FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    return res.json({ user: users[0] });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({
      message: "Failed to get current user"
    });
  }
});


export default router;
