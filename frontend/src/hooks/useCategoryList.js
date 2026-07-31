import { useState, useCallback, useEffect, useRef } from "react";
import { categoryService } from "../services/category.service.js";

/**
 * Custom hook for fetching paginated category list with search & filters.
 * UC31 — View Category List, UC-feat-search-category
 *
 * @param {Object} initialParams - Initial query params
 * @param {number} [initialParams.page=1]
 * @param {number} [initialParams.limit=20]
 * @param {string} [initialParams.search]
 * @param {string} [initialParams.type]
 * @param {string} [initialParams.sort]
 * @returns {{
 *   categories: Array,
 *   pagination: Object|null,
 *   loading: boolean,
 *   error: string|null,
 *   refetch: (params?: Object) => void,
 *   setParams: (params: Object) => void,
 * }}
 */
export function useCategoryList(initialParams = {}) {
  const [params, setParams] = useState({
    page: initialParams.page || 1,
    limit: initialParams.limit || 20,
    search: initialParams.search || "",
    type: initialParams.type || "",
    sort: initialParams.sort || "created_at:desc",
  });
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounce timer ref for search
  const debounceRef = useRef(null);

  const fetchCategories = useCallback(async (queryParams) => {
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

      const response = await categoryService.getCategories(cleanParams);
      setCategories(response.data?.categories || []);
      setPagination(response.data?.pagination || null);
    } catch (err) {
      const message =
        err?.message || "Không thể tải danh sách danh mục.";
      setError(message);
      setCategories([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchCategories(params);
  }, [fetchCategories, params]);

  useEffect(() => {
    fetchCategories(params);
  }, [params, fetchCategories]);

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
        if (newParams.type !== undefined) merged.page = 1;
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

  return { 
    categories, 
    pagination, 
    loading, 
    error, 
    refetch, 
    setParams: updateParams 
  };
}

export default useCategoryList;