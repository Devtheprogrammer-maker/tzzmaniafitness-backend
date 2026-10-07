import { pool } from "../db.js";

export async function requireAdmin(req, res, next) {
    try {
        const result = await pool.query("SELECT role FROM users WHERE id = $1", [req.userId]);
        const user = result.rows[0];

        if (!user || user.role !== "admin") {
            return res.status(403).json({ message: "You need admin level to access this." });
        }
        //req.role = user.role;

        next();

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });

    }

}