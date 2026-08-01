import { useState, useCallback, useEffect, useRef } from "react";
import { skillService } from "../services/skill.service.js";

/**
 * Custom hook for fetching skill list with search.
 * UC34 — View Skill List, UC-feat-search-skill
 *
 * Backend GET /api/v1/skills supports search only (no pagination/sort).
 *
 * @param {Object} initialParams - Initial query params
 * @param {string} [initialParams.search]
 * @returns {{
 *   skills: Array,
 *   loading: boolean,
 *   error: string|null,
 *   refetch: () => void,
 *   setParams: (params: Object) => void,
 * }}
 */
export function useSkillList(initialParams = {}) {
  const [params, setParams] = useState({
    search: initialParams.search || "",
  });
  const [skills, setSkills] = useState([]);
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
    } catch (err) {
      const message =
        err?.message || "Không thể tải danh sách kỹ năng.";
      setError(message);
      setSkills([]);
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
   */
  const updateParams = useCallback((newParams) => {
    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (newParams.search !== undefined) {
      // Debounce search — 400ms
      debounceRef.current = setTimeout(() => {
        setParams((prev) => ({ ...prev, ...newParams }));
      }, 400);
    } else {
      // Immediate update for other params
      setParams((prev) => ({ ...prev, ...newParams }));
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

  return { skills, loading, error, refetch, setParams: updateParams };
}

export default useSkillList;