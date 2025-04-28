const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text, html }) => {
  // Create a test account if no email configuration is provided
  const testAccount = await nodemailer.createTestAccount();
  
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || testAccount.user,
      pass: process.env.EMAIL_PASSWORD || testAccount.pass
    }
  });
  
  // Send mail
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Tailoring App" <noreply@tailoringapp.com>',
    to,
    subject,
    text,
    html: html || text
  });
  
  console.log('Email sent: %s', info.messageId);
  
  // For development, log URL to preview email
  if (!process.env.EMAIL_HOST) {
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }
  
  return info;
};

module.exports = { sendEmail };