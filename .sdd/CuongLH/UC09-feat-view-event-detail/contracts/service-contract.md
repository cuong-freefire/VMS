# service-contract.md — Phase 1: Service Contract for UC09 View Event Detail

**Feature**: UC09-feat-view-event-detail
**Date**: 2026-07-20
**Author**: AI Agent (Member 1 - CuongLH context)

---

## Service Contract: EventDetailService

## 1. Service Interface

```javascript
/**
 * Fetch event detail with optional user application context.
 *
 * @async
 * @function getEventDetail
 * @param {number} eventId - Positive integer event ID
 * @param {number|null} userId - Current user ID (null for Guest)
 * @returns {Promise<Object>} EventDetailDTO
 * @throws {AppError} 404 NOT_FOUND - Event doesn't exist, is inactive, or has hidden status
 * @throws {AppError} 400 VALIDATION_ERROR - Invalid eventId (caught by middleware)
 */
async function getEventDetail(eventId, userId)
```

## 2. Service Implementation Contract

```javascript
// File: backend/src/services/event.service.js

import { eventRepository } from '../repositories/event.repository.js';
import { applicationRepository } from '../repositories/application.repository.js';
import AppError from '../utils/app-error.util.js';

/**
 * Get event detail with optional user application context.
 */
export async function getEventDetail(eventId, userId) {
    // Step 1: Fetch event with relations
    const event = await eventRepository.findByIdWithRelations(eventId);

    if (!event) {
        throw new AppError('Không tìm thấy sự kiện.', 404, 'NOT_FOUND');
    }

    // Step 2: Fetch user application (if Volunteer)
    let userApplication = null;
    if (userId !== null && userId !== undefined) {
        const application = await applicationRepository.findByUserAndEvent(userId, eventId);
        if (application) {
            userApplication = {
                id: application.id,
                status: application.status,
                createdAt: application.createdAt.toISOString()
            };
        }
    }

    // Step 3: Compute derived fields
    const remainingSlots = event.maxCapacity - event.approvedParticipants;
    const isFull = event.approvedParticipants >= event.maxCapacity;

    // Step 4: Map to DTO
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

## 3. Repository Dependencies

### 3.1 Event Repository

#### `findByIdWithRelations(eventId)`

```javascript
// File: backend/src/repositories/event.repository.js

/**
 * Find a visible event by ID with category and creator relations.
 *
 * @param {number} eventId
 * @returns {Promise<Object|null>}
 */
async function findByIdWithRelations(eventId) {
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

### 3.2 Application Repository

#### `findByUserAndEvent(userId, eventId)`

```javascript
// File: backend/src/repositories/application.repository.js

/**
 * Find application by user-event composite key.
 *
 * @param {number} userId
 * @param {number} eventId
 * @returns {Promise<Object|null>}
 */
async function findByUserAndEvent(userId, eventId) {
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

## 4. Controller Contract

```javascript
// File: backend/src/controllers/event.controller.js

/**
 * GET /api/v1/events/:id
 *
 * @swagger
 * /api/v1/events/{id}:
 *   get:
 *     summary: Xem chi tiết sự kiện
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Chi tiết sự kiện
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/EventDetailDTO' }
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

## 5. Middleware Contract

### `authenticateOptional`

```javascript
// File: backend/src/middlewares/auth.middleware.js

/**
 * Optional authentication middleware.
 * Parse JWT from cookie if present.
 * Does NOT throw 401 if no valid token — sets req.user = null instead.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
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
        req.user = null; // Invalid/expired token → fallback to Guest
    }
    next();
}
```

## 6. Route Registration

```javascript
// File: backend/src/routes/event.routes.js

import { Router } from 'express';
import { authenticateOptional } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validators/validate.js';
import { getByIdParamSchema } from '../middlewares/validators/event.validator.js';
import * as eventController from '../controllers/event.controller.js';

const router = Router();

/**
 * GET /api/v1/events/:id
 *
 * Public endpoint with optional authentication.
 * Guest → userApplication: null
 * Volunteer → userApplication: { id, status, createdAt } | null
 */
router.get(
    '/:id',
    validate({ params: getByIdParamSchema }),
    authenticateOptional,
    eventController.getById
);

export default router;
```

## 7. Validator Contract

```javascript
// File: backend/src/middlewares/validators/event.validator.js

import { z } from 'zod';

export const getByIdParamSchema = z.object({
    id: z.coerce.number({
        required_error: 'ID sự kiện là bắt buộc.',
        invalid_type_error: 'ID sự kiện phải là số nguyên dương.'
    }).int('ID sự kiện phải là số nguyên.')
      .positive('ID sự kiện phải là số nguyên dương.')
});
```

## 8. Error Codes

| Code | HTTP Status | Semantics |
|------|------------|-----------|
| `NOT_FOUND` | 404 | Event không tồn tại/isActive:false/hidden status |
| `VALIDATION_ERROR` | 400 | Param `id` không hợp lệ |
| `INTERNAL_ERROR` | 500 | Lỗi DB / Prisma crash / unexpected |

---

**END OF SERVICE-CONTRACT.MD**