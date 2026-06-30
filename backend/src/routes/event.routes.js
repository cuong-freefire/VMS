import { Router } from 'express';
import { getPublicEventDetail, getPublicEvents } from '../controllers/event.controller.js';
import { validatePublicEventId, validatePublicEventQuery } from '../validators/event.validator.js';

const router = Router();

/**
 * @swagger
 * /api/v1/events:
 *   get:
 *     summary: Get public event list, search, and filters
 *     tags:
 *       - Events
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *           maxLength: 100
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: skillId
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: availability
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, FULL]
 *     responses:
 *       200:
 *         description: Public events returned successfully
 *       422:
 *         description: Invalid query parameter
 */
router.get('/', validatePublicEventQuery, getPublicEvents);

/**
 * @swagger
 * /api/v1/events/{id}:
 *   get:
 *     summary: Get public event detail
 *     tags:
 *       - Events
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Public event detail returned successfully
 *       404:
 *         description: Event not found or not public
 *       422:
 *         description: Invalid event id
 */
router.get('/:id', validatePublicEventId, getPublicEventDetail);

export default router;
