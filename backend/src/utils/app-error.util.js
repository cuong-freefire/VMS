/**
 * AppError — Operational error với HTTP status code và error code.
 *
 * Sử dụng trong Service layer để throw error có cấu trúc.
 * Global Error Handler trong app.js sẽ bắt và format response.
 *
 * Owner: Member 1 - CuongLH
 */
class AppError extends Error {
  /**
   * @param {string} message - Thông báo lỗi (tiếng Việt)
   * @param {number} statusCode - HTTP status code (400, 404, 409, ...)
   * @param {string} code - Mã lỗi nội bộ (VD: NOT_FOUND, CONFLICT, ...)
   */
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // Phân biệt với programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;