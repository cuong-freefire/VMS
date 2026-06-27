/**
 * Pino Logger Configuration
 *
 * File này khởi tạo logger instance duy nhất cho toàn bộ backend.
 * Pino được chọn vì performance cao và hỗ trợ structured logging (JSON).
 *
 * Transport:
 * - Development: pino-pretty (màu sắc, dễ đọc, format console friendly)
 * - Production: JSON format chuẩn (dễ parse bởi log aggregators như ELK, Datadog)
 *
 * Usage:
 *   import logger from './config/logger.config.js';
 *   logger.info('Thông báo');
 *   logger.error('Lỗi', { details });
 */

import pino from 'pino';

// Phát hiện môi trường development vs production
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Transport config cho pino-pretty
 * Chỉ áp dụng trong development để output đẹp với màu sắc
 * Production: không dùng pretty, log thuần JSON để máy xử lý
 */
const transport = isDevelopment
  ? {
      target: 'pino-pretty',
      options: {
        colorize: true, // Tô màu output để dễ nhìn
        translateTime: 'SYS:HH:MM:ss', // Format thời gian dễ đọc (ví dụ: 14:30:45)
        ignore: 'pid,hostname', // Bỏ qua các field không cần thiết trong dev
        singleLine: false // Cho phép multi-line log
      }
    }
  : undefined; // Production: không có transport, log thuần JSON

/**
 * Tạo logger instance duy nhất
 * - level: mức độ log (debug, info, warn, error, fatal)
 *   Lấy từ .env hoặc mặc định 'info'
 * - transport: cấu hình output format
 */
const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    transport
  }
);

export default logger;
