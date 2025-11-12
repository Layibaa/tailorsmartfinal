// server/utils/emailService.js - FIXED with better error handling
const nodemailer = require('nodemailer');

// Create transporter with fallback
const createTransporter = async () => {
  // If production email settings exist, use them
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    console.log('📧 Using production email configuration');
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false // For development
      }
    });
  }
  
  // Otherwise, use Ethereal test account
  console.log('📧 Using Ethereal test email account');
  const testAccount = await nodemailer.createTestAccount();
  
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    console.log('📧 Preparing to send email to:', to);
    console.log('📧 Subject:', subject);
    
    // Create transporter
    const transporter = await createTransporter();
    
    // Verify connection
    await transporter.verify();
    console.log('✅ Email transporter verified');
    
    // Send mail
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Tailor Smart" <noreply@tailoringsmart.com>',
      to,
      subject,
      text,
      html: html || text
    });
    
    console.log('✅ Email sent successfully');
    console.log('📧 Message ID:', info.messageId);
    
    // For development with Ethereal, log preview URL
    if (!process.env.EMAIL_HOST) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('📧 Preview URL:', previewUrl);
      console.log('');
      console.log('🔗 CLICK THIS LINK TO VIEW THE EMAIL:');
      console.log(previewUrl);
      console.log('');
    }
    
    return {
      success: true,
      messageId: info.messageId,
      previewUrl: !process.env.EMAIL_HOST ? nodemailer.getTestMessageUrl(info) : null
    };
    
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Test email function for debugging
const testEmail = async (to) => {
  try {
    console.log('🧪 Testing email service...');
    
    const result = await sendEmail({
      to,
      subject: 'Test Email - Tailor Smart',
      text: 'This is a test email from Tailor Smart. If you received this, the email service is working correctly!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #f0f0f0; padding: 20px; border-radius: 8px; }
            h1 { color: #333; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Email Service Test</h1>
            <p>This is a test email from Tailor Smart.</p>
            <p>If you received this, the email service is working correctly!</p>
            <p>Time: ${new Date().toISOString()}</p>
          </div>
        </body>
        </html>
      `
    });
    
    console.log('✅ Test email sent successfully');
    return result;
    
  } catch (error) {
    console.error('❌ Test email failed:', error);
    throw error;
  }
};

module.exports = { sendEmail, testEmail };