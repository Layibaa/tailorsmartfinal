module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'tailorsmart_jwt_secret',
  jwtExpire: '24h',
  emailUser: process.env.EMAIL_USER || 'your-email@gmail.com',
  emailPass: process.env.EMAIL_PASS || 'your-email-password',
  emailService: 'gmail',
  otpExpireTime: 10 * 60 * 1000, // 10 minutes in milliseconds
  adminUsername: 'admin',
  adminPassword: 'Admin@123',
};
