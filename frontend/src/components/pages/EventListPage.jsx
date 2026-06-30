import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchPublicEvents, isCanceledRequest } from '../../api/eventApi';
import EventFilterPanel from '../events/EventFilterPanel';
import EventList from '../events/EventList';
import EventListState from '../events/EventListState';
import EventPagination from '../events/EventPagination';
import EventSearchBar from '../events/EventSearchBar';
import { DEFAULT_EVENT_QUERY, hasActiveFilters } from '../../utils/eventQuery';

export default function EventListPage() {
    const [query, setQuery] = useState(DEFAULT_EVENT_QUERY);
    const [events, setEvents] = useState([]);
    const [pagination, setPagination] = useState({
        page: DEFAULT_EVENT_QUERY.page,
        pageSize: DEFAULT_EVENT_QUERY.pageSize,
        totalItems: 0,
        totalPages: 0
    });
    const [status, setStatus] = useState('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);
    const requestIdRef = useRef(0);

    const loadEvents = useCallback(async (signal, requestId) => {
        setStatus('loading');
        setErrorMessage('');

        try {
            const data = await fetchPublicEvents(query, { signal });

            if (signal.aborted || requestIdRef.current !== requestId) {
                return;
            }

            setEvents(Array.isArray(data.items) ? data.items : []);
            setPagination(data.pagination || {
                page: query.page,
                pageSize: query.pageSize,
                totalItems: 0,
                totalPages: 0
            });
            setStatus('success');
        } catch (error) {
            if (isCanceledRequest(error) || signal.aborted || requestIdRef.current !== requestId) {
                return;
            }

            setEvents([]);
            setStatus('error');
            setErrorMessage(error.message || 'Unable to load events.');
        }
    }, [query]);

    useEffect(() => {
        const controller = new AbortController();
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;

        loadEvents(controller.signal, requestId);

        return () => {
            controller.abort();
        };
    }, [loadEvents, refreshKey]);

    const filters = useMemo(() => ({
        location: query.location,
        startDate: query.startDate,
        endDate: query.endDate,
        availability: query.availability,
        categoryId: query.categoryId,
        skillId: query.skillId,
        organizationId: query.organizationId
    }), [query]);

    const handleKeywordChange = (keyword) => {
        setQuery((current) => ({
            ...current,
            keyword,
            page: 1
        }));
    };

    const handleFilterChange = (key, value) => {
        setQuery((current) => ({
            ...current,
            [key]: value,
            page: 1
        }));
    };

    const handleClearFilter = (key) => {
        setQuery((current) => ({
            ...current,
            [key]: '',
            page: 1
        }));
    };

    const handleClearAllFilters = () => {
        setQuery((current) => ({
            ...DEFAULT_EVENT_QUERY,
            keyword: current.keyword,
            pageSize: current.pageSize
        }));
    };

    const handlePageChange = (page) => {
        setQuery((current) => ({
            ...current,
            page
        }));
    };

    const emptyMessage = hasActiveFilters(query) || query.keyword.trim()
        ? 'No public events match the current search or filters.'
        : 'No public events are available right now.';

    return (
        <div className="event-page">
            <section className="event-page-header">
                <div>
                    <p className="text-uppercase text-primary fw-semibold mb-2">Volunteer Events</p>
                    <h1>Find public volunteer opportunities</h1>
                </div>
            </section>

            <section className="event-toolbar">
                <EventSearchBar value={query.keyword} onChange={handleKeywordChange} />
                <EventFilterPanel
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onClearFilter={handleClearFilter}
                    onClearAll={handleClearAllFilters}
                />
            </section>

            <section className="event-results">
                {status === 'loading' && <EventListState type="loading" />}

                {status === 'error' && (
                    <EventListState
                        type="error"
                        message={errorMessage}
                        onRetry={() => setRefreshKey((value) => value + 1)}
                    />
                )}

                {status === 'success' && events.length === 0 && (
                    <EventListState type="empty" message={emptyMessage} />
                )}

                {status === 'success' && events.length > 0 && (
                    <>
                        <div className="event-result-summary">
                            <span>{pagination.totalItems} public events</span>
                        </div>
                        <EventList events={events} />
                        <EventPagination pagination={pagination} onPageChange={handlePageChange} />
                    </>
                )}
            </section>
        </div>
    );
}
