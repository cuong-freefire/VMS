function toIsoString(value) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString();
}

function deriveDisplayStatus(event) {
  const now = new Date();
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);

  if (now < startDate) {
    return 'UPCOMING';
  }

  if (now >= startDate && now <= endDate) {
    return 'ONGOING';
  }

  return 'COMPLETED';
}

export function getRemainingSlots(event) {
  const remaining =
    Number(event.max_capacity ?? event.maxCapacity) -
    Number(event.approved_participants ?? event.approvedParticipants ?? 0);
  return Math.max(0, remaining);
}

export function mapEventSummary(event) {
  return {
    id: event.id,
    title: event.title,
    shortDescription: event.shortDescription ?? event.short_description ?? event.description,
    imageUrl: event.imageUrl ?? event.image_url ?? null,
    organization: event.organization
      ? {
          id: event.organization.id,
          name: event.organization.name
        }
      : null,
    category: event.category
      ? {
          id: event.category.id,
          name: event.category.name
        }
      : null,
    skills: Array.isArray(event.skills)
      ? event.skills.map((skill) => ({
          id: skill.id,
          name: skill.name
        }))
      : [],
    startDate: toIsoString(event.start_date ?? event.startDate),
    endDate: toIsoString(event.end_date ?? event.endDate),
    location: event.location,
    maxCapacity: Number(event.max_capacity ?? event.maxCapacity),
    approvedParticipants: Number(event.approved_participants ?? event.approvedParticipants ?? 0),
    remainingSlots: getRemainingSlots(event),
    status: event.status,
    displayStatus: deriveDisplayStatus(event)
  };
}

export function mapEventDetail(event) {
  const detail = {
    ...mapEventSummary(event),
    description: event.description
  };

  for (const field of ['requirements', 'benefits', 'contactInfo', 'applicationDeadline']) {
    if (event[field] !== undefined && event[field] !== null) {
      detail[field] = event[field];
    }
  }

  return detail;
}
