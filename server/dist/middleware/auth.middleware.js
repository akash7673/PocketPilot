import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_ACCESS_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_ACCESS_SECRET is missing in .env");
}
export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Access token is required"
        });
    }
    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) {
        return res.status(401).json({
            message: "Access token is required"
        });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET || "");
        if (typeof decoded === "string" ||
            typeof decoded.userId !== "number") {
            return res.status(401).json({
                message: "Invalid access token"
            });
        }
        req.userId = decoded.userId;
        return next();
    }
    catch {
        return res.status(401).json({
            message: "Invalid or expired access token"
        });
    }
}
