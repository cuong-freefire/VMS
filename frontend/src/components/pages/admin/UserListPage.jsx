import React, { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  User,
  Mail,
  Shield,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  X,
  Plus,
  Eye,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Calendar,
} from "lucide-react";
import useUserList from "../../../hooks/useUserList";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import Skeleton from "../../ui/Skeleton";
import EmptyState from "../../ui/EmptyState";
import ErrorState from "../../ui/ErrorState";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
const ROLE_OPTIONS = [
  { value: "", label: "Tất cả vai trò" },
  { value: "volunteer", label: "Tình nguyện viên" },
  { value: "staff", label: "Nhân viên" },
  { value: "manager", label: "Quản lý" },
  { value: "admin", label: "Quản trị viên" },
];

const ROLE_BADGE_COLORS = {
  VOLUNTEER: { bg: "#dbeafe", text: "#1e40af" },
  STAFF: { bg: "#dcfce7", text: "#166534" },
  MANAGER: { bg: "#fef3c7", text: "#92400e" },
  ADMIN: { bg: "#fee2e2", text: "#991b1b" },
};

const ROLE_LABELS = {
  VOLUNTEER: "Tình nguyện viên",
  STAFF: "Nhân viên",
  MANAGER: "Quản lý",
  ADMIN: "Quản trị viên",
};

const SORT_OPTIONS = [
  { value: "created_at:desc", label: "Mới nhất" },
  { value: "created_at:asc", label: "Cũ nhất" },
  { value: "full_name:asc", label: "Tên A-Z" },
  { value: "full_name:desc", label: "Tên Z-A" },
  { value: "email:asc", label: "Email A-Z" },
  { value: "email:desc", label: "Email Z-A" },
];

const ACTIVE_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "true", label: "Đang hoạt động" },
  { value: "false", label: "Đã vô hiệu hóa" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function formatDate(iso) {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "\u2014";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/* ------------------------------------------------------------------ */
/*  UserListPage                                                      */
/* ------------------------------------------------------------------ */
export default function UserListPage() {
  const { users, pagination, loading, error, setParams, refetch } =
    useUserList();

  /* Local state */
  const [searchInput, setSearchInput] = useState("");
  const [roleValue, setRoleValue] = useState("");
  const [activeValue, setActiveValue] = useState("");
  const [sortValue, setSortValue] = useState("created_at:desc");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeFilters, setActiveFilters] = useState(0);

  /* Track active filter count */
  React.useEffect(() => {
    let count = 0;
    if (roleValue) count++;
    if (activeValue) count++;
    if (fromDate) count++;
    if (toDate) count++;
    setActiveFilters(count);
  }, [roleValue, activeValue, fromDate, toDate]);

  /* Search is debounced inside useUserList */
  const handleSearchChange = useCallback(
    (e) => {
      const val = e.target.value;
      setSearchInput(val);
      setParams({ search: val });
    },
    [setParams]
  );

  const handleRoleChange = useCallback(
    (e) => {
      const val = e.target.value;
      setRoleValue(val);
      setParams({ role: val || undefined });
    },
    [setParams]
  );

  const handleActiveChange = useCallback(
    (e) => {
      const val = e.target.value;
      setActiveValue(val);
      setParams({ is_active: val === "" ? undefined : val });
    },
    [setParams]
  );

  const handleSortChange = useCallback(
    (e) => {
      const val = e.target.value;
      setSortValue(val);
      setParams({ sort: val });
    },
    [setParams]
  );

  const handleFromDateChange = useCallback(
    (e) => {
      const val = e.target.value;
      setFromDate(val);
      setParams({ from_date: val || undefined });
    },
    [setParams]
  );

  const handleToDateChange = useCallback(
    (e) => {
      const val = e.target.value;
      setToDate(val);
      setParams({ to_date: val || undefined });
    },
    [setParams]
  );

  const handleClearFilters = useCallback(() => {
    setSearchInput("");
    setRoleValue("");
    setActiveValue("");
    setSortValue("created_at:desc");
    setFromDate("");
    setToDate("");
    setParams({
      search: "",
      role: undefined,
      is_active: undefined,
      sort: "created_at:desc",
      from_date: undefined,
      to_date: undefined,
    });
  }, [setParams]);

  const handlePageChange = useCallback(
    (page) => {
      setParams({ page });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setParams]
  );

  /* Generate visible page numbers */
  const visiblePages = useMemo(() => {
    if (!pagination) return [];
    const total = pagination.totalPages;
    const current = pagination.page;
    const pages = [];
    const maxVisible = 5;

    if (total <= maxVisible + 2) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, current - 1);
      let end = Math.min(total - 1, current + 1);
      if (current <= 3) end = Math.min(total - 1, maxVisible);
      if (current >= total - 2) start = Math.max(2, total - maxVisible + 1);
      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < total - 1) pages.push("...");
      pages.push(total);
    }
    return pages;
  }, [pagination]);

  /* ------------------------------------------------------------------ */
  /*  Render: Loading                                                   */
  /* ------------------------------------------------------------------ */
  if (loading && users.length === 0) {
    return (
      <div className="user-list-page" style={{ maxWidth: "var(--max-content-width)", margin: "0 auto" }}>
        {/* Skeleton header */}
        <div style={{ marginBottom: "var(--space-4)" }}>
          <Skeleton width="300px" height="32px" />
          <Skeleton width="200px" height="16px" style={{ marginTop: 8 }} />
        </div>
        {/* Skeleton filters */}
        <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-4)", flexWrap: "wrap" }}>
          <Skeleton width="280px" height="40px" />
          <Skeleton width="180px" height="40px" />
          <Skeleton width="180px" height="40px" />
        </div>
        {/* Skeleton table */}
        <Card>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ display: "flex", gap: 16, padding: "12px 0", borderBottom: i < 7 ? "1px solid var(--surface-ceramic)" : "none" }}>
              <Skeleton width="40px" height="40px" style={{ borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <Skeleton width="60%" height="16px" />
                <Skeleton width="40%" height="12px" style={{ marginTop: 6 }} />
              </div>
              <Skeleton width="120px" height="24px" />
              <Skeleton width="80px" height="24px" />
            </div>
          ))}
        </Card>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Render: Error                                                     */
  /* ------------------------------------------------------------------ */
  if (error && users.length === 0) {
    return (
      <div style={{ maxWidth: "var(--max-content-width)", margin: "0 auto" }}>
        <ErrorState
          icon={AlertCircle}
          title="Không thể tải danh sách người dùng"
          message={error}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Render: Main content                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div className="user-list-page" style={{ maxWidth: "var(--max-content-width)", margin: "0 auto" }}>
      {/* Page heading */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <div>
          <h1 style={{ fontSize: "var(--font-size-h1)", fontWeight: "var(--font-weight-semibold)", color: "var(--text-primary)", margin: 0 }}>
            Quản lý Người dùng
          </h1>
          <p style={{ fontSize: "var(--font-size-small)", color: "var(--text-secondary)", margin: "4px 0 0" }}>
            Quản lý tài khoản tình nguyện viên, nhân viên, quản lý và quản trị viên
          </p>
        </div>
        <Link to="/admin/users/add" style={{ textDecoration: "none" }}>
          <Button variant="primary">
            <Plus size={18} />
            Thêm người dùng
          </Button>
        </Link>
      </div>

      {/* Filters bar */}
      <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-3)", flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 280px", minWidth: 200 }}>
          <Search size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
          <input
            type="text"
            className="input-vms"
            style={{ paddingLeft: 40, width: "100%" }}
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchInput}
            onChange={handleSearchChange}
          />
        </div>

        {/* Role filter */}
        <select
          className="input-vms"
          style={{ minWidth: 160 }}
          value={roleValue}
          onChange={handleRoleChange}
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          className="input-vms"
          style={{ minWidth: 160 }}
          value={activeValue}
          onChange={handleActiveChange}
        >
          {ACTIVE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          className="input-vms"
          style={{ minWidth: 140 }}
          value={sortValue}
          onChange={handleSortChange}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Date range filters row */}
      <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-4)", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={16} style={{ color: "var(--text-tertiary)" }} />
          <span style={{ fontSize: "var(--font-size-small)", color: "var(--text-secondary)" }}>Từ ngày:</span>
          <input
            type="date"
            className="input-vms"
            style={{ width: 160 }}
            value={fromDate}
            onChange={handleFromDateChange}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={16} style={{ color: "var(--text-tertiary)" }} />
          <span style={{ fontSize: "var(--font-size-small)", color: "var(--text-secondary)" }}>Đến ngày:</span>
          <input
            type="date"
            className="input-vms"
            style={{ width: 160 }}
            value={toDate}
            onChange={handleToDateChange}
          />
        </div>

        {/* Clear filters button */}
        {activeFilters > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClearFilters}
          >
            <X size={16} />
            Xoá bộ lọc
          </Button>
        )}
      </div>

      {/* Empty state */}
      {!loading && users.length === 0 && (
        <Card>
          <EmptyState
            icon={SlidersHorizontal}
            title="Không tìm thấy người dùng"
            message="Hiện không có người dùng nào phù hợp với tiêu chí tìm kiếm."
          />
        </Card>
      )}

      {/* User table */}
      {users.length > 0 && (
        <Card padding="0" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--surface-ceramic)", borderBottom: "2px solid var(--border-color)" }}>
                  <th style={thStyle}>Người dùng</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Vai trò</th>
                  <th style={thStyle}>Trạng thái</th>
                  <th style={thStyle}>Ngày tạo</th>
                  <th style={{ ...thStyle, textAlign: "center", width: 80 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const roleColor = ROLE_BADGE_COLORS[user.role] || ROLE_BADGE_COLORS.VOLUNTEER;
                  const roleLabel = ROLE_LABELS[user.role] || user.role;
                  return (
                    <tr
                      key={user.user_id}
                      style={{ borderBottom: "1px solid var(--surface-ceramic)", transition: "background-color 0.15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--surface-ceramic)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: "50%",
                            backgroundColor: "var(--green-accent)", color: "var(--text-on-dark)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "var(--font-size-small)", fontWeight: "var(--font-weight-bold)",
                            flexShrink: 0, overflow: "hidden",
                          }}>
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              user.full_name?.[0]?.toUpperCase() || <User size={16} />
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: "var(--font-size-body)", fontWeight: "var(--font-weight-semibold)", color: "var(--text-primary)" }}>
                              {user.full_name}
                            </div>
                            {user.phone && (
                              <div style={{ fontSize: "var(--font-size-micro)", color: "var(--text-tertiary)" }}>
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Mail size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
                          <span style={{ fontSize: "var(--font-size-small)", color: "var(--text-secondary)" }}>
                            {user.email}
                          </span>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "2px 10px", borderRadius: "var(--radius-pill)",
                          fontSize: "var(--font-size-micro)", fontWeight: "var(--font-weight-semibold)",
                          backgroundColor: roleColor.bg, color: roleColor.text,
                        }}>
                          <Shield size={12} />
                          {roleLabel}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {user.is_active ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "var(--font-size-small)", color: "#166534" }}>
                            <CheckCircle2 size={14} />
                            Hoạt động
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "var(--font-size-small)", color: "#991b1b" }}>
                            <XCircle size={14} />
                            Vô hiệu hóa
                          </span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: "var(--font-size-small)", color: "var(--text-secondary)" }}>
                          {formatDate(user.created_at)}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <Link
                          to={`/admin/users/${user.user_id}`}
                          style={{ textDecoration: "none" }}
                          title="Xem chi tiết"
                        >
                          <Button variant="ghost" size="sm">
                            <Eye size={16} />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Loading overlay for pagination */}
      {loading && users.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-4)" }}>
          <div style={{
            width: 32, height: 32,
            border: "3px solid var(--surface-ceramic)",
            borderTopColor: "var(--green-accent)",
            borderRadius: "50%",
            animation: "btn-spin 0.7s linear infinite",
          }} />
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "var(--space-2)", marginTop: "var(--space-4)", flexWrap: "wrap" }}>
          {/* First page */}
          <Button
            variant="secondary"
            size="md"
            disabled={pagination.page <= 1}
            onClick={() => handlePageChange(1)}
            title="Trang đầu"
          >
            <ChevronsLeft size={18} />
          </Button>

          {/* Previous */}
          <Button
            variant="secondary"
            size="md"
            disabled={pagination.page <= 1}
            onClick={() => handlePageChange(pagination.page - 1)}
          >
            <ChevronLeft size={18} />
          </Button>

          {/* Page numbers */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {visiblePages.map((p, idx) =>
              p === "..." ? (
                <span key={`ellipsis-${idx}`} style={{ padding: "0 4px", color: "var(--text-tertiary)" }}>
                  &hellip;
                </span>
              ) : (
                <button
                  key={p}
                  style={{
                    minWidth: 36, height: 36, borderRadius: "var(--radius-input)",
                    border: p === pagination.page ? "2px solid var(--green-accent)" : "1px solid var(--border-color)",
                    backgroundColor: p === pagination.page ? "var(--green-light)" : "var(--surface-white)",
                    color: p === pagination.page ? "var(--green-accent)" : "var(--text-primary)",
                    fontWeight: p === pagination.page ? "var(--font-weight-bold)" : "var(--font-weight-normal)",
                    cursor: "pointer", fontSize: "var(--font-size-small)",
                    transition: "all 0.15s",
                  }}
                  onClick={() => handlePageChange(p)}
                  aria-label={`Trang ${p}`}
                  aria-current={p === pagination.page ? "page" : undefined}
                >
                  {p}
                </button>
              )
            )}
          </div>

          {/* Next */}
          <Button
            variant="secondary"
            size="md"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            <ChevronRight size={18} />
          </Button>

          {/* Last page */}
          <Button
            variant="secondary"
            size="md"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => handlePageChange(pagination.totalPages)}
            title="Trang cuối"
          >
            <ChevronsRight size={18} />
          </Button>

          <div style={{ fontSize: "var(--font-size-small)", color: "var(--text-secondary)", marginLeft: "var(--space-2)" }}>
            Trang {pagination.page} / {pagination.totalPages}
            <span style={{ marginLeft: 4 }}>
              ({pagination.total} người dùng)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Table cell styles                                                 */
/* ------------------------------------------------------------------ */
const thStyle = {
  padding: "12px 16px",
  textAlign: "left",
  fontSize: "var(--font-size-small)",
  fontWeight: "var(--font-weight-semibold)",
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "12px 16px",
  verticalAlign: "middle",
};