import express, { json } from "express";
import { requireAuth } from '../middleware/requireAuth.js';
//import { pool } from '../db.js';
import { db } from '../src/prisma/db.ts'

const router = express.Router();

router.get('/userInfo', requireAuth, async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                message: 'Please log in!',
            });
        }

        const userMembership = db.sql.public.user_memberships.as("um").innerJoin(db.sql.public.users.as("u"), (f, fns) => fns.eq(f.um.user_id, f.u.id))
            .innerJoin(db.sql.public.memberships.as("m"), (f, fns) => fns.eq(f.um.membership_id, f.m.id))
            .select((f) => ({ name: f.u.name, membership_name: f.m.name, price: f.m.price, start_date: f.um.start_date, due_date: f.um.end_date, status: f.um.status }))
            .where((f, fns) => fns.eq(f.u.id, req.userId))
            .limit(10)
            .build();

        const rows = await db.runtime().query(userMembership);

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Membership information not found',
            });
        }

        return res.status(200).json({ rows });

    } catch (error) {
        console.error('Failed to fetch user info:', error);

        return res.status(500).json({
            message: 'Failed to fetch data',
        });
    }
});


router.get('/get-memberships', async (req, res) => {

    try {
        //const memberships = await pool.query(' SELECT name, price, type, amenities, is_popular FROM memberships');
        const memberships = await db.orm.public.Membership.all();

        res.status(200).json(memberships);

    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch data' })
    }

})

export default router; 