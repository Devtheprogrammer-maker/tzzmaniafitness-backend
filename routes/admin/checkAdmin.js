import express from "express";
import { pool } from "../../db.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requireAdmin } from "../../middleware/requireAdmin.js";

const router = express.Router();

router.get("/admin", requireAuth, requireAdmin, async (req, res) => {
    try {
        const users = await pool.query(`
            SELECT
            users.name AS name,
            memberships.name AS membership,
            memberships.price AS price,
            user_memberships.start_date AS "startDate",
            user_memberships.due_date AS "dueDate",
            user_memberships.status AS status
            FROM user_memberships
            INNER JOIN memberships ON user_memberships.membership_id = memberships.id
            INNER JOIN users ON user_memberships.user_id = users.id
        `);

        res.status(200).json({ usersInfo: users.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;