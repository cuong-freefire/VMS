import { useState, useCallback, useEffect } from "react";
import { eventService } from "../services/event.service.js";

/**
 * Custom hook for fetching event detail by ID.
 * UC09 — View Event Detail
 *
 * @param {number|string} eventId - The event ID to fetch
 * @returns {{
 *   event: object|null,
 *   loading: boolean,
 *   error: string|null,
 *   refetch: () => void,
 * }}
 */
export function useEventDetail(eventId) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvent = useCallback(async () => {
    if (!eventId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await eventService.getEventDetail(eventId);
      // console.log(response.data);
      setEvent(response.data);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Không thể tải thông tin sự kiện.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  return { event, loading, error, refetch: fetchEvent };
}

export default useEventDetail;