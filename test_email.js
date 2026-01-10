const nodemailer = require('nodemailer');

const test = async () => {
    console.log('--- Email Connection Test ---');

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'stackriders@gmail.com',
            pass: 'jlelndfazgdiztyx'
        },
        debug: true,
        logger: true
    });

    try {
        console.log('Verifying transporter...');
        await transporter.verify();
        console.log('✅ Transporter verified!');

        const info = await transporter.sendMail({
            from: '"Aksha Test" <stackriders@gmail.com>',
            to: 'stackriders@gmail.com',
            subject: 'Test Email from Aksha POS',
            text: 'If you see this, the email setup is working!'
        });

        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('❌ Test failed!');
        console.error(error);
    }
};

test();
