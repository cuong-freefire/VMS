/**
 * Pino-HTTP Middleware
 *
 * Middleware này tự động log mọi HTTP request/response.
 * Giúp tracking performance và debug issues mà không cần log thủ công ở mỗi controller.
 *
 * Features:
 * - Auto-logging request/response với thời gian xử lý (response time)
 * - Phân loại log level theo HTTP status code (info/warn/error)
 * - Format message dễ đọc với icon ✓/✗
 * - Tự động capture request URL, method, status code
 *
 * Usage:
 *   import loggerMiddleware from './middleware/logger.middleware.js';
 *   app.use(loggerMiddleware);  // Đặt SAU json parser, TRƯỚC routes
 */

import pinoHttp from 'pino-http';
import logger from '../config/logger.config.js';

/**
 * Hàm phân loại log level dựa vào HTTP status code
 * Giúp dễ dàng filter logs theo severity khi cần debug
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Error} err - Error object nếu có
 * @returns {string} - Log level: 'error', 'warn', hoặc 'info'
 */
function customLogLevel(req, res, err) {
  // 5xx: Server errors - mức độ cao nhất
  if (res.statusCode >= 500) return 'error';

  // 4xx: Client errors (validation, auth, not found)
  if (res.statusCode >= 400) return 'warn';

  // Nếu có exception được throw
  if (err) return 'error';

  // 2xx-3xx: Success responses
  return 'info';
}

/**
 * Tạo HTTP logger middleware bằng pino-http
 * Middleware này sẽ tự động gắn logger vào req.log cho mỗi request
 * và log response khi xong
 */
const httpLogger = pinoHttp({
  // Sử dụng logger instance từ config
  logger,

  // Tự động log mọi request/response
  autoLogging: true,

  /**
   * Custom message format khi request thành công
   * Ví dụ output: "✓ GET /api/auth/login → 200"
   */
  customSuccessMessage: (req, res) => {
    return `✓ ${req.method} ${req.url} → ${res.statusCode}`;
  },

  /**
   * Custom message format khi request có lỗi
   * Ví dụ output: "✗ POST /api/user/register → 400"
   */
  customErrorMessage: (req, res) => {
    return `✗ ${req.method} ${req.url} → ${res.statusCode}`;
  },

  /**
   * Sử dụng hàm phân loại log level tùy chỉnh
   */
  customLogLevel,

  /**
   * Không log middleware giấu (preflight requests, static files)
   * để giảm noise trong logs
   */
  skip: (req) => {
    // Skip OPTIONS preflight requests (CORS)
    if (req.method === 'OPTIONS') return true;
    // Skip health check endpoints nếu có
    if (req.url === '/health') return true;
    return false;
  }
});

export default httpLogger;
