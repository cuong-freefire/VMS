import EventRepository from '../repositories/event.repository.js';
import { mapEventDetail, mapEventSummary } from '../utils/event.mapper.js';

export default class EventService {
  constructor(eventRepository = new EventRepository()) {
    this.eventRepository = eventRepository;
  }

  async getPublicEvents(filters) {
    const { items, totalItems } = await this.eventRepository.findPublicEvents(filters);

    return {
      items: items.map(mapEventSummary),
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / filters.pageSize)
      }
    };
  }

  async getPublicEventDetail(eventId) {
    const event = await this.eventRepository.findPublicEventById(eventId);

    if (!event) {
      const error = new Error('Event not found');
      error.status = 404;
      throw error;
    }

    return mapEventDetail(event);
  }
}
