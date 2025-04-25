const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');

// Set SendGrid API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Fallback to nodemailer for development if SendGrid is not configured
const createTestAccount = async () => {
  try {
    // Create a test account at ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    
    // Create a transporter using ethereal.email
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    
    return { transporter, testAccount };
  } catch (error) {
    console.error('Error creating test email account:', error);
    return null;
  }
};

// Send email using SendGrid or fallback to nodemailer
const sendEmail = async (to, subject, text, html) => {
  try {
    // Try SendGrid first if configured
    if (process.env.SENDGRID_API_KEY) {
      try {
        const msg = {
          to,
          from: 'test@example.com', // SendGrid requires verified sender
          subject,
          text,
          html,
        };
        
        await sgMail.send(msg);
        console.log(`Email sent to ${to} using SendGrid`);
        return {
          success: true,
          message: 'Email sent successfully via SendGrid',
        };
      } catch (sendgridError) {
        console.error('SendGrid error, falling back to Nodemailer:', sendgridError);
        // Continue to Nodemailer fallback on SendGrid error
      }
    }
    
    // Fallback to nodemailer (for development or if SendGrid fails)
    const { transporter, testAccount } = await createTestAccount();
    
    if (!transporter) {
      throw new Error('Failed to create test email account');
    }
    
    const info = await transporter.sendMail({
      from: '"TailorSmart" <test@example.com>',
      to,
      subject,
      text,
      html,
    });
    
    console.log(`Email sent to ${to} using Nodemailer`);
    console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    
    return {
      success: true,
      message: 'Email sent successfully via Nodemailer',
      debug: {
        previewUrl: nodemailer.getTestMessageUrl(info),
        id: info.messageId,
      },
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      message: `Failed to send email: ${error.message}`,
    };
  }
};

// Send OTP verification email
const sendOTPEmail = async (email, otp) => {
  const subject = 'TailorSmart Verification Code';
  const text = `Your TailorSmart verification code is: ${otp}. This code will expire in 5 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #0066CC;">TailorSmart Verification</h2>
      <p>Your verification code is:</p>
      <div style="background-color: #f5f5f5; padding: 15px; font-size: 24px; text-align: center; letter-spacing: 5px; font-weight: bold; margin: 20px 0; border-radius: 5px;">
        ${otp}
      </div>
      <p>This code will expire in 5 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
      <p style="font-size: 12px; color: #777;">TailorSmart - Connect with tailors near you</p>
    </div>
  `;
  
  return await sendEmail(email, subject, text, html);
};

module.exports = { sendEmail, sendOTPEmail };