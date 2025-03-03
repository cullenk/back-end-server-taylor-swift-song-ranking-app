const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.sendEmail = async (emailData) => {
    const { to, name, type, email, message, resetToken } = emailData;

    let msg = {
        from: {
            email: 'swiftierankinghub@gmail.com',
            name: 'Swiftie Ranking Hub'
        },
    };

    switch (type) {
        case 'contact':
            msg = {
                ...msg,
                to: 'swiftierankinghub@gmail.com',
                subject: 'New Contact Form Submission',
                text: `
                    Name: ${name || 'Not provided'}
                    Email: ${email}
                    Message: ${message}
                `,
                html: `
                    <h1>New Contact Form Submission</h1>
                    <p><strong>Name:</strong> ${name || 'Not provided'}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Message:</strong> ${message}</p>
                `
            };
            break;

        case 'passwordReset':
            const resetUrl = `http://www.swiftierankinghub.com/reset-password/${resetToken}`;
            // const resetUrl = `http://localhost:4200/reset-password/${resetToken}`;

            msg = {
                ...msg,
                to: to,
                subject: 'Password Reset Request',
                html: `
                    <h1>Swiftie Ranking Hub Password Reset Request</h1>
                    <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
                    <p>Please click on the following link, or paste this into your browser to complete the process:</p>
                    <a href="${resetUrl}">${resetUrl}</a>
                    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
                `
            };
            break;

        case 'newUser':
            msg = {
                ...msg,
                to: 'swiftierankinghub@gmail.com',
                subject: 'New User Registration',
                html: `
                    <h1>New User Registered</h1>
                    <p>A new user has registered on Swiftie Ranking Hub:</p>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                `
            };
            break;
        default:
            throw new Error('Invalid email type');
    }

    try {
        console.log('Attempting to send email:', msg);
        const result = await sgMail.send(msg);
        console.log('Email sent successfully:', result);
        return { success: true, message: 'Email sent successfully' };
    } catch (error) {
        console.error('SendGrid error:', error);
        if (error.response) {
            console.error('Error body:', error.response.body);
        }
        throw error;
    }
}