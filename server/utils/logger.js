// ====================
// server/utils/logger.js
// ====================
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

class Logger {
  constructor() {
    this.logFile = path.join(logsDir, 'admin.log');
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaString = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaString}\n`;
  }

  writeToFile(level, message, meta = {}) {
    const logMessage = this.formatMessage(level, message, meta);
    fs.appendFile(this.logFile, logMessage, (err) => {
      if (err) console.error('Failed to write to log file:', err);
    });
  }

  info(message, meta = {}) {
    console.log(`ℹ️ ${message}`, meta);
    this.writeToFile('info', message, meta);
  }

  warn(message, meta = {}) {
    console.warn(`⚠️ ${message}`, meta);
    this.writeToFile('warn', message, meta);
  }

  error(message, meta = {}) {
    console.error(`❌ ${message}`, meta);
    this.writeToFile('error', message, meta);
  }

  success(message, meta = {}) {
    console.log(`✅ ${message}`, meta);
    this.writeToFile('success', message, meta);
  }

  adminAction(adminId, action, details = {}) {
    const message = `Admin ${adminId} performed action: ${action}`;
    this.info(message, { adminId, action, ...details });
  }
}

module.exports = new Logger();