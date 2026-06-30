export default function EventListState({ type, message, onRetry }) {
    if (type === 'loading') {
        return (
            <div className="event-state">
                <div className="spinner-border text-primary" role="status" aria-label="Loading events" />
                <span>Loading events...</span>
            </div>
        );
    }

    if (type === 'error') {
        return (
            <div className="event-state event-state-error">
                <span>{message || 'Unable to load events.'}</span>
                <button className="btn btn-outline-primary btn-sm" type="button" onClick={onRetry}>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="event-state">
            <span>{message || 'No public events found.'}</span>
        </div>
    );
}
