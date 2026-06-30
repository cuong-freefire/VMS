import { Link } from 'react-router-dom';
import { formatEventDateRange, formatSlots, getStatusClass } from '../../utils/eventFormatters';

export default function EventCard({ event }) {
    const statusClass = getStatusClass(event.displayStatus);

    return (
        <article className="event-card h-100">
            <div className="event-card-media">
                {event.imageUrl ? (
                    <img src={event.imageUrl} alt={event.title} />
                ) : (
                    <div className="event-card-fallback">VMS</div>
                )}
            </div>

            <div className="event-card-body">
                <div className="d-flex justify-content-between align-items-start gap-2">
                    <h2 className="event-card-title">{event.title || 'Untitled event'}</h2>
                    <span className={`badge ${statusClass}`}>{event.displayStatus || 'UPCOMING'}</span>
                </div>

                <p className="event-card-description">
                    {event.shortDescription || 'Event details will be updated soon.'}
                </p>

                <dl className="event-card-meta">
                    <div>
                        <dt>Organization</dt>
                        <dd>{event.organization?.name || 'Updating'}</dd>
                    </div>
                    <div>
                        <dt>Category</dt>
                        <dd>{event.category?.name || 'Updating'}</dd>
                    </div>
                    <div>
                        <dt>Time</dt>
                        <dd>{formatEventDateRange(event.startDate, event.endDate)}</dd>
                    </div>
                    <div>
                        <dt>Location</dt>
                        <dd>{event.location || 'Updating'}</dd>
                    </div>
                </dl>

                {event.skills?.length > 0 && (
                    <div className="event-skill-list">
                        {event.skills.map((skill) => (
                            <span className="badge rounded-pill text-bg-light" key={skill.id}>
                                {skill.name}
                            </span>
                        ))}
                    </div>
                )}

                <div className="event-card-footer">
                    <span className="fw-semibold">{formatSlots(event)}</span>
                    <Link className="btn btn-sm btn-outline-primary" to={`/events/${event.id}`}>
                        View Detail
                    </Link>
                </div>
            </div>
        </article>
    );
}
