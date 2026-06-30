import { eventSeeds } from '../seeds/event.seed.js';
import { getRemainingSlots } from '../utils/event.mapper.js';

function includesText(value, keyword) {
  return String(value ?? '').toLowerCase().includes(keyword);
}

function matchesKeyword(event, keyword) {
  if (!keyword) {
    return true;
  }

  const searchableValues = [
    event.title,
    event.description,
    event.shortDescription,
    event.short_description,
    event.location,
    event.organization?.name,
    event.category?.name,
    ...(event.skills ?? []).map((skill) => skill.name)
  ];

  return searchableValues.some((value) => includesText(value, keyword));
}

function matchesFilters(event, filters) {
  if (filters.categoryId && event.category?.id !== filters.categoryId) {
    return false;
  }

  if (filters.organizationId && event.organization?.id !== filters.organizationId) {
    return false;
  }

  if (filters.skillId && !(event.skills ?? []).some((skill) => skill.id === filters.skillId)) {
    return false;
  }

  if (filters.location && !includesText(event.location, filters.location.toLowerCase())) {
    return false;
  }

  if (filters.startDate && new Date(event.start_date) < filters.startDate) {
    return false;
  }

  if (filters.endDate && new Date(event.end_date) > filters.endDate) {
    return false;
  }

  if (filters.availability === 'AVAILABLE' && getRemainingSlots(event) <= 0) {
    return false;
  }

  if (filters.availability === 'FULL' && getRemainingSlots(event) > 0) {
    return false;
  }

  return true;
}

function isPublicEvent(event) {
  return (
    event?.status === 'PUBLISHED' &&
    (event.is_active === true || event.isActive === true) &&
    !event.deleted_at &&
    !event.deletedAt
  );
}

export default class EventRepository {
  constructor(events = eventSeeds) {
    this.events = events;
  }

  async findPublicEvents(filters) {
    const keyword = filters.keyword?.toLowerCase() ?? '';

    const filtered = this.events
      .filter(isPublicEvent)
      .filter((event) => matchesKeyword(event, keyword))
      .filter((event) => matchesFilters(event, filters))
      .sort((left, right) => {
        const dateDelta = new Date(left.start_date) - new Date(right.start_date);
        return dateDelta || left.id - right.id;
      });

    const start = (filters.page - 1) * filters.pageSize;
    const end = start + filters.pageSize;

    return {
      items: filtered.slice(start, end),
      totalItems: filtered.length
    };
  }

  async findPublicEventById(id) {
    const event = this.events.find((candidate) => candidate.id === id);

    if (!isPublicEvent(event)) {
      return null;
    }

    return event;
  }
}
