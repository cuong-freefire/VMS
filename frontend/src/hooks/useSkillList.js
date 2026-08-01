import { useState, useCallback, useEffect, useRef } from "react";
import { skillService } from "../services/skill.service.js";

/**
 * Custom hook for fetching paginated skill list with search & sort.
 * UC34 — View Skill List, UC-feat-search-skill
 *
 * @param {Object} initialParams - Initial query params
 * @param {number} [initialParams.page=1]
 * @param {number} [initialParams.limit=20]
 * @param {string} [initialParams.search]
 * @param {string} [initialParams.sort]
 * @returns {{
 *   skills: Array,
 *   pagination: Object|null,
 *   loading: boolean,
 *   error: string|null,
 *   refetch: () => void,
 *   setParams: (params: Object) => void,
 * }}
 */
export function useSkillList(initialParams = {}) {
  const [params, setParams] = useState({
    page: initialParams.page || 1,
    limit: initialParams.limit || 20,
    search: initialParams.search || "",
    sort: initialParams.sort || "created_at:desc",
  });
  const [skills, setSkills] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounce timer ref for search
  const debounceRef = useRef(null);

  const fetchSkills = useCallback(async (queryParams) => {
    setLoading(true);
    setError(null);

    try {
      // Build clean params — strip empty strings
      const cleanParams = {};
      for (const [key, value] of Object.entries(queryParams ?? {})) {
        if (value !== "" && value !== undefined && value !== null && !Number.isNaN(value)) {
          cleanParams[key] = value;
        }
      }

      const response = await skillService.getSkills(cleanParams);
      setSkills(response.data?.skills || []);
      setPagination(response.data?.pagination || null);
    } catch (err) {
      const message =
        err?.message || "Không thể tải danh sách kỹ năng.";
      setError(message);
      setSkills([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchSkills(params);
  }, [fetchSkills, params]);

  useEffect(() => {
    fetchSkills(params);
  }, [params, fetchSkills]);

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
        if (newParams.sort !== undefined) merged.page = 1;
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

  return { skills, pagination, loading, error, refetch, setParams: updateParams };
}

export default useSkillList;