/**
 * Swagger UI Standalone Server
 *
 * Server riêng biệt chạy trên port 3636 để phục vụ API Documentation (Swagger UI).
 *
 * Lý do tách riêng:
 * - Không ảnh hưởng performance của API server chính (port 5000)
 * - Có thể deploy riêng hoặc tắt trong production
 * - Dễ dàng bảo vệ bằng auth riêng biệt nếu cần
 * - Clean separation of concerns: API server vs Documentation server
 *
 * Startup:
 *   npm run start:swagger
 *
 * Access:
 *   Swagger UI: http://localhost:3636
 *   API Server: http://localhost:5000 (phục vụ request từ Swagger UI)
 *
 * Architecture:
 *   - Swagger UI Server (port 3636) -> gọi API Server (port 5000)
 *   - CORS phải cho phép request từ localhost:3636 tới localhost:5000
 */

import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerDocs from './config/swagger.config.js';
import logger from './config/logger.config.js';

// Tạo Express app riêng cho Swagger UI
const app = express();

// Cổng cố định cho Swagger UI Documentation
const PORT = 3636;

/**
 * Mount Swagger UI tại root path (/)
 * - swaggerUi.serve: Phục vụ static assets của Swagger UI (CSS, JS, icons)
 * - swaggerUi.setup(swaggerDocs): Render Swagger UI với OpenAPI spec
 *
 * Options:
 * - customCss: CSS tùy chỉnh (ẩn topbar mặc định của Swagger)
 * - customSiteTitle: Tiêu đề tab browser
 */
app.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocs, {
    customCss: '.swagger-ui .topbar { display: none }', // Ẩn topbar để giao diện sạch hơn
    customSiteTitle: 'VMS API Documentation' // Tiêu đề hiển thị trên tab browser
  })
);

/**
 * Health check endpoint
 * Dùng để verify Swagger server đang chạy
 * Request: GET http://localhost:3636/health
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'swagger-ui-server',
    timestamp: new Date().toISOString()
  });
});

/**
 * Fallback route: nếu access tới path không tồn tại, redirect tới root (Swagger UI)
 * Giúp user không bị 404 khi nhập sai URL
 */
app.use((req, res) => {
  res.redirect('/');
});


/**
 * Khởi động server
 * Lắng nghe trên port 3636
 */
app.listen(PORT, () => {
  // Dùng logger thay vì console.log (theo convention)
  logger.info(
    `📚 Swagger UI server is running on http://localhost:${PORT}`
  );
  logger.info(`📖 API Documentation: http://localhost:${PORT}`);
  logger.info(
    `🔗 Make sure API server is running on http://localhost:5000`
  );
});
