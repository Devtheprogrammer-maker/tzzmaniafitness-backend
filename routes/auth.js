import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { requireAuth } from '../middleware/requireAuth.js';
import createTransporter from "../emailTransporter/transporter.js";

//Dependencies for the email 
// import nodemailer from 'nodemailer';
// import { google } from 'googleapis';

const router = express.Router();

//The 10 controls how much work bcrypt does when generating the hash.
//Higher number → more computational work → slower hashing → harder for attackers to brute-force.
const SALT_ROUNDS = 10;

//Set Transporter
// async function createTransporter() {
//     //Create Oauth Instance
//     const oauth2Client = new google.auth.OAuth2(
//         process.env.GMAIL_CLIENT_ID,
//         process.env.GMAIL_CLIENT_SECRET,
//         'https://developers.google.com/oauthplayground'
//     );

//     //Sets Credentials 
//     oauth2Client.setCredentials({
//         refresh_token: process.env.GMAIL_REFRESH_TOKEN
//     });

//     //Gets Access Token
//     const accessToken = await new Promise((resolve, reject) => {
//         oauth2Client.getAccessToken((err, token) => {
//             if (err) return reject('Failed to fetch access token');
//             resolve(token);
//         });
//     });

//     return nodemailer.createTransport({
//         service: 'gmail',
//         auth: {
//             type: 'OAuth2',
//             user: process.env.GMAIL_USER,
//             clientId: process.env.GMAIL_CLIENT_ID,
//             clientSecret: process.env.GMAIL_CLIENT_SECRET,
//             refreshToken: process.env.GMAIL_REFRESH_TOKEN,
//             accessToken
//         }
//     });
// }

