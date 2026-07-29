/**
 * Event Controller — View Event Detail (UC09)
 * Owner: Member 1 (CuongLH)
 *
 * Endpoint: GET /api/v1/events/:id
 * Handles both Guest (unauthenticated) and Volunteer (authenticated) requests.
 */

import * as eventService from "../services/event.service.js";

/**
 * GET /api/v1/events/:id
 * Handles both Guest (unauthenticated) and Volunteer (authenticated) requests.
 */
export async function getEventById(req, res, next) {
  try {
    const { id } = req.validatedParams;
    const userId = req.user?.user_id ?? null;

    const eventDetail = await eventService.getEventDetail(id, userId);

    return res.status(200).json({
      success: true,
      data: eventDetail,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/events
 * List published events with pagination, filtering, and sorting.
 * Public endpoint — no authentication required.
 */
export async function getEvents(req, res, next) {
  try {
    const { page, limit, search, category, sort, isPaid, hasSlots } = req.validatedQuery;

    const result = await eventService.listEvents({
      page,
      limit,
      search,
      category,
      sort,
      isPaid,
      hasSlots,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export default { getEventById, getEvents };