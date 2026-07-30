# quickstart.md — Phase 1: Quick Start Guide for UC14 Cancel Application

**Feature**: UC14-feat-cancel-application
**Date**: 2026-07-21
**Author**: AI Agent (CuongLH)

---

## Quick Start: Triển khai UC14 Cancel Application

### Mục lục

1. [Tổng quan](#tổng-quan)
2. [Cấu trúc file cần tạo/sửa](#cấu-trúc-file-cần-tạosửa)
3. [Backend Implementation](#backend-implementation)
4. [Testing](#testing)
5. [Kiểm tra hoàn tất](#kiểm-tra-hoàn-tất)

---

## Tổng quan

**Mục tiêu**: Xây dựng endpoint `PATCH /api/v1/applications/:id/cancel` cho phép Volunteer hủy đơn đăng ký sự kiện (PENDING hoặc APPROVED) khi sự kiện chưa bắt đầu.

**Thời gian dự kiến**: 2-3 giờ (Backend: 1.5h, Testing: 1h)

**Phạm vi**: Backend only — Không có thay đổi Frontend trong UC này.

**Điều kiện tiên quyết**:

- Node.js 18+ đã cài đặt
- MySQL 8.0+ đã chạy
- `DATABASE2.md` đã được đọc và hiểu
- Module `application` đã có schema Prisma (`backend/prisma/schema.prisma`)
- Module `event` đã có repository và service (UC09)
- `authMiddleware` đã có `authenticate` (bắt buộc JWT)

---

## Cấu trúc file cần tạo/sửa

### Backend

| Action | File | Mô tả |
|--------|------|-------|
| **UPDATE** | `backend/src/repositories/application.repository.js` | Thêm `findByIdWithEvent` và `cancelApplication` |
| **CREATE** | `backend/src/services/application.service.js` | Business logic cancel |
| **CREATE** | `backend/src/controllers/application.controller.js` | Controller layer |
| **CREATE** | `backend/src/middlewares/validators/application.validator.js` | Zod validation |
| **CREATE** | `backend/src/routes/application.routes.js` | Route definition + Swagger |
| **UPDATE** | `backend/src/app.js` | Đăng ký application routes |
| **CREATE** | `backend/tests/unit/application.service.test.js` | Unit tests cho service |
| **CREATE** | `backend/tests/integration/application.cancel.test.js` | Integration tests |

---

## Backend Implementation

### Bước 1: Cập nhật Application Repository

**File**: `backend/src/repositories/application.repository.js` (cập nhật)

Thêm 2 method mới vào file hiện có:

```javascript
import prisma from '../prisma/client.js';

// ... existing methods ...

/**
 * Find application by ID with event data for cancellation validation.
 *
 * JOIN với bảng Event để lấy status và startDate của sự kiện.
 * Chỉ trả về application có userId khớp và status IN ['PENDING', 'APPROVED'].
 *
 * @param {number} applicationId
 * @param {number} userId
 * @returns {Promise<Object|null>}
 */
export async function findByIdWithEvent(applicationId, userId) {
    return await prisma.application.findFirst({
        where: {
            id: applicationId,
            userId: userId
        },
        select: {
            id: true,
            userId: true,
            eventId: true,
            status: true,
            message: true,
            createdAt: true,
            updatedAt: true,
            event: {
                select: {
                    id: true,
                    status: true,
                    startDate: true,
                    approvedParticipants: true
                }
            }
        }
    });
}

/**
 * Atomically cancel an application and optionally decrement event approvedParticipants.
 *
 * Sử dụng Prisma transaction để đảm bảo tính nhất quán:
 * 1. Update application status → CANCELLED
 * 2. Nếu currentStatus = APPROVED, decrement approvedParticipants (guard: > 0)
 *
 * @param {number} applicationId
 * @param {number} eventId
 * @param {string} currentStatus - 'PENDING' hoặc 'APPROVED'
 * @returns {Promise<Object>} Application sau khi cancel + event
 */
export async function cancelApplication(applicationId, eventId, currentStatus) {
    return await prisma.$transaction(async (tx) => {
        // 1. Update application status
        const updatedApp = await tx.application.update({
            where: { id: applicationId },
            data: {
                status: 'CANCELLED',
                updatedAt: new Date()
            },
            select: {
                id: true,
                userId: true,
                eventId: true,
                status: true,
                message: true,
                createdAt: true,
                updatedAt: true
            }
        });

        // 2. If APPROVED, decrement event approvedParticipants
        let updatedEvent = null;
        if (currentStatus === 'APPROVED') {
            updatedEvent = await tx.event.update({
                where: {
                    id: eventId,
                    approvedParticipants: { gt: 0 }
                },
                data: {
                    approvedParticipants: { decrement: 1 }
                },
                select: {
                    id: true,
                    approvedParticipants: true
                }
            });

            // Guard: nếu approvedParticipants = 0, transaction vẫn thành công
            // nhưng updatedEvent = null (where condition failed). Fallback read.
            if (!updatedEvent) {
                updatedEvent = await tx.event.findUnique({
                    where: { id: eventId },
                    select: { id: true, approvedParticipants: true }
                });
            }
        } else {
            // PENDING: không thay đổi approvedParticipants
            updatedEvent = await tx.event.findUnique({
                where: { id: eventId },
                select: { id: true, approvedParticipants: true }
            });
        }

        return {
            ...updatedApp,
            event: updatedEvent
        };
    });
}
```

> **Lưu ý**: Nếu file `application.repository.js` chưa tồn tại, tạo mới với các method trên. Nếu đã tồn tại, chỉ thêm 2 method `findByIdWithEvent` và `cancelApplication`.

---

### Bước 2: Tạo Application Service

**File**: `backend/src/services/application.service.js`

```javascript
import { findByIdWithEvent, cancelApplication } from '../repositories/application.repository.js';
import AppError from '../utils/app-error.util.js';

/**
 * Cancel a volunteer's application.
 *
 * Business rules:
 * - Application must belong to the requesting user
 * - Application must be PENDING or APPROVED
 * - Event must be PUBLISHED and not yet started
 * - If APPROVED, decrement event approvedParticipants (guard: not below 0)
 *
 * @param {number} applicationId
 * @param {number} userId - Authenticated volunteer's user_id
 * @returns {Promise<Object>} Cancelled application with event info
 * @throws {AppError} 404, 403, 409
 */
export async function cancelUserApplication(applicationId, userId) {
    // 1. Fetch application with event data
    const application = await findByIdWithEvent(applicationId, userId);

    if (!application) {
        throw new AppError('Không tìm thấy đơn đăng ký.', 404, 'NOT_FOUND');
    }

    // 2. Validate application status
    if (application.status === 'CANCELLED') {
        throw new AppError('Đơn đăng ký này đã được hủy trước đó.', 409, 'CONFLICT');
    }

    if (application.status === 'REJECTED') {
        throw new AppError('Đơn đăng ký này đã bị từ chối, không thể hủy.', 409, 'CONFLICT');
    }

    // 3. Validate event status
    const { event } = application;

    if (event.status !== 'PUBLISHED') {
        throw new AppError('Sự kiện không còn khả dụng để hủy đơn đăng ký.', 409, 'CONFLICT');
    }

    // 4. Validate event not yet started
    const now = new Date();
    if (new Date(event.startDate) <= now) {
        throw new AppError('Sự kiện đã bắt đầu, không thể hủy đơn đăng ký.', 409, 'CONFLICT');
    }

    // 5. Atomic cancel operation
    const result = await cancelApplication(applicationId, event.id, application.status);

    return {
        id: result.id,
        userId: result.userId,
        eventId: result.eventId,
        status: result.status,
        message: result.message,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
        event: {
            id: result.event.id,
            approvedParticipants: result.event.approvedParticipants
        }
    };
}
```

---

### Bước 3: Tạo Application Validator

**File**: `backend/src/middlewares/validators/application.validator.js`

```javascript
import { z } from 'zod';

/**
 * Validation schema for application cancel endpoint.
 * Validates the :id path parameter.
 */
export const cancelApplicationParamSchema = z.object({
    id: z.coerce.number({
        required_error: 'ID đơn đăng ký là bắt buộc.',
        invalid_type_error: 'ID đơn đăng ký phải là số nguyên dương.'
    }).int('ID đơn đăng ký phải là số nguyên.')
      .positive('ID đơn đăng ký phải là số nguyên dương.')
      .max(2147483647, 'ID đơn đăng ký không hợp lệ.')
});
```

---

### Bước 4: Tạo Application Controller

**File**: `backend/src/controllers/application.controller.js`

```javascript
import * as applicationService from '../services/application.service.js';

/**
 * PATCH /api/v1/applications/:id/cancel
 *
 * Volunteer hủy đơn đăng ký sự kiện của chính mình.
 *
 * @swagger
 * /api/v1/applications/{id}/cancel:
 *   patch:
 *     summary: Hủy đơn đăng ký sự kiện
 *     description: |
 *       Volunteer đã đăng nhập hủy đơn đăng ký sự kiện của chính mình.
 *
 *       **Business Rules:**
 *       - Chỉ chủ đơn mới được hủy
 *       - Chỉ hủy được đơn ở trạng thái PENDING hoặc APPROVED
 *       - Sự kiện phải ở trạng thái PUBLISHED và chưa bắt đầu
 *       - Hủy APPROVED → giảm approvedParticipants đi 1
 *       - Hủy PENDING → không thay đổi approvedParticipants
 *     tags:
 *       - Applications
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID của đơn đăng ký
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 42
 *     responses:
 *       200:
 *         description: Hủy đơn thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Đơn đăng ký đã được hủy thành công."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     userId:
 *                       type: integer
 *                     eventId:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       example: "CANCELLED"
 *                     message:
 *                       type: string
 *                       nullable: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     event:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         approvedParticipants:
 *                           type: integer
 *       400:
 *         description: ID đơn không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Chưa đăng nhập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Không có quyền hủy đơn này
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Không tìm thấy đơn đăng ký
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Xung đột trạng thái
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Lỗi máy chủ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function cancelApplication(req, res, next) {
    try {
        const applicationId = Number(req.params.id);
        const userId = req.user.user_id;

        const result = await applicationService.cancelUserApplication(applicationId, userId);

        return res.status(200).json({
            success: true,
            message: 'Đơn đăng ký đã được hủy thành công.',
            data: result
        });
    } catch (error) {
        next(error);
    }
}
```

---

### Bước 5: Tạo Application Routes

**File**: `backend/src/routes/application.routes.js`

```javascript
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/auth.middleware.js';
import { validateParams } from '../middlewares/validators/validate.js';
import { cancelApplicationParamSchema } from '../middlewares/validators/application.validator.js';
import * as applicationController from '../controllers/application.controller.js';

const router = Router();

/**
 * PATCH /api/v1/applications/:id/cancel
 *
 * Volunteer hủy đơn đăng ký của chính mình.
 * Yêu cầu: JWT authentication + VOLUNTEER role.
 */
router.patch(
    '/:id/cancel',
    authenticate,
    authorize('VOLUNTEER'),
    validateParams(cancelApplicationParamSchema),
    applicationController.cancelApplication
);

export default router;
```

---

### Bước 6: Đăng ký Application Routes trong app.js

**File**: `backend/src/app.js` (cập nhật)

Thêm dòng sau vào phần route registration:

```javascript
import applicationRoutes from './routes/application.routes.js';

// ... existing routes ...

app.use('/api/v1/applications', applicationRoutes);
```

---

## Testing

### Bước 7: Unit Tests cho Application Service

**File**: `backend/tests/unit/application.service.test.js`

```javascript
import { cancelUserApplication } from '../../src/services/application.service.js';
import * as applicationRepository from '../../src/repositories/application.repository.js';

jest.mock('../../src/repositories/application.repository.js');

describe('Application Service - cancelUserApplication', () => {
    const mockNow = new Date('2026-07-21T12:00:00Z');
    const futureDate = new Date('2026-08-15T08:00:00Z');
    const pastDate = new Date('2026-07-01T08:00:00Z');

    const mockPendingApp = {
        id: 42,
        userId: 10,
        eventId: 1,
        status: 'PENDING',
        message: 'Tôi muốn tham gia.',
        createdAt: new Date('2026-07-12T09:30:00Z'),
        updatedAt: new Date('2026-07-12T09:30:00Z'),
        event: {
            id: 1,
            status: 'PUBLISHED',
            startDate: futureDate,
            approvedParticipants: 30
        }
    };

    const mockApprovedApp = {
        ...mockPendingApp,
        status: 'APPROVED',
        event: { ...mockPendingApp.event, approvedParticipants: 31 }
    };

    const mockCancelledResult = {
        id: 42,
        userId: 10,
        eventId: 1,
        status: 'CANCELLED',
        message: 'Tôi muốn tham gia.',
        createdAt: new Date('2026-07-12T09:30:00Z'),
        updatedAt: new Date('2026-07-21T12:00:00Z'),
        event: { id: 1, approvedParticipants: 30 }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        jest.setSystemTime(mockNow);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('Happy Path', () => {
        it('cancels PENDING application without changing approvedParticipants', async () => {
            applicationRepository.findByIdWithEvent.mockResolvedValue(mockPendingApp);
            applicationRepository.cancelApplication.mockResolvedValue({
                ...mockCancelledResult,
                event: { id: 1, approvedParticipants: 30 }
            });

            const result = await cancelUserApplication(42, 10);

            expect(result.status).toBe('CANCELLED');
            expect(result.event.approvedParticipants).toBe(30);
            expect(applicationRepository.cancelApplication).toHaveBeenCalledWith(42, 1, 'PENDING');
        });

        it('cancels APPROVED application and decrements approvedParticipants', async () => {
            applicationRepository.findByIdWithEvent.mockResolvedValue(mockApprovedApp);
            applicationRepository.cancelApplication.mockResolvedValue({
                ...mockCancelledResult,
                event: { id: 1, approvedParticipants: 30 }
            });

            const result = await cancelUserApplication(42, 10);

            expect(result.status).toBe('CANCELLED');
            expect(result.event.approvedParticipants).toBe(30);
            expect(applicationRepository.cancelApplication).toHaveBeenCalledWith(42, 1, 'APPROVED');
        });
    });

    describe('Error Cases', () => {
        it('throws 404 when application not found', async () => {
            applicationRepository.findByIdWithEvent.mockResolvedValue(null);

            await expect(cancelUserApplication(999, 10)).rejects.toMatchObject({
                statusCode: 404,
                code: 'NOT_FOUND'
            });
        });

        it('throws 409 when application is already CANCELLED', async () => {
            applicationRepository.findByIdWithEvent.mockResolvedValue({
                ...mockPendingApp,
                status: 'CANCELLED'
            });

            await expect(cancelUserApplication(42, 10)).rejects.toMatchObject({
                statusCode: 409,
                code: 'CONFLICT'
            });
        });

        it('throws 409 when application is REJECTED', async () => {
            applicationRepository.findByIdWithEvent.mockResolvedValue({
                ...mockPendingApp,
                status: 'REJECTED'
            });

            await expect(cancelUserApplication(42, 10)).rejects.toMatchObject({
                statusCode: 409,
                code: 'CONFLICT'
            });
        });

        it('throws 409 when event is not PUBLISHED', async () => {
            applicationRepository.findByIdWithEvent.mockResolvedValue({
                ...mockPendingApp,
                event: { ...mockPendingApp.event, status: 'IN_PROGRESS' }
            });

            await expect(cancelUserApplication(42, 10)).rejects.toMatchObject({
                statusCode: 409,
                code: 'CONFLICT'
            });
        });

        it('throws 409 when event has already started', async () => {
            applicationRepository.findByIdWithEvent.mockResolvedValue({
                ...mockPendingApp,
                event: { ...mockPendingApp.event, startDate: pastDate }
            });

            await expect(cancelUserApplication(42, 10)).rejects.toMatchObject({
                statusCode: 409,
                code: 'CONFLICT'
            });
        });

        it('throws 409 when event starts exactly at current time', async () => {
            applicationRepository.findByIdWithEvent.mockResolvedValue({
                ...mockPendingApp,
                event: { ...mockPendingApp.event, startDate: mockNow }
            });

            await expect(cancelUserApplication(42, 10)).rejects.toMatchObject({
                statusCode: 409,
                code: 'CONFLICT'
            });
        });
    });
});
```

---

### Bước 8: Integration Tests

**File**: `backend/tests/integration/application.cancel.test.js`

```javascript
import request from 'supertest';
import app from '../../src/app.js';

describe('PATCH /api/v1/applications/:id/cancel', () => {
    let volunteerCookie;
    let otherVolunteerCookie;

    beforeAll(async () => {
        // Login as volunteer
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'volunteer@test.com', password: 'Test123!' });
        volunteerCookie = res.headers['set-cookie'];

        // Login as another volunteer
        const res2 = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'volunteer2@test.com', password: 'Test123!' });
        otherVolunteerCookie = res2.headers['set-cookie'];
    });

    describe('Happy Path', () => {
        it('returns 200 when cancelling PENDING application', async () => {
            const res = await request(app)
                .patch('/api/v1/applications/1/cancel')
                .set('Cookie', volunteerCookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('CANCELLED');
            expect(res.body.data).toHaveProperty('event');
            expect(res.body.data.event).toHaveProperty('approvedParticipants');
        });

        it('returns 200 when cancelling APPROVED application', async () => {
            const res = await request(app)
                .patch('/api/v1/applications/2/cancel')
                .set('Cookie', volunteerCookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('CANCELLED');
        });
    });

    describe('Authorization', () => {
        it('returns 401 when not authenticated', async () => {
            const res = await request(app)
                .patch('/api/v1/applications/1/cancel');

            expect(res.status).toBe(401);
            expect(res.body.error.code).toBe('UNAUTHORIZED');
        });

        it('returns 403 when cancelling another user\'s application', async () => {
            const res = await request(app)
                .patch('/api/v1/applications/1/cancel')
                .set('Cookie', otherVolunteerCookie);

            expect(res.status).toBe(403);
            expect(res.body.error.code).toBe('FORBIDDEN');
        });
    });

    describe('Validation', () => {
        it('returns 400 for invalid application ID', async () => {
            const res = await request(app)
                .patch('/api/v1/applications/abc/cancel')
                .set('Cookie', volunteerCookie);

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('Not Found', () => {
        it('returns 404 for non-existent application', async () => {
            const res = await request(app)
                .patch('/api/v1/applications/99999/cancel')
                .set('Cookie', volunteerCookie);

            expect(res.status).toBe(404);
            expect(res.body.error.code).toBe('NOT_FOUND');
        });
    });

    describe('Conflict', () => {
        it('returns 409 when cancelling already CANCELLED application', async () => {
            const res = await request(app)
                .patch('/api/v1/applications/3/cancel')
                .set('Cookie', volunteerCookie);

            expect(res.status).toBe(409);
            expect(res.body.error.code).toBe('CONFLICT');
        });

        it('returns 409 when cancelling REJECTED application', async () => {
            const res = await request(app)
                .patch('/api/v1/applications/4/cancel')
                .set('Cookie', volunteerCookie);

            expect(res.status).toBe(409);
            expect(res.body.error.code).toBe('CONFLICT');
        });

        it('returns 409 when event has already started', async () => {
            const res = await request(app)
                .patch('/api/v1/applications/5/cancel')
                .set('Cookie', volunteerCookie);

            expect(res.status).toBe(409);
            expect(res.body.error.code).toBe('CONFLICT');
        });
    });
});
```

---

## Kiểm tra hoàn tất

### Checklist triển khai

- [ ] **Repository**: `findByIdWithEvent` và `cancelApplication` đã được thêm vào `application.repository.js`
- [ ] **Service**: `application.service.js` đã triển khai `cancelUserApplication` với đầy đủ business rules
- [ ] **Validator**: `cancelApplicationParamSchema` export từ `application.validator.js`
- [ ] **Controller**: `cancelApplication` xử lý `req.params.id` và `req.user.user_id`
- [ ] **Routes**: `PATCH /:id/cancel` route đã đăng ký với `authenticate`, `authorize('VOLUNTEER')`, và validation
- [ ] **App.js**: Application routes đã mount tại `/api/v1/applications`
- [ ] **Swagger**: JSDoc comment đầy đủ trên controller

### Checklist kiểm thử

- [ ] Unit tests cho `cancelUserApplication` (8 cases minimum)
- [ ] Integration tests cho `PATCH /api/v1/applications/:id/cancel` (10 cases)
- [ ] `npm run lint` pass không có errors
- [ ] Không có console errors

### Domain Rules Verification

- [ ] Chỉ Volunteer đã đăng nhập mới cancel được ✓ (`authenticate` + `authorize('VOLUNTEER')`)
- [ ] Chỉ chủ đơn mới cancel được ✓ (`findByIdWithEvent` filter by userId)
- [ ] Cancel PENDING không đổi approvedParticipants ✓ (`cancelApplication` branch)
- [ ] Cancel APPROVED giảm approvedParticipants 1 ✓ (transaction + `gt: 0` guard)
- [ ] approvedParticipants không xuống dưới 0 ✓ (guard trong transaction)
- [ ] Event đã bắt đầu → từ chối ✓ (`startDate <= now` check)
- [ ] Event không PUBLISHED → từ chối ✓ (`event.status !== 'PUBLISHED'` check)
- [ ] CANCELLED/REJECTED → từ chối ✓ (status check)
- [ ] Đơn không bị xóa, chỉ chuyển status ✓ (update, không delete)
- [ ] Transaction atomic ✓ (Prisma `$transaction`)

---

**END OF QUICKSTART.MD**