import { eventDiscoveryApi } from './axiosApi';
import { buildEventQueryParams } from '../utils/eventQuery';

export function isCanceledRequest(error) {
    return error?.isCanceled || error?.code === 'ERR_CANCELED';
}

export async function fetchPublicEvents(query, options = {}) {
    const params = buildEventQueryParams(query);
    // Event Discovery base URL is normalized to /api/v1; keep the route as /events to avoid duplicate prefixes.
    const response = await eventDiscoveryApi.get('/events', {
        params,
        signal: options.signal,
        requiresAuth: false,
        silentAuth: true
    });

    if (!response?.success) {
        throw new Error(response?.error || response?.message || 'Unable to load events');
    }

    return response.data;
}

export async function getEventDetail(id, options = {}) {
    // Event Discovery base URL is normalized to /api/v1; keep the route relative to avoid duplicate prefixes.
    const response = await eventDiscoveryApi.get(`/events/${id}`, {
        signal: options.signal,
        requiresAuth: false,
        silentAuth: true
    });

    if (!response?.success) {
        const error = new Error(response?.error || response?.message || 'Unable to load event detail');
        error.status = response?.status;
        throw error;
    }

    return response.data;
}
