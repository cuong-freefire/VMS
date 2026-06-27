/**
 * Swagger JSDoc Configuration
 *
 * File này config Swagger/OpenAPI để generate API documentation tự động từ comments trong routes.
 * Swagger UI server sẽ quét file này và render ra giao diện interactive tại http://localhost:3636
 *
 * Cách sử dụng:
 * 1. Viết @swagger comments phía trước route definition trong routes/*.js
 * 2. Swagger tự động quét file trong apis array
 * 3. Swagger UI sẽ tự động cập nhật documentation
 *
 * Ví dụ @swagger comment:
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Success }
 *       401: { description: Unauthorized }
 */

import swaggerJsdoc from 'swagger-jsdoc';

/**
 * Options cho swagger-jsdoc
 * Định nghĩa OpenAPI spec definition và file nào chứa @swagger comments
 */
const swaggerOptions = {
  definition: {
    // Phiên bản OpenAPI spec
    openapi: '3.0.0',

    // Thông tin API
    info: {
      title: 'VMS API Documentation',
      version: '1.0.0',
      description:
        'REST API documentation cho Volunteer Management System (VMS). Hệ thống quản lý tình nguyện viên và sự kiện tình nguyện.',
      contact: {
        name: 'VMS Dev Team',
        email: 'dev@vms.com'
      },
      license: {
        name: 'ISC'
      }
    },

    /**
     * Servers: nơi API endpoints thực sự được host
     * Swagger UI sẽ test API bằng cách gọi tới URLs này
     * 
     * NOTE: Swagger UI server chạy trên port 3636, nhưng API server chạy trên port 5000
     * Nên phải trỏ về 5000 để test API được
     */
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development API server'
      }
    ],

    /**
     * Components: định nghĩa tái sử dụng (schemas, security schemes, responses)
     * Giúp tránh lặp lại code trong @swagger comments
     */
    components: {
      // Security schemes: cách xác thực
      securitySchemes: {
        // Cookie-based JWT authentication (HttpOnly)
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token', // Tên cookie chứa JWT token
          description: 'JWT token được lưu trong httpOnly cookie sau khi đăng nhập'
        }
      },

      // Reusable schemas (data types)
      schemas: {
        /**
         * Error Response Schema
         * Được sử dụng cho mọi error response (4xx, 5xx)
         */
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Email hoặc mật khẩu không chính xác'
            },
            code: {
              type: 'string',
              example: 'UNAUTHORIZED'
            },
            details: {
              type: 'object',
              nullable: true,
              example: null
            }
          }
        },

        /**
         * Success Response Schema
         * Được sử dụng cho mọi success response (2xx)
         */
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Thành công'
            },
            data: {
              type: 'object',
              example: {}
            }
          }
        }
      }
    }
  },

  /**
   * Paths to files chứa JSDoc comments với @swagger annotation
   * Glob pattern: quét tất cả .js files trong routes folder
   * 
   * swagger-jsdoc sẽ tự động tìm tất cả @swagger blocks trong các file này
   * và merge chúng vào OpenAPI spec
   */
  apis: ['./src/routes/*.js']
};

/**
 * Tạo OpenAPI spec bằng swagger-jsdoc
 * Hàm này quét tất cả @swagger comments trong files định nghĩa ở trên
 * và sinh ra đầy đủ OpenAPI object
 */
const swaggerDocs = swaggerJsdoc(swaggerOptions);

export default swaggerDocs;