//Gets the users email
router.post('/get-password-reset', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Please enter an email" });
    }

    try {
        const result = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
        const user = result.rows[0];

        // Respond the same way whether or not the user exists,
        // so attackers can't use this to enumerate valid emails.
        if (user) {
            await sendPasswordReset(email, user.id);
        }

        res.status(200).json({ message: `If an account exists for ${email}, a reset link has been sent.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong. Please try again" });
    }
});

//Sends rest link
async function sendPasswordReset(email, userId) {
    try {
        const resetToken = jwt.sign(
            { userId },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        const resetUrl = `https://tzzmaniafitness.vercel.app/reset-password/${resetToken}`;

        const transporter = await createTransporter();
        await transporter.sendMail({
            from: `TazzmaniaFitness <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Reset your password',
            html:
                `
                <!DOCTYPE html>
                <html>
                <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin:0; padding:0; background-color:#0b0b0b; font-family: Arial, Helvetica, sans-serif;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b0b0b; padding: 40px 16px;">
                    <tr>
                    <td align="center">
                        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width: 480px; width: 100%;">

                        <!-- Wordmark -->
                        <tr>
                            <td align="center" style="padding-bottom: 24px;">
                            <span style="font-size: 13px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #39ff14;">
                                Tazzmania Fitness
                            </span>
                            </td>
                        </tr>

                        <!-- Card -->
                        <tr>
                            <td style="background-color:#181818; border: 1px solid #303030; border-radius: 14px; padding: 40px 32px;">

                            <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #a1a1aa;">
                                Password reset
                            </p>

                            <h1 style="margin: 8px 0 16px 0; font-size: 26px; font-weight: 900; line-height: 1.2; color: #ffffff;">
                                Choose a new password
                            </h1>

                            <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: #a1a1aa;">
                                We got a request to reset your password. This link expires in 15 minutes, so use it soon.
                            </p>

                            <!-- Button -->
                            <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                <td align="center" style="border-radius: 10px; background-color: #c25cff;">
                                    <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: #ffffff; text-decoration: none;">
                                    Reset Password
                                    </a>
                                </td>
                                </tr>
                            </table>

                            <p style="margin: 32px 0 0 0; font-size: 13px; line-height: 1.6; color: #a1a1aa;">
                                Button not working? Paste this link into your browser:
                            </p>
                            <p style="margin: 6px 0 0 0; font-size: 13px; line-height: 1.6; word-break: break-all;">
                                <a href="${resetUrl}" target="_blank" style="color: #39ff14; text-decoration: underline;">${resetUrl}</a>
                            </p>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px; border-top: 1px solid #303030;">
                                <tr>
                                <td style="padding-top: 20px;">
                                    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #a1a1aa;">
                                    Didn't request a password reset? Your account is still safe — you can ignore this email and your password will stay the same.
                                    </p>
                                </td>
                                </tr>
                            </table>

                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td align="center" style="padding-top: 24px;">
                            <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                                Tazzmania Fitness
                            </p>
                            </td>
                        </tr>

                        </table>
                    </td>
                    </tr>
                </table>
                </body>
                </html>
            `
        });
    } catch (error) {
        console.log(error);
    }
}

//Resets the password
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ error: 'Missing token or new password.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        await pool.query(
            "UPDATE users SET password_hash = $1 WHERE id = $2",
            [passwordHash, decoded.userId]
        );

        res.json({ message: "Your password has been changed!" });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Reset link is invalid or has expired.' });
    }
});

//Send acctivation code email
async function sendActivationEmail(user) {
    try {
        const activationToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        const activationUrl = `http://localhost:4000/api/auth/activate/${activationToken}`;

        const transporter = await createTransporter();
        await transporter.sendMail({
            from: `TazzmaniaFitness <${process.env.GMAIL_USER}>`,
            to: user.email,
            subject: 'Please follow the instructions to activate your account',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin:0; padding:0; background-color:#0b0b0b; font-family: Arial, Helvetica, sans-serif;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b0b0b; padding: 40px 16px;">
                    <tr>
                    <td align="center">
                        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width: 480px; width: 100%;">

                        <!-- Wordmark -->
                        <tr>
                            <td align="center" style="padding-bottom: 24px;">
                            <span style="font-size: 13px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #39ff14;">
                                Tazzmania Fitness
                            </span>
                            </td>
                        </tr>

                        <!-- Card -->
                        <tr>
                            <td style="background-color:#181818; border: 1px solid #303030; border-radius: 14px; padding: 40px 32px;">

                            <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #a1a1aa;">
                                One step left
                            </p>

                            <h1 style="margin: 8px 0 16px 0; font-size: 26px; font-weight: 900; line-height: 1.2; color: #ffffff;">
                                Activate your account
                            </h1>

                            <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: #a1a1aa;">
                                You're almost in. Confirm your email to unlock booking, your training schedule, and progress tracking. This link expires in 15 minutes.
                            </p>

                            <!-- Button -->
                            <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                <td align="center" style="border-radius: 10px; background-color: #c25cff;">
                                    <a href="${activationUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: #ffffff; text-decoration: none;">
                                    Activate Account
                                    </a>
                                </td>
                                </tr>
                            </table>

                            <p style="margin: 32px 0 0 0; font-size: 13px; line-height: 1.6; color: #a1a1aa;">
                                Button not working? Paste this link into your browser:
                            </p>
                            <p style="margin: 6px 0 0 0; font-size: 13px; line-height: 1.6; word-break: break-all;">
                                <a href="${activationUrl}" target="_blank" style="color: #39ff14; text-decoration: underline;">${activationUrl}</a>
                            </p>

                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td align="center" style="padding-top: 24px;">
                            <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                                Didn't sign up for Tazzmania Fitness? You can safely ignore this email.
                            </p>
                            </td>
                        </tr>

                        </table>
                    </td>
                    </tr>
                </table>
                </body>
                </html>
                `
        });
    } catch (error) {
        console.log(error)
    }
}

// Activate Link 
router.get('/activate/:token', async (req, res) => {
    const { token } = req.params;

    if (!token) {
        console.log('No token')
        return res.status(400).json({ error: 'Missing token.' });
    }

    //Message to attach to the url
    let message = '';
    let verified = 'false';

    try {
        // Verify token validity and expiration
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        //Gets userID
        const userID = decoded.userId

        //Updated db 
        const result = await pool.query("UPDATE users  SET status = 'active' WHERE id = $1", [userID]);

        //
        if (result.rowCount === 0) {
            message = encodeURIComponent('Activation link is invalid or has expired.');
            verified = encodeURIComponent('false');
            return res.redirect(`http://localhost:5173/tzzmaniafitness/login?verified=${verified}&message=${message}`);
        }

        message = encodeURIComponent('You are now verified! Please log in.')
        verified = encodeURIComponent('true');
        //response
        res.redirect(`http://localhost:5173/tzzmaniafitness/login?verified=${verified}&message=${message}`);

    } catch (error) {
        message = encodeURIComponent('Activation link is invalid or has expired.');
        verified = encodeURIComponent('false');
        //response
        console.log(error);
        res.redirect(`http://localhost:5173/tzzmaniafitness/login?verified=${verified}&message=${message}`);
    }
});

router.get("/me", requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name, email, role FROM users WHERE id = $1",
            [req.userId]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ user });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: "Failed to get user" });
    }
});

router.post('/signup', async (req, res) => {
    //Gets the info
    const { name, username, email, password } = req.body;

    //Check for missing info
    if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, Email, and Password are required." });
    }

    try {
        //Hashing the password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const result = await pool.query(
            "INSERT INTO users (name, username, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, username, email", [name, username, email, passwordHash]
        );

        const user = result.rows[0];

        //Send activation email
        await sendActivationEmail(user);

        //node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" <=== GENERATES THE STRING FOR YOU

        //Creates the token
        //userID - The information you want the token to carry.
        //JWT_SECRECT - The secret is used by JWT to cryptographically sign the token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '7d', }
        );

        //Sends the token to the browser in a cookie called token (user)
        res.cookie("token", token, {
            //means JavaScript running in the browser can't directly read that cookie.
            httpOnly: true,
            //In production, this means the cookie should only be sent over HTTPS.
            secure: process.env.NODE_ENV === "production",
            // This controls when the browser sends the cookie in cross-site situations and provides some protection against certain CSRF attacks.
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, in milliseconds
        });

        res.status(201).json(user);

    } catch (error) {
        // Postgres error code 23505 = "unique_violation" — happens here
        // specifically when someone signs up with an email already in use.
        if (error.code === "23505") {
            // error.constraint will be something like "users_email_key" or "users_username_key"
            if (error.constraint?.includes("email")) {
                return res.status(409).json({ error: "Email already in use" });
            }
            if (error.constraint?.includes("username")) {
                return res.status(409).json({ error: "Username already taken" });
            }
            return res.status(409).json({ error: "Account already exists" });
        }
        console.error(error);
        res.status(500).json({ error: "Signup failed" });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Please enter your email and password." })
    }

    try {
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: "Email or Password Incorrect" });
        };

        if (user.status == 'pending' || user.status == 'inactive') {
            return res.status(409).json({ error: "Please verify your email address" })
        }

        const passwordMatches = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatches) {
            return res.status(401).json({ error: "Email or Password Incorrect" });
        };

        //Creates the token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "7d", }
        );

        // Using the DB's own clock
        // (NOW() avoids clock-skew issues between your server and DB)
        await pool.query(
            "UPDATE users SET last_sign_in = NOW() WHERE email = $1",
            [email]
        )

        //Send the token to the browser
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({ user: { id: user.id, name: user.name, email: user.email, username: user.username } });

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: `Login failed` });
    }
});

router.post("/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out" });
});

// router.post("/logout", (req, res) => {
//     res.clearCookie("token", {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "lax",
//     });

//     res.json({ message: "Logged out" });
// });

export default router;