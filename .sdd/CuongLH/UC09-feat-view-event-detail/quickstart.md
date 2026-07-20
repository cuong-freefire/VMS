# quickstart.md — Phase 1: Quick Start Guide for UC09 View Event Detail

**Feature**: UC09-feat-view-event-detail
**Date**: 2026-07-20
**Author**: AI Agent (Member 1 - CuongLH context)

---

## Quick Start: Triển khai UC09 View Event Detail

### Mục lục

1. [Tổng quan](#tổng-quan)
2. [Cấu trúc file cần tạo/sửa](#cấu-trúc-file-cần-tạosửa)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Testing](#testing)
6. [Kiểm tra hoàn tất](#kiểm-tra-hoàn-tất)

---

## Tổng quan

**Mục tiêu**: Xây dựng trang xem chi tiết sự kiện cho Guest và Volunteer với khả năng hiển thị trạng thái đơn đăng ký của Volunteer.

**Thời gian dự kiến**: 3-4 giờ (Backend: 1.5h, Frontend: 1.5h, Testing: 1h)

**Điều kiện tiên quyết**:

- Node.js 18+ đã cài đặt
- MySQL 8.0+ đã chạy
- `DATABASE2.md` đã được đọc và hiểu
- Các module `event` và `application` đã có schema Prisma (xem `backend/prisma/schema.prisma`)

---

## Cấu trúc file cần tạo/sửa

### Backend

| Action | File | Mô tả |
|--------|------|-------|
| **CREATE** | `backend/src/routes/event.routes.js` | Route definition + Swagger |
| **CREATE** | `backend/src/controllers/event.controller.js` | Controller layer |
| **CREATE** | `backend/src/services/event.service.js` | Business logic |
| **CREATE** | `backend/src/repositories/event.repository.js` | Database access |
| **CREATE** | `backend/src/middlewares/validators/event.validator.js` | Zod validation |
| **CREATE** | `backend/tests/integration/event.test.js` | Integration tests |
| **CREATE** | `backend/tests/unit/event.service.test.js` | Unit tests cho service |
| **UPDATE** | `backend/src/app.js` | Đăng ký event routes |
| **UPDATE** | `backend/src/middlewares/auth.middleware.js` | Thêm `authenticateOptional` |

### Frontend

| Action | File | Mô tả |
|--------|------|-------|
| **CREATE** | `frontend/src/components/pages/EventDetailPage.jsx` | Page component |
| **CREATE** | `frontend/src/hooks/useEventDetail.js` | Custom hook fetch dữ liệu |
| **CREATE** | `frontend/src/services/event.service.js` | API client |
| **UPDATE** | `frontend/src/App.js` | Thêm route `/events/:id` |

---

## Backend Implementation

### Bước 1: Tạo Event Repository

**File**: `backend/src/repositories/event.repository.js`

```javascript
import prisma from '../prisma/client.js';

/**
 * Find a visible event by ID with category and creator relations.
 *
 * Chỉ trả về event có isActive = true và status PUBLIC.
 * Sử dụng PRIMARY KEY lookup + 2 LEFT JOINs.
 *
 * @param {number} eventId
 * @returns {Promise<Object|null>}
 */
export async function findByIdWithRelations(eventId) {
    return await prisma.event.findUnique({
        where: {
            id: eventId,
            isActive: true,
            status: { in: ['PUBLISHED', 'IN_PROGRESS', 'COMPLETED'] }
        },
        select: {
            id: true,
            title: true,
            description: true,
            location: true,
            startDate: true,
            endDate: true,
            applicationDeadline: true,
            maxCapacity: true,
            approvedParticipants: true,
            imageUrl: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            category: {
                select: { id: true, name: true, categoryType: true }
            },
            createdByUser: {
                select: { id: true, fullName: true, avatarUrl: true }
            }
        }
    });
}
```

### Bước 2: Tạo Application Repository

**File**: `backend/src/repositories/application.repository.js`

```javascript
import prisma from '../prisma/client.js';

/**
 * Find application by user-event composite unique key.
 *
 * @param {number} userId
 * @param {number} eventId
 * @returns {Promise<Object|null>}
 */
export async function findByUserAndEvent(userId, eventId) {
    return await prisma.application.findUnique({
        where: {
            userId_eventId: { userId, eventId }
        },
        select: {
            id: true,
            status: true,
            createdAt: true
        }
    });
}
```

> **Note**: Nếu file `application.repository.js` đã tồn tại, chỉ cần thêm method `findByUserAndEvent`.

### Bước 3: Tạo Event Service

**File**: `backend/src/services/event.service.js`

Triển khai theo [service-contract.md](contracts/service-contract.md).

```javascript
import { findByIdWithRelations } from '../repositories/event.repository.js';
import { findByUserAndEvent } from '../repositories/application.repository.js';
import AppError from '../utils/app-error.util.js';

/**
 * Get event detail with optional user application context.
 *
 * @param {number} eventId
 * @param {number|null} userId
 * @returns {Promise<Object>} EventDetailDTO
 * @throws {AppError} 404 nếu event không tìm thấy
 */
export async function getEventDetail(eventId, userId) {
    const event = await findByIdWithRelations(eventId);

    if (!event) {
        throw new AppError('Không tìm thấy sự kiện.', 404, 'NOT_FOUND');
    }

    let userApplication = null;
    if (userId !== null && userId !== undefined) {
        const application = await findByUserAndEvent(userId, eventId);
        if (application) {
            userApplication = {
                id: application.id,
                status: application.status,
                createdAt: application.createdAt.toISOString()
            };
        }
    }

    const remainingSlots = event.maxCapacity - event.approvedParticipants;
    const isFull = event.approvedParticipants >= event.maxCapacity;

    return {
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        applicationDeadline: event.applicationDeadline.toISOString(),
        maxCapacity: event.maxCapacity,
        approvedParticipants: event.approvedParticipants,
        remainingSlots,
        isFull,
        imageUrl: event.imageUrl,
        status: event.status,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
        category: event.category ? {
            id: event.category.id,
            name: event.category.name,
            categoryType: event.category.categoryType
        } : null,
        createdBy: event.createdByUser ? {
            id: event.createdByUser.id,
            fullName: event.createdByUser.fullName,
            avatarUrl: event.createdByUser.avatarUrl
        } : null,
        userApplication
    };
}
```

### Bước 4: Tạo Event Validator

**File**: `backend/src/middlewares/validators/event.validator.js`

```javascript
import { z } from 'zod';

export const getByIdParamSchema = z.object({
    id: z.coerce.number({
        required_error: 'ID sự kiện là bắt buộc.',
        invalid_type_error: 'ID sự kiện phải là số nguyên dương.'
    }).int('ID sự kiện phải là số nguyên.')
      .positive('ID sự kiện phải là số nguyên dương.')
});
```

### Bước 5: Tạo Event Controller

**File**: `backend/src/controllers/event.controller.js`

```javascript
import * as eventService from '../services/event.service.js';

/**
 * GET /api/v1/events/:id
 *
 * @swagger
 * /api/v1/events/{id}:
 *   get:
 *     summary: Xem chi tiết sự kiện (Guest & Volunteer)
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của sự kiện
 *     responses:
 *       200:
 *         description: Chi tiết sự kiện
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/EventDetailDTO'
 *       400:
 *         description: ID không hợp lệ
 *       404:
 *         description: Không tìm thấy sự kiện
 *       500:
 *         description: Lỗi máy chủ
 */
export async function getById(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user?.user_id ?? null;

        const eventDetail = await eventService.getEventDetail(Number(id), userId);

        return res.status(200).json({
            success: true,
            data: eventDetail
        });
    } catch (error) {
        next(error);
    }
}
```

### Bước 6: Tạo Event Routes

**File**: `backend/src/routes/event.routes.js`

```javascript
import { Router } from 'express';
import { authenticateOptional } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validators/validate.js';
import { getByIdParamSchema } from '../middlewares/validators/event.validator.js';
import * as eventController from '../controllers/event.controller.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     EventDetailDTO:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         location:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         applicationDeadline:
 *           type: string
 *           format: date-time
 *         maxCapacity:
 *           type: integer
 *         approvedParticipants:
 *           type: integer
 *         remainingSlots:
 *           type: integer
 *         isFull:
 *           type: boolean
 *         imageUrl:
 *           type: string
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [PUBLISHED, IN_PROGRESS, COMPLETED]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         category:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             categoryType:
 *               type: string
 *               enum: [LOCATION, TIME, TYPE]
 *         createdBy:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: integer
 *             fullName:
 *               type: string
 *             avatarUrl:
 *               type: string
 *               nullable: true
 *         userApplication:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: integer
 *             status:
 *               type: string
 *               enum: [PENDING, APPROVED, REJECTED, CANCELLED]
 *             createdAt:
 *               type: string
 *               format: date-time
 */

router.get(
    '/:id',
    validate({ params: getByIdParamSchema }),
    authenticateOptional,
    eventController.getById
);

export default router;
```

### Bước 7: Thêm authenticateOptional Middleware

**File**: `backend/src/middlewares/auth.middleware.js` (cập nhật)

Thêm function `authenticateOptional` nếu chưa có:

```javascript
import jwt from 'jsonwebtoken';

/**
 * Optional authentication middleware.
 *
 * Parse JWT from cookie if present. Does NOT throw 401 if no valid token.
 * Sets req.user = null for Guest (unauthenticated) access.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function authenticateOptional(req, res, next) {
    const token = req.cookies?.token;
    if (!token) {
        req.user = null;
        return next();
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { user_id: decoded.user_id, email: decoded.email, role: decoded.role };
    } catch (err) {
        // Invalid/expired token → fallback to Guest (no 401)
        req.user = null;
    }
    next();
}
```

### Bước 8: Đăng ký Event Routes trong app.js

**File**: `backend/src/app.js` (cập nhật)

```javascript
import eventRoutes from './routes/event.routes.js';

// ... existing code ...

app.use('/api/v1/events', eventRoutes);
```

---

## Frontend Implementation

### Bước 9: Tạo API Client Service

**File**: `frontend/src/services/event.service.js`

```javascript
import axiosApi from '../api/axiosApi';

const EVENTS_ENDPOINT = '/events';

/**
 * Fetch event detail by ID.
 *
 * @param {number|string} id - Event ID
 * @returns {Promise<Object>} Axios response data
 */
export async function getEventById(id) {
    const response = await axiosApi.get(`${EVENTS_ENDPOINT}/${id}`);
    return response.data;
}
```

### Bước 10: Tạo Custom Hook

**File**: `frontend/src/hooks/useEventDetail.js`

```javascript
import { useState, useEffect, useCallback } from 'react';
import { getEventById } from '../services/event.service';

/**
 * Custom hook để fetch event detail.
 *
 * @param {number|string} eventId
 * @returns {{ event: Object|null, loading: boolean, error: string|null, refetch: Function }}
 */
export function useEventDetail(eventId) {
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchEvent = useCallback(async () => {
        if (!eventId) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const response = await getEventById(eventId);
            setEvent(response.data);
        } catch (err) {
            const message = err.response?.data?.error?.message || 'Không thể tải thông tin sự kiện.';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        fetchEvent();
    }, [fetchEvent]);

    return { event, loading, error, refetch: fetchEvent };
}
```

### Bước 11: Tạo EventDetailPage Component

**File**: `frontend/src/components/pages/EventDetailPage.jsx`

```jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useEventDetail } from '../../hooks/useEventDetail';
import { useAuth } from '../../contexts/authContext.context';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorState } from '../ui/ErrorState';
import { EmptyState } from '../ui/EmptyState';

/**
 * Trang xem chi tiết sự kiện.
 *
 * Hiển thị đầy đủ thông tin sự kiện, bao gồm:
 * - Thông tin cơ bản (title, description, location, dates)
 * - Sức chứa (maxCapacity, approvedParticipants, remainingSlots, isFull)
 * - Danh mục và người tạo
 *
 * Nếu user là Volunteer đã đăng nhập:
 * - Hiển thị trạng thái đơn đăng ký (nếu có)
 * - Hiển thị nút "Đăng ký ngay" nếu chưa apply
 *
 * @component
 */

const statusLabels = {
    PUBLISHED: 'Sắp diễn ra',
    IN_PROGRESS: 'Đang diễn ra',
    COMPLETED: 'Đã kết thúc'
};

const statusColors = {
    PUBLISHED: 'info',
    IN_PROGRESS: 'warning',
    COMPLETED: 'secondary'
};

const applicationStatusLabels = {
    PENDING: 'Đang chờ duyệt',
    APPROVED: 'Đã được duyệt',
    REJECTED: 'Bị từ chối',
    CANCELLED: 'Đã hủy'
};

const applicationStatusColors = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    CANCELLED: 'secondary'
};

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function EventDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { event, loading, error } = useEventDetail(id);

    if (loading) {
        return <LoadingSpinner message="Đang tải thông tin sự kiện..." />;
    }

    if (error) {
        return (
            <ErrorState
                title="Không thể tải sự kiện"
                message={error}
                onRetry={() => window.location.reload()}
            />
        );
    }

    if (!event) {
        return <EmptyState message="Không tìm thấy sự kiện." />;
    }

    const isVolunteer = user?.role === 'VOLUNTEER';
    const hasApplication = event.userApplication !== null;
    const canApply = isVolunteer && !hasApplication && event.status === 'PUBLISHED' && !event.isFull;

    return (
        <div className="container py-4">
            {/* Banner */}
            {event.imageUrl && (
                <div className="mb-4">
                    <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="img-fluid rounded w-100"
                        style={{ maxHeight: '400px', objectFit: 'cover' }}
                    />
                </div>
            )}

            <div className="row">
                <div className="col-lg-8">
                    <Card>
                        {/* Title & Status */}
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <h1 className="h2 mb-0">{event.title}</h1>
                            <span className={`badge bg-${statusColors[event.status]}`}>
                                {statusLabels[event.status]}
                            </span>
                        </div>

                        {/* Meta Info */}
                        <div className="mb-4">
                            {event.category && (
                                <span className="badge bg-primary me-2">
                                    {event.category.name}
                                </span>
                            )}
                            {event.createdBy && (
                                <small className="text-muted">
                                    Đăng bởi: {event.createdBy.fullName}
                                </small>
                            )}
                        </div>

                        {/* Capacity Info */}
                        <div className="row mb-4">
                            <div className="col-sm-4">
                                <small className="text-muted d-block">Sức chứa</small>
                                <strong>{event.maxCapacity} người</strong>
                            </div>
                            <div className="col-sm-4">
                                <small className="text-muted d-block">Đã đăng ký</small>
                                <strong>{event.approvedParticipants} người</strong>
                            </div>
                            <div className="col-sm-4">
                                <small className="text-muted d-block">Còn trống</small>
                                <strong className={event.isFull ? 'text-danger' : 'text-success'}>
                                    {event.isFull ? 'Đã đầy' : `${event.remainingSlots} suất`}
                                </strong>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="row mb-4">
                            <div className="col-sm-4">
                                <small className="text-muted d-block">Bắt đầu</small>
                                <strong>{formatDate(event.startDate)}</strong>
                            </div>
                            <div className="col-sm-4">
                                <small className="text-muted d-block">Kết thúc</small>
                                <strong>{formatDate(event.endDate)}</strong>
                            </div>
                            <div className="col-sm-4">
                                <small className="text-muted d-block">Hạn đăng ký</small>
                                <strong>{formatDate(event.applicationDeadline)}</strong>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="mb-4">
                            <small className="text-muted d-block">Địa điểm</small>
                            <strong>{event.location}</strong>
                        </div>

                        {/* Description */}
                        {event.description && (
                            <div className="mb-4">
                                <h5>Mô tả</h5>
                                <div
                                    className="event-description"
                                    dangerouslySetInnerHTML={{ __html: event.description }}
                                />
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="d-flex gap-2">
                            <Button variant="outline-secondary" onClick={() => navigate(-1)}>
                                Quay lại
                            </Button>
                            {canApply && (
                                <Button variant="primary">
                                    Đăng ký tham gia
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="col-lg-4">
                    {/* Application Status (Volunteer only) */}
                    {isVolunteer && hasApplication && (
                        <Card className="mb-3">
                            <h5 className="card-title">Trạng thái đơn đăng ký</h5>
                            <div className={`alert alert-${applicationStatusColors[event.userApplication.status]} mb-0`}>
                                <strong>{applicationStatusLabels[event.userApplication.status]}</strong>
                                <br />
                                <small>
                                    Ngày đăng ký: {formatDate(event.userApplication.createdAt)}
                                </small>
                            </div>
                        </Card>
                    )}

                    {/* Created By Info */}
                    {event.createdBy && (
                        <Card className="mb-3">
                            <h5 className="card-title">Người tổ chức</h5>
                            <div className="d-flex align-items-center">
                                {event.createdBy.avatarUrl && (
                                    <img
                                        src={event.createdBy.avatarUrl}
                                        alt={event.createdBy.fullName}
                                        className="rounded-circle me-2"
                                        width="48"
                                        height="48"
                                    />
                                )}
                                <span>{event.createdBy.fullName}</span>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

EventDetailPage.propTypes = {};

export default EventDetailPage;
```

### Bước 12: Đăng ký Route trong App.js

**File**: `frontend/src/App.js` (cập nhật)

```jsx
import EventDetailPage from './components/pages/EventDetailPage';

// ... existing imports ...

function App() {
    return (
        <Routes>
            {/* ... existing routes ... */}
            <Route path="/events/:id" element={<EventDetailPage />} />
        </Routes>
    );
}
```

---

## Testing

### Bước 13: Unit Tests cho Event Service

**File**: `backend/tests/unit/event.service.test.js`

```javascript
import { getEventDetail } from '../../src/services/event.service.js';
import * as eventRepository from '../../src/repositories/event.repository.js';
import * as applicationRepository from '../../src/repositories/application.repository.js';

jest.mock('../../src/repositories/event.repository.js');
jest.mock('../../src/repositories/application.repository.js');

describe('Event Service - getEventDetail', () => {
    const mockEvent = {
        id: 1,
        title: 'Test Event',
        description: '<p>Test</p>',
        location: 'TP.HCM',
        startDate: new Date('2026-08-15T08:00:00Z'),
        endDate: new Date('2026-08-15T17:00:00Z'),
        applicationDeadline: new Date('2026-08-10T23:59:59Z'),
        maxCapacity: 50,
        approvedParticipants: 30,
        imageUrl: 'https://example.com/img.jpg',
        status: 'PUBLISHED',
        createdAt: new Date('2026-07-01T10:00:00Z'),
        updatedAt: new Date('2026-07-10T15:30:00Z'),
        category: { id: 1, name: 'Môi trường', categoryType: 'TYPE' },
        createdByUser: { id: 5, fullName: 'Admin', avatarUrl: null }
    };

    const mockApplication = {
        id: 42,
        status: 'PENDING',
        createdAt: new Date('2026-07-12T09:30:00Z')
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns event detail for Guest (userId = null)', async () => {
        eventRepository.findByIdWithRelations.mockResolvedValue(mockEvent);

        const result = await getEventDetail(1, null);

        expect(result.id).toBe(1);
        expect(result.userApplication).toBeNull();
        expect(result.remainingSlots).toBe(20);
        expect(result.isFull).toBe(false);
        expect(applicationRepository.findByUserAndEvent).not.toHaveBeenCalled();
    });

    it('returns event detail for Volunteer without application', async () => {
        eventRepository.findByIdWithRelations.mockResolvedValue(mockEvent);
        applicationRepository.findByUserAndEvent.mockResolvedValue(null);

        const result = await getEventDetail(1, 10);

        expect(result.userApplication).toBeNull();
        expect(applicationRepository.findByUserAndEvent).toHaveBeenCalledWith(10, 1);
    });

    it('returns event detail for Volunteer with application', async () => {
        eventRepository.findByIdWithRelations.mockResolvedValue(mockEvent);
        applicationRepository.findByUserAndEvent.mockResolvedValue(mockApplication);

        const result = await getEventDetail(1, 10);

        expect(result.userApplication).toEqual({
            id: 42,
            status: 'PENDING',
            createdAt: mockApplication.createdAt.toISOString()
        });
    });

    it('throws 404 when event not found', async () => {
        eventRepository.findByIdWithRelations.mockResolvedValue(null);

        await expect(getEventDetail(999, null)).rejects.toMatchObject({
            statusCode: 404,
            code: 'NOT_FOUND'
        });
    });

    it('computes isFull = true when capacity reached', async () => {
        const fullEvent = { ...mockEvent, approvedParticipants: 50 };
        eventRepository.findByIdWithRelations.mockResolvedValue(fullEvent);

        const result = await getEventDetail(1, null);

        expect(result.remainingSlots).toBe(0);
        expect(result.isFull).toBe(true);
    });
});
```

### Bước 14: Integration Tests cho API

**File**: `backend/tests/integration/event.test.js`

```javascript
import request from 'supertest';
import app from '../../src/app.js';

describe('GET /api/v1/events/:id', () => {
    describe('Guest (no auth)', () => {
        it('returns 200 with event detail for PUBLISHED event', async () => {
            const res = await request(app).get('/api/v1/events/1');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data).toHaveProperty('title');
            expect(res.body.data).toHaveProperty('remainingSlots');
            expect(res.body.data).toHaveProperty('isFull');
            expect(res.body.data.userApplication).toBeNull();
        });

        it('returns 404 for DRAFT event', async () => {
            const res = await request(app).get('/api/v1/events/2'); // Assuming event 2 is DRAFT

            expect(res.status).toBe(404);
            expect(res.body.error.code).toBe('NOT_FOUND');
        });

        it('returns 404 for non-existent event', async () => {
            const res = await request(app).get('/api/v1/events/99999');

            expect(res.status).toBe(404);
        });

        it('returns 400 for invalid id', async () => {
            const res = await request(app).get('/api/v1/events/abc');

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('Volunteer (with auth)', () => {
        let volunteerCookie;

        beforeAll(async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: 'volunteer@test.com', password: 'Test123!' });
            volunteerCookie = res.headers['set-cookie'];
        });

        it('returns event with userApplication for applied volunteer', async () => {
            const res = await request(app)
                .get('/api/v1/events/1')
                .set('Cookie', volunteerCookie);

            expect(res.status).toBe(200);
            expect(res.body.data.userApplication).not.toBeNull();
            expect(res.body.data.userApplication).toHaveProperty('id');
            expect(res.body.data.userApplication).toHaveProperty('status');
            expect(res.body.data.userApplication).not.toHaveProperty('message');
        });

        it('returns event with userApplication = null for non-applied volunteer', async () => {
            const res = await request(app)
                .get('/api/v1/events/3') // Assuming volunteer hasn't applied to event 3
                .set('Cookie', volunteerCookie);

            expect(res.status).toBe(200);
            expect(res.body.data.userApplication).toBeNull();
        });
    });
});
```

---

## Kiểm tra hoàn tất

### Checklist triển khai

- [ ] **Repository**: `eventRepository.findByIdWithRelations` đã được tạo và export
- [ ] **Repository**: `applicationRepository.findByUserAndEvent` đã được tạo hoặc thêm vào file hiện có
- [ ] **Service**: `eventService.getEventDetail` đã triển khai với logic `userId` nullable
- [ ] **Validator**: `getByIdParamSchema` export từ `event.validator.js`
- [ ] **Controller**: `eventController.getById` xử lý `req.user?.user_id ?? null`
- [ ] **Middleware**: `authenticateOptional` đã thêm vào `auth.middleware.js`
- [ ] **Routes**: `GET /:id` route đã đăng ký với validation + authenticateOptional
- [ ] **App.js**: Event routes đã mount tại `/api/v1/events`
- [ ] **Frontend Service**: `event.service.js` với `getEventById`
- [ ] **Frontend Hook**: `useEventDetail` hook
- [ ] **Frontend Page**: `EventDetailPage.jsx` với đầy đủ states (loading, error, empty, success)
- [ ] **Frontend Route**: Route `/events/:id` đã đăng ký trong `App.js`

### Checklist kiểm thử

- [ ] Unit tests cho `eventService.getEventDetail` (5 cases minimum)
- [ ] Integration tests cho `GET /api/v1/events/:id` (Guest + Volunteer)
- [ ] `npm run lint` pass không có errors
- [ ] Không có console errors trong cả backend và frontend

### Domain Rules Verification

- [ ] Guest luôn nhận `userApplication: null` ✓
- [ ] Volunteer chỉ thấy application của chính mình ✓
- [ ] Không expose `message`, `processedBy`, `processedAt` ✓
- [ ] Chỉ hiển thị event có `isActive: true` và status visible ✓
- [ ] Sử dụng `authenticateOptional` (không throw 401) ✓

---

**END OF QUICKSTART.MD**
