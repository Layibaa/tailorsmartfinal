const nodemailer = require('nodemailer');
require('dotenv').config();

const sendEmail = async (to, subject, text) => {
  try {
    // Create a test account if we're in development
    let testAccount;
    let transporter;
    
    if (process.env.NODE_ENV === 'production') {
      // Production setup with real credentials
      transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } else {
      // Development setup with ethereal
      testAccount = await nodemailer.createTestAccount();
      
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    }

    // Send mail
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER || testAccount.user,
      to,
      subject,
      text
    });

    if (!process.env.NODE_ENV === 'production') {
      // Log URL for development to check the email in Ethereal
      console.log(`Email preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    console.log(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
};

module.exports = sendEmail;