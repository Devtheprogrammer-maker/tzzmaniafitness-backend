import express from "express";
import { requireAuth } from '../middleware/requireAuth.js';
import { pool } from '../db.js';

const router = express.Router();

router.get('/userInfo', requireAuth, async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                message: 'Please log in!',
            });
        }

        const result = await pool.query(
            `
            SELECT
                users.name AS user_name,
                memberships.name AS membership_name,
                memberships.price,
                user_memberships.start_date,
                user_memberships.due_date,
                user_memberships.status
            FROM user_memberships
            INNER JOIN memberships
                ON user_memberships.membership_id = memberships.id
            INNER JOIN users
                ON user_memberships.user_id = users.id
            WHERE users.id = $1;
            `,
            [req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Membership information not found',
            });
        }

        const userInfo = result.rows[0];

        return res.status(200).json({
            name: userInfo.user_name,
            membership_name: userInfo.membership_name,
            price: userInfo.price,
            start_date: userInfo.start_date,
            due_date: userInfo.due_date,
            status: userInfo.status,
        });

    } catch (error) {
        console.error('Failed to fetch user info:', error);

        return res.status(500).json({
            message: 'Failed to fetch data',
        });
    }
});


router.get('/get-memberships', async (req, res) => {

    try {
        const memberships = await pool.query(' SELECT name, price, type, amenities, is_popular FROM memberships');

        if (!memberships) {
            res.json({ message: 'There are no memberships avdv' })
        }
        res.status(200).json(memberships.rows);

    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch data' })
    }

})


router.post('/', requireAuth, (req, res) => {
    const { plan_type, amount } = req.body;

    if (!plan_type || !amount) {
        return res.status(400).json({ error: 'Please enter both a paymentplan and amount' });
    }

    try {
        const result = pool.query(`INSERT INTO memberships (user_id, plan_type, amount, status)
       VALUES ($1, $2, $3, 'pending_payment')
       RETURNING *`,
            [req.userId, plan_type, amount]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to create membership" });
    }

});

export default router; 