/**
 * Express Application Configuration
 *
 * File này khởi tạo và cấu hình Express app.
 * Chỉ thêm vào các middleware/option cần thiết tuyệt đối không sửa logic, cấu trúc file này.
 *
 * Middleware order (rất quan trọng):
 * 1. Static files (public)
 * 2. JSON parser
 * 3. Cookie parser
 * 4. CORS
 * 5. Logger (Pino-HTTP) - phải SAU parsers, TRƯỚC routes
 * 6. Routes
 */

import dotenv from 'dotenv';
// Cấu hình env variables từ .env file
dotenv.config();

import express from 'express';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';

// Nhập logger middleware để log mọi HTTP request/response
import httpLogger from './middlewares/logger.middleware.js';
import { errorResponse } from './utils/response.util.js';

// Kiểm tra kết nối nodemailer (SMTP) khi server khởi động
import { verifyTransporter } from './config/transporter.config.js';

verifyTransporter();

const app = express();

// 1. Cấu hình phục vụ file tĩnh (public)
app.use(express.static('public'));
// 2. Cấu hình để express hiểu dữ liệu json từ frontend gửi về trong req.body.
app.use(express.json());
// 3. Cấu hình cookie-parser để server lấy được req.cookies từ frontend request
app.use(cookieParser());
/**
 * 4. Cấu hình CORS (Cross-Origin Resource Sharing)
 * Cho phép giao tiếp cross-origin giữa Frontend (port 3000), Backend (port 5000),
 * và Swagger UI (port 3636) để test API từ giao diện
 * 
 * Lý do cần 3 origins:
 * - Frontend (3000): Ứng dụng React chính
 * - Backend (5000): API server + Swagger UI cùng process
 * - Swagger UI (3636): Giao diện API documentation (nếu chạy standalone)
 */
app.use(
  cors({
    // Cho phép requests từ các origins này
    origin: [
      `http://localhost:${process.env.PORT_FE}`, // Frontend: port 3000
      `http://localhost:${process.env.PORT_BE}`, // Backend + Swagger: port 5000
      'http://localhost:3636' // Swagger UI standalone (optional): port 3636
    ],
    methods: 'GET,PUT,PATCH,POST,DELETE', // HTTP methods được phép
    preflightContinue: false, // Không tiếp tục xử lý OPTIONS requests
    credentials: true, // Cho phép gửi/nhận cookies (httpOnly JWT)
    optionsSuccessStatus: 204 // Status code cho successful preflight response
  })
);

/**
 * 5. Cấu hình Pino-HTTP Logger Middleware
 * Phải đặt SAU các parser (json, cookie) và CORS, TRƯỚC routes
 * để log được mọi request tới endpoints
 * 
 * Logger sẽ tự động:
 * - Log mỗi request với method, URL, status code
 * - Phân loại log level theo HTTP status (info/warn/error)
 * - Đo thời gian xử lý request (response time)
 */
app.use(httpLogger);

/**
 * 6. Khai báo Routes
 * Tất cả routes API phải có prefix /api/v1 theo chuẩn RESTful
 * Hiện tại chưa thêm prefix, nhưng nên refactor sau
 */
// 6.1 Auth routes
app.use('/api/v1/auth', authRoutes);
// 6.2 User routes
app.use('/api/v1/user', userRoutes);

app.get('/', (req, res) => {
  res.cookie('testCookie', 'testValue', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  res.status(200).json({
    success: true,
    message: 'VMS Backend API is running. Please use /api/v1/auth or /api/v1/user endpoints.'
  });
});

// Global Error Handler (luôn đặt cuối cùng)
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json(errorResponse(
    err.message || 'Internal Server Error',
    err.code || 'INTERNAL_SERVER_ERROR',
    err.details || null
  ));
});

export default app;