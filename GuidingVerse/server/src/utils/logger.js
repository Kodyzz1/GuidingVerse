import winston from 'winston';
import dotenv from 'dotenv';

dotenv.config();

const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize } = format;

// Define log format
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

export const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    colorize(), // Add colors
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Add timestamp
    logFormat
  ),
  transports: [
    new transports.Console()
  ],
  // Do not exit on handled exceptions
  exitOnError: false,
}); 