const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'stackriders@gmail.com',
        pass: 'lnwuctunjuhmylrz'
    }
});

exports.sendOTPEmail = async (to, otp, restaurantName) => {
    const mailOptions = {
        from: '"Aksha POS" <stackriders@gmail.com>',
        to: to,
        subject: `Order Deletion OTP - ${restaurantName}`,
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
                <h2 style="color: #d32f2f;">Verify Order Deletion</h2>
                <p>A request has been made to permanently delete orders from <strong>${restaurantName}</strong>.</p>
                <div style="background: #f5f5f5; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333;">${otp}</span>
                </div>
                <p style="color: #666; font-size: 14px;">This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #999;">Securely powered by Aksha</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email] OTP sent to ${to}`);
        return true;
    } catch (error) {
        console.error('[Email] Failed to send OTP:', error);
        throw error;
    }
};
