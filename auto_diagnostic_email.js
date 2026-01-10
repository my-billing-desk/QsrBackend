const nodemailer = require('nodemailer');

const configs = [
    {
        name: "Gmail Service (Default)",
        service: 'gmail',
        auth: { user: 'stackriders@gmail.com', pass: 'jlelndfazgdiztyx' }
    },
    {
        name: "Gmail SMTP 587 (STARTTLS)",
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user: 'stackriders@gmail.com', pass: 'jlelndfazgdiztyx' }
    },
    {
        name: "Gmail SMTP 465 (Direct SSL)",
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: 'stackriders@gmail.com', pass: 'jlelndfazgdiztyx' }
    }
];

async function runTests() {
    console.log("🚀 Starting Automated Email Config Diagnostic...\n");

    for (const config of configs) {
        console.log(`--- Testing: ${config.name} ---`);
        const transporter = nodemailer.createTransport({
            ...config,
            logger: false,
            debug: false
        });

        try {
            await transporter.verify();
            console.log(`✅ SUCCESS: ${config.name} worked!\n`);

            // Try sending a real email with the successful one
            console.log("Sending verification email...");
            const info = await transporter.sendMail({
                from: '"Aksha POS" <stackriders@gmail.com>',
                to: 'stackriders@gmail.com',
                subject: 'Aksha POS - Automated Test Success',
                text: `Test successful using ${config.name}.`
            });
            console.log(`📧 Email sent! ID: ${info.messageId}\n`);

            console.log("SUGGESTION: Use this configuration in emailHelper.js");
            return; // Stop if we found a working one
        } catch (error) {
            console.log(`❌ FAILED: ${config.name}`);
            console.log(`Error: ${error.message}\n`);
        }
    }

    console.log("‼️ ALL CONFIGURATIONS FAILED.");
    console.log("This strongly suggests either:");
    console.log("1. The App Password 'jlelndfazgdiztyx' is incorrect or was revoked.");
    console.log("2. 2-Step Verification is not enabled for stackriders@gmail.com.");
    console.log("3. Google is region-locking the sign-in because the server is in a different location.");
}

runTests();
