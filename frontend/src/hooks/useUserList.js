import { useState, useCallback, useEffect, useRef } from "react";
import { userService } from "../services/user.service.js";

/**
 * Custom hook for fetching paginated user list with search & filters.
 * UC26 — View User List, UC30 — Filter User
 *
 * @param {Object} initialParams - Initial query params
 * @param {number} [initialParams.page=1]
 * @param {number} [initialParams.limit=20]
 * @param {string} [initialParams.search]
 * @param {string} [initialParams.role]
 * @param {string} [initialParams.sort]
 * @param {string} [initialParams.is_active]
 * @param {string} [initialParams.from_date]
 * @param {string} [initialParams.to_date]
 * @returns {{
 *   users: Array,
 *   pagination: Object|null,
 *   loading: boolean,
 *   error: string|null,
 *   refetch: () => void,
 *   setParams: (params: Object) => void,
 * }}
 */
export function useUserList(initialParams = {}) {
    const [params, setParams] = useState({
        page: initialParams.page || 1,
        limit: initialParams.limit || 20,
        search: initialParams.search || "",
        role: initialParams.role || "",
        sort: initialParams.sort || "created_at:desc",
        is_active: initialParams.is_active !== undefined ? initialParams.is_active : "",
        from_date: initialParams.from_date || "",
        to_date: initialParams.to_date || "",
    });
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Debounce timer ref for search
    const debounceRef = useRef(null);

    const fetchUsers = useCallback(async (queryParams) => {
        setLoading(true);
        setError(null);

        try {
            // Build clean params — strip empty strings
            const cleanParams = {};
            for (const [key, value] of Object.entries(queryParams ?? {})) {
                if (value !== "" &&
                    value !== undefined &&
                    value !== null &&
                    !Number.isNaN(value)
                ) {
                    cleanParams[key] = value;
                }
            }

            const response = await userService.getUsers(cleanParams);
            setUsers(response.data?.users || []);
            setPagination(response.data?.pagination || null);
        } catch (err) {
            setError(
                err?.details ??
                err?.detail ??
                err?.message ??
                "Không thể tải danh sách người dùng."
            );

            setUsers([]);
            setPagination(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const refetch = useCallback(() => {
        fetchUsers(params);
    }, [fetchUsers, params]);

    useEffect(() => {
        fetchUsers(params);
    }, [params, fetchUsers]);

    /**
     * Update query params with debounce for search field.
     * Other filters reset page to 1 immediately.
     */
    const updateParams = useCallback((newParams = {}) => {
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
                if (newParams.role !== undefined) merged.page = 1;
                if (newParams.is_active !== undefined) merged.page = 1;
                if (newParams.from_date !== undefined) merged.page = 1;
                if (newParams.to_date !== undefined) merged.page = 1;
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
        users,
        pagination,
        loading,
        error,
        refetch,
        setParams: updateParams,
    };
}

export default useUserList;