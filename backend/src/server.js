/**
 * Express Server Entry Point
 *
 * File này khởi động server chính (API server)
 * - Port: 5000 (development) hoặc từ .env
 * - Logs: Dùng Pino logger thay vì console.log
 * - Lắng nghe HTTP requests và xử lý thông qua app.js
 */

import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import logger from './config/logger.config.js';

// Lấy port từ .env, mặc định 5000 nếu không có
const PORT = process.env.PORT_BE || 5000;

/**
 * Khởi động server
 * - app.listen(): Khởi động Express server
 * - logger.info(): Dùng Pino logger thay vì console.log
 *   (Vì console.log bị cấm trong production code theo convention AGENTS.md)
 */
app.listen(PORT, () => {
  // Log thông tin startup
  logger.info(`🚀 API server is running on http://localhost:${PORT}`);
  logger.info(`📚 Swagger UI: http://localhost:3636`);
  logger.info(`🔗 Environment: ${process.env.NODE_ENV || 'development'}`);
});


