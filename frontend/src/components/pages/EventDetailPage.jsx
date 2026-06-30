import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getEventDetail, isCanceledRequest } from '../../api/eventApi';
import { formatEventDateRange, formatSlots, getStatusClass } from '../../utils/eventFormatters';

function DetailState({ title, message, onRetry }) {
    return (
        <div className="event-page event-detail-page">
            <div className="event-state event-state-error">
                <h1 className="event-detail-state-title">{title}</h1>
                <span>{message}</span>
                <div className="d-flex gap-2 flex-wrap justify-content-center">
                    {onRetry && (
                        <button className="btn btn-outline-primary btn-sm" type="button" onClick={onRetry}>
                            Retry
                        </button>
                    )}
                    <Link className="btn btn-primary btn-sm" to="/events">
                        Back to Events
                    </Link>
                </div>
            </div>
        </div>
    );
}

function OptionalSection({ title, value }) {
    if (!value) {
        return null;
    }

    return (
        <section className="event-detail-section">
            <h2>{title}</h2>
            <p>{value}</p>
        </section>
    );
}

export default function EventDetailPage() {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [status, setStatus] = useState('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const [imageFailed, setImageFailed] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const requestIdRef = useRef(0);

    const loadEvent = useCallback(async (signal, requestId) => {
        setStatus('loading');
        setErrorMessage('');
        setImageFailed(false);

        try {
            const data = await getEventDetail(id, { signal });

            if (signal.aborted || requestIdRef.current !== requestId) {
                return;
            }

            setEvent(data);
            setStatus('success');
        } catch (error) {
            if (isCanceledRequest(error) || signal.aborted || requestIdRef.current !== requestId) {
                return;
            }

            setEvent(null);

            if (error.status === 404 || error.status === 422) {
                setStatus('not-found');
                setErrorMessage('This event is unavailable or the event link is invalid.');
                return;
            }

            setStatus('error');
            setErrorMessage(error.message || 'Unable to load event detail.');
        }
    }, [id]);

    useEffect(() => {
        const controller = new AbortController();
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;

        loadEvent(controller.signal, requestId);

        return () => {
            controller.abort();
        };
    }, [loadEvent, refreshKey]);

    if (status === 'loading') {
        return (
            <div className="event-page event-detail-page">
                <div className="event-state">
                    <div className="spinner-border text-primary" role="status" aria-label="Loading event detail" />
                    <span>Loading event detail...</span>
                </div>
            </div>
        );
    }

    if (status === 'not-found') {
        return (
            <DetailState
                title="Event unavailable"
                message={errorMessage}
                onRetry={() => setRefreshKey((value) => value + 1)}
            />
        );
    }

    if (status === 'error') {
        return (
            <DetailState
                title="Unable to load event"
                message={errorMessage}
                onRetry={() => setRefreshKey((value) => value + 1)}
            />
        );
    }

    const statusClass = getStatusClass(event?.displayStatus || event?.status);
    const hasImage = event?.imageUrl && !imageFailed;

    return (
        <main className="event-page event-detail-page">
            <div className="event-detail-nav">
                <Link className="btn btn-outline-primary btn-sm" to="/events">
                    Back to Events
                </Link>
            </div>

            <article className="event-detail">
                <div className="event-detail-media">
                    {hasImage ? (
                        <img src={event.imageUrl} alt={event.title} onError={() => setImageFailed(true)} />
                    ) : (
                        <div className="event-detail-fallback">VMS</div>
                    )}
                </div>

                <div className="event-detail-content">
                    <div className="event-detail-heading">
                        <div>
                            <p className="text-uppercase text-primary fw-semibold mb-2">Volunteer Event</p>
                            <h1>{event?.title || 'Untitled event'}</h1>
                        </div>
                        <span className={`badge ${statusClass}`}>{event?.displayStatus || event?.status || 'UPCOMING'}</span>
                    </div>

                    {event?.shortDescription && (
                        <p className="event-detail-summary">{event.shortDescription}</p>
                    )}

                    <section className="event-detail-section">
                        <h2>Description</h2>
                        <p>{event?.description || 'Event details will be updated soon.'}</p>
                    </section>

                    <dl className="event-detail-meta">
                        <div>
                            <dt>Organization</dt>
                            <dd>{event?.organization?.name || 'Updating'}</dd>
                        </div>
                        <div>
                            <dt>Category</dt>
                            <dd>{event?.category?.name || 'Updating'}</dd>
                        </div>
                        <div>
                            <dt>Time</dt>
                            <dd>{formatEventDateRange(event?.startDate, event?.endDate)}</dd>
                        </div>
                        <div>
                            <dt>Location</dt>
                            <dd>{event?.location || 'Updating'}</dd>
                        </div>
                        <div>
                            <dt>Capacity</dt>
                            <dd>{formatSlots(event)}</dd>
                        </div>
                        <div>
                            <dt>Approved participants</dt>
                            <dd>{event?.approvedParticipants ?? 'Updating'}</dd>
                        </div>
                    </dl>

                    {event?.skills?.length > 0 && (
                        <section className="event-detail-section">
                            <h2>Skills</h2>
                            <div className="event-skill-list">
                                {event.skills.map((skill) => (
                                    <span className="badge rounded-pill text-bg-light" key={skill.id}>
                                        {skill.name}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    <OptionalSection title="Requirements" value={event?.requirements} />
                    <OptionalSection title="Benefits" value={event?.benefits} />
                    <OptionalSection title="Contact" value={event?.contactInfo} />
                    <OptionalSection title="Application deadline" value={event?.applicationDeadline} />
                </div>
            </article>
        </main>
    );
}
