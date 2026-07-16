import { useState, useCallback, useEffect } from 'react';
import { userService } from '../services/user.service.js';

/**
 * Custom hook for fetching volunteer history with filters, pagination, and summary.
 * UC021 — View Volunteer History
 *
 * @param {object} initialParams - { status, year, page, limit }
 * @returns {{
 *   history: Array,
 *   pagination: { total: number, page: number, limit: number, totalPages: number },
 *   summary: { total_events: number, completed_events: number, total_hours: number },
 *   loading: boolean,
 *   error: string|null,
 *   refetch: (params?: object) => void,
 * }}
 */
export function useVolunteerHistory(initialParams = {}) {
  const [params, setParams] = useState({
    page: initialParams.page || 1,
    limit: initialParams.limit || 10,
    status: initialParams.status || undefined,
    year: initialParams.year || undefined,
  });
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [summary, setSummary] = useState({
    total_events: 0,
    completed_events: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async (newParams) => {
    setLoading(true);
    setError(null);
    const merged = newParams ? { ...params, ...newParams } : params;

    try {
      const response = await userService.getVolunteerHistory(merged);
      const data = response.data;

      const rawPagination = data.pagination || {};
      setHistory(data.history || []);
      setPagination({
        page: rawPagination.page || 1,
        limit: rawPagination.limit || 10,
        total: rawPagination.total || 0,
        totalPages: rawPagination.total_pages || 0,
      });
      setSummary({ total_events: data.summary?.total || 0, completed_events: 0 });

      if (newParams) setParams(merged);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        'Không thể tải lịch sử đơn đăng ký.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Navigate to a page (1-based).
   */
  const goToPage = useCallback((page) => {
    fetchHistory({ page, limit: params.limit });
  }, [params.limit, fetchHistory]);

  /**
   * Apply filters (status, year). Resets to page 1.
   */
  const applyFilters = useCallback((filters) => {
    fetchHistory({ ...params, ...filters, page: 1 });
  }, [params, fetchHistory]);

  return {
    history,
    pagination,
    summary,
    loading,
    error,
    refetch: fetchHistory,
    goToPage,
    applyFilters,
  };
}

export default useVolunteerHistory;