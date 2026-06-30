import EventService from '../services/event.service.js';

const eventService = new EventService();

export async function getPublicEvents(req, res) {
  try {
    const data = await eventService.getPublicEvents(req.validatedQuery);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: status === 500 ? 'Internal server error' : error.message
    });
  }
}

export async function getPublicEventDetail(req, res) {
  try {
    const data = await eventService.getPublicEventDetail(req.validatedParams.id);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: status === 500 ? 'Internal server error' : error.message
    });
  }
}
