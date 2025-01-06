const winston = require('winston');
const path = require('path');

// Log formatını tanımla
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Logger'ı oluştur
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [
    // Konsola log
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Dosyaya log
    new winston.transports.File({ 
      filename: path.join(__dirname, 'logs', 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, 'logs', 'combined.log')
    })
  ]
});

module.exports = logger; 