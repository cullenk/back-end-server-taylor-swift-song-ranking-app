const {
    sendEmail,
    getContactFormEmailTemplate,
    getPasswordResetTemplate,
    getNewUserNotificationTemplate
} = require('../services/emailService');

exports.sendEmail = async (emailData) => {
    console.log('=== EMAIL CONTROLLER START ===');
    console.log('Email controller called with data:', emailData);
    const { to, name, type, email, message, resetToken } = emailData;

    let emailTo, subject, htmlBody;

    switch (type) {
        case 'contact':
            console.log('Processing contact email...');
            emailTo = 'swiftierankinghub@gmail.com';
            subject = 'New Contact Form Submission';
            htmlBody = getContactFormEmailTemplate(name || 'Not provided', email, message);
            break;

        case 'passwordReset':
            console.log('Processing password reset email...');
            const resetUrl = `http://www.swiftierankinghub.com/reset-password/${resetToken}`;
            emailTo = to;
            subject = 'Password Reset Request';
            htmlBody = getPasswordResetTemplate(resetUrl);
            break;

        case 'newUser':
            console.log('Processing new user notification email...');
            emailTo = 'swiftierankinghub@gmail.com';
            subject = 'New User Registration';
            htmlBody = getNewUserNotificationTemplate(name, email);
            break;

        default:
            throw new Error('Invalid email type');
    }

    try {
        console.log('About to call emailService.sendEmail with:', { emailTo, subject });
        const result = await sendEmail(emailTo, subject, htmlBody);
        console.log('Email service returned:', result);

        if (result) {
            console.log('Email sent successfully');
            console.log('=== EMAIL CONTROLLER END ===');
            return { success: true, message: 'Email sent successfully' };
        } else {
            throw new Error('Failed to send email');
        }
    } catch (error) {
        console.error('=== EMAIL CONTROLLER ERROR ===');
        console.error('Email controller error:', error);
        console.error('=== EMAIL CONTROLLER ERROR END ===');
        throw error;
    }
}