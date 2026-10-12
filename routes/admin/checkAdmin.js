import express from "express";
import { db } from "../../src/prisma/db.ts"
import { requireAuth } from "../../middleware/requireAuth.js";
import { requireAdmin } from "../../middleware/requireAdmin.js";

const router = express.Router();

router.get("/admin", requireAuth, requireAdmin, async (req, res) => {
    try {
        // const users = await pool.query(`
        //     SELECT
        //     users.name AS name,
        //     memberships.name AS membership,
        //     memberships.price AS price,
        //     user_memberships.start_date AS "startDate",
        //     user_memberships.due_date AS "dueDate",
        //     user_memberships.status AS status
        //     FROM user_memberships
        //     INNER JOIN memberships ON user_memberships.membership_id = memberships.id
        //     INNER JOIN users ON user_memberships.user_id = users.id
        // `);

        const userMemberships = db.sql.public.user_memberships.as("um").innerJoin(db.sql.public.users.as("u"), (f, fns) => fns.eq(f.um.user_id, f.u.id))
            .innerJoin(db.sql.public.memberships.as("m"), (f, fns) => fns.eq(f.um.membership_id, f.m.id))
            .select((f) => ({ name: f.u.name, membership: f.m.name, price: f.m.price, startDate: f.um.start_date, dueDate: f.um.end_date, status: f.um.status }))
            .build();

        const rows = await db.runtime().query(userMemberships);
        console.log(rows);

        res.status(200).json({ rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;