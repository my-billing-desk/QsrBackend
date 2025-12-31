const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

exports.sendOTP = async (to, otp, tenantName) => {
    try {
        const mailOptions = {
            from: `"QSR POS Support" <${process.env.SMTP_USER}>`,
            to,
            subject: 'POS Linking Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #333; text-align: center;">Terminal Linking Verification</h2>
                    <p>Hello,</p>
                    <p>You requested to link a new POS terminal to <strong>${tenantName}</strong>.</p>
                    <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb;">${otp}</span>
                    </div>
                    <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #777; text-align: center;">Powered by QSR Stack - Modern Restaurant OS</p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('[EMAIL] Message sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('[EMAIL ERROR]', error);
        return false;
    }
};
