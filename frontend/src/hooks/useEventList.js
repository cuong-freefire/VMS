import { useState, useCallback, useEffect, useRef } from "react";
import { eventService } from "../services/event.service.js";

/**
 * Custom hook for fetching paginated event list with filters.
 * UC08 — Browse Events
 *
 * @param {Object} initialParams - Initial query params
 * @param {number} [initialParams.page=1]
 * @param {number} [initialParams.limit=12]
 * @param {string} [initialParams.search]
 * @param {string} [initialParams.category]
 * @param {string} [initialParams.sort]
 * @param {boolean} [initialParams.isPaid]
 * @param {boolean} [initialParams.hasSlots]
 * @returns {{
 *   events: Array,
 *   pagination: Object|null,
 *   loading: boolean,
 *   error: string|null,
 *   refetch: (params?: Object) => void,
 *   setParams: (params: Object) => void,
 * }}
 */
export function useEventList(initialParams = {}) {
  const [params, setParams] = useState({
    page: initialParams.page || 1,
    limit: initialParams.limit || 12,
    search: initialParams.search || "",
    category: initialParams.category || "",
    sort: initialParams.sort || "newest",
    isPaid: initialParams.isPaid !== undefined ? initialParams.isPaid : "",
    hasSlots: initialParams.hasSlots !== undefined ? initialParams.hasSlots : "",
  });
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounce timer ref for search
  const debounceRef = useRef(null);

  const fetchEvents = useCallback(async (queryParams) => {
    setLoading(true);
    setError(null);

    try {
      // Build clean params — strip empty strings
      const cleanParams = {};
      for (const [key, value] of Object.entries(queryParams)) {
        if (value !== "" && value !== undefined && value !== null && !Number.isNaN(value)) {
          cleanParams[key] = value;
        }
      }

      const response = await eventService.listEvents(cleanParams);
      setEvents(response.data?.events || []);
      setPagination(response.data?.pagination || null);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Không thể tải danh sách sự kiện.";
      setError(message);
      setEvents([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(params);
  }, [params, fetchEvents]);

  /**
   * Update query params with debounce for search field.
   * Other filters reset page to 1 immediately.
   */
  const updateParams = useCallback((newParams) => {
    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (newParams.search !== undefined) {
      // Debounce search — 400ms
      debounceRef.current = setTimeout(() => {
        setParams((prev) => {
          const merged = { ...prev, ...newParams };
          merged.page = 1;
          return merged;
        });
      }, 400);
    } else {
      // Immediate update for other filters
      setParams((prev) => {
        const merged = { ...prev, ...newParams };
        if (newParams.category !== undefined) merged.page = 1;
        if (newParams.sort !== undefined) merged.page = 1;
        if (newParams.isPaid !== undefined) merged.page = 1;
        if (newParams.hasSlots !== undefined) merged.page = 1;
        return merged;
      });
    }
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return { events, pagination, loading, error, refetch: fetchEvents, setParams: updateParams };
}

export default useEventList;