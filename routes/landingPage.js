import express from 'express';
import createGmailClient from '../gmail/gmail.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

//Rate limiter 
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes (This is like the user they have 15min to submit 5 emails)
    max: 2, // limit each IP to 2 requests per window
    message: { message: 'Too many messages sent. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Basic HTML-escaping so user input can't inject markup into the email
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/send-email', contactLimiter, async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: 'Please enter all the required fields: Name, Email, Subject, Message' });
    }

    if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    const safeName = escapeHtml(name);
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

    try {
        const gmail = await createGmailClient();

        const html = `
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

                        <tr>
                            <td align="center" style="padding-bottom: 24px;">
                            <span style="font-size: 13px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #39ff14;">
                                Tzzmania Fitness
                            </span>
                            </td>
                        </tr>

                        <tr>
                            <td style="background-color:#181818; border: 1px solid #303030; border-radius: 14px; padding: 40px 32px;">

                            <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #a1a1aa;">
                                Name: ${safeName}
                            </p>

                            <h1 style="margin: 8px 0 16px 0; font-size: 26px; font-weight: 900; line-height: 1.2; color: #ffffff;">
                               Message:
                            </h1>

                            <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: #a1a1aa;">
                               ${safeMessage}
                            </p>
                            </td>
                        </tr>

                        <tr>
                            <td align="center" style="padding-top: 24px;">
                            <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                                Tzzmania Fitness ${new Date().getFullYear()}
                            </p>
                            </td>
                        </tr>

                        </table>
                    </td>
                    </tr>
                </table>
                </body>
                </html>
            `;

        const rawMessage = [
            `From: Tzzmania Fitness <${process.env.GMAIL_USER}>`,
            `To: ${process.env.GMAIL_USER}`,
            `Subject: ${subject}`,
            `In-Reply-To: <${email}>`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            '',
            html
        ].join('\r\n');

        const encodedMessage = Buffer.from(rawMessage).toString('base64url');

        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage
            }
        });

        return res.status(200).json({ message: 'Email sent successfully.' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: `Something went wrong please try again later. ${error}` });
    }
});

export default router;