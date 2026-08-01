import React, { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Eye,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  MapPin,
  Users,
  X,
  ListFilter,
} from "lucide-react";
import useManageEventList from "../../../hooks/useManageEventList";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import Skeleton from "../../ui/Skeleton";
import EmptyState from "../../ui/EmptyState";
import ErrorState from "../../ui/ErrorState";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "draft", label: "Bản nháp" },
  { value: "pending_approval", label: "Chờ phê duyệt" },
  { value: "published", label: "Đã công bố" },
  { value: "rejected", label: "Bị từ chối" },
  { value: "in_progress", label: "Đang diễn ra" },
  { value: "completed", label: "Đã kết thúc" },
  { value: "cancelled", label: "Đã hủy" },
];

const STATUS_BADGE_COLORS = {
  draft: { bg: "#f3f4f6", text: "#374151" },
  pending_approval: { bg: "#fef3c7", text: "#92400e" },
  published: { bg: "#dbeafe", text: "#1e40af" },
  rejected: { bg: "#fee2e2", text: "#991b1b" },
  in_progress: { bg: "#dcfce7", text: "#166534" },
  completed: { bg: "#f3f4f6", text: "#374151" },
  cancelled: { bg: "#fee2e2", text: "#991b1b" },
};

const STATUS_LABELS = {
  draft: "Bản nháp",
  pending_approval: "Chờ phê duyệt",
  published: "Đã công bố",
  rejected: "Bị từ chối",
  in_progress: "Đang diễn ra",
  completed: "Đã kết thúc",
  cancelled: "Đã hủy",
};

const SORT_OPTIONS = [
  { value: "created_at:desc", label: "Mới nhất" },
  { value: "created_at:asc", label: "Cũ nhất" },
  { value: "start_date:asc", label: "Ngày bắt đầu tăng dần" },
  { value: "start_date:desc", label: "Ngày bắt đầu giảm dần" },
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
/*  ManagerEventListPage (UC67)                                       */
/* ------------------------------------------------------------------ */
export default function ManagerEventListPage() {
  const { events, pagination, loading, error, setParams, refetch } =
    useManageEventList();

  /* Local state */
  const [searchInput, setSearchInput] = useState("");
  const [statusValue, setStatusValue] = useState("");
  const [sortValue, setSortValue] = useState("created_at:desc");
  const [activeFilters, setActiveFilters] = useState(0);

  /* Track active filter count */
  React.useEffect(() => {
    let count = 0;
    if (statusValue) count++;
    setActiveFilters(count);
  }, [statusValue]);

  /* Search is debounced inside useManageEventList */
  const handleSearchChange = useCallback(
    (e) => {
      const val = e.target.value;
      setSearchInput(val);
      setParams({ search: val });
    },
    [setParams]
  );

  const handleStatusChange = useCallback(
    (e) => {
      const val = e.target.value;
      setStatusValue(val);
      setParams({ status: val || undefined });
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

  const handleClearFilters = useCallback(() => {
    setSearchInput("");
    setStatusValue("");
    setSortValue("created_at:desc");
    setParams({
      search: "",
      status: undefined,
      sort: "created_at:desc",
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
  if (loading && events.length === 0) {
    return (
      <div style={{ maxWidth: "var(--max-content-width)", margin: "0 auto" }}>
        <div style={{ marginBottom: "var(--space-4)" }}>
          <Skeleton width="300px" height="32px" />
          <Skeleton width="200px" height="16px" style={{ marginTop: 8 }} />
        </div>
        <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-4)", flexWrap: "wrap" }}>
          <Skeleton width="280px" height="40px" />
          <Skeleton width="180px" height="40px" />
          <Skeleton width="180px" height="40px" />
        </div>
        <Card>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ display: "flex", gap: 16, padding: "12px 0", borderBottom: i < 7 ? "1px solid var(--surface-ceramic)" : "none" }}>
              <Skeleton width="40px" height="40px" style={{ borderRadius: 8, flexShrink: 0 }} />
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
  if (error && events.length === 0) {
    return (
      <div style={{ maxWidth: "var(--max-content-width)", margin: "0 auto" }}>
        <ErrorState
          icon={AlertCircle}
          title="Không thể tải danh sách sự kiện"
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
    <div style={{ maxWidth: "var(--max-content-width)", margin: "0 auto" }}>
      {/* Page heading */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <div>
          <h1 style={{ fontSize: "var(--font-size-h1)", fontWeight: "var(--font-weight-semibold)", color: "var(--text-primary)", margin: 0 }}>
            Phê duyệt Sự kiện
          </h1>
          <p style={{ fontSize: "var(--font-size-small)", color: "var(--text-secondary)", margin: "4px 0 0" }}>
            Xem và phê duyệt các sự kiện chờ phê duyệt
          </p>
        </div>
      </div>

      {/* Filters bar */}
      <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-4)", flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 280px", minWidth: 200 }}>
          <Search size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
          <input
            type="text"
            className="input-vms"
            style={{ paddingLeft: 40, width: "100%" }}
            placeholder="Tìm kiếm theo tên hoặc địa điểm..."
            value={searchInput}
            onChange={handleSearchChange}
          />
        </div>

        {/* Status filter */}
        <select
          className="input-vms"
          style={{ minWidth: 170 }}
          value={statusValue}
          onChange={handleStatusChange}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <div style={{ position: "relative", minWidth: 190 }}>
          <ListFilter size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
          <select
            className="input-vms"
            style={{ minWidth: 190, paddingLeft: 36 }}
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
      {!loading && events.length === 0 && (
        <Card>
          <EmptyState
            icon={AlertCircle}
            title="Không tìm thấy sự kiện"
            message="Hiện không có sự kiện nào phù hợp với tiêu chí tìm kiếm."
          />
        </Card>
      )}

      {/* Event table */}
      {events.length > 0 && (
        <Card padding="0" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--surface-ceramic)", borderBottom: "2px solid var(--border-color)" }}>
                  <th style={thStyle}>Sự kiện</th>
                  <th style={thStyle}>Địa điểm</th>
                  <th style={thStyle}>Ngày bắt đầu</th>
                  <th style={thStyle}>Sức chứa</th>
                  <th style={thStyle}>Trạng thái</th>
                  <th style={{ ...thStyle, textAlign: "center", width: 80 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const statusColor = STATUS_BADGE_COLORS[event.status] || STATUS_BADGE_COLORS.draft;
                  const statusLabel = STATUS_LABELS[event.status] || event.status;
                  return (
                    <tr
                      key={event.event_id}
                      style={{ borderBottom: "1px solid var(--surface-ceramic)", transition: "background-color 0.15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--surface-ceramic)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 8,
                            backgroundColor: "var(--green-light)", color: "var(--green-accent)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0, overflow: "hidden",
                          }}>
                            {event.image_url ? (
                              <img src={event.image_url} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <Calendar size={18} />
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: "var(--font-size-body)", fontWeight: "var(--font-weight-semibold)", color: "var(--text-primary)" }}>
                              {event.title}
                            </div>
                            {event.category && (
                              <div style={{ fontSize: "var(--font-size-micro)", color: "var(--text-tertiary)" }}>
                                {event.category.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <MapPin size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
                          <span style={{ fontSize: "var(--font-size-small)", color: "var(--text-secondary)" }}>
                            {event.location}
                          </span>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--font-size-small)", color: "var(--text-secondary)" }}>
                          <Calendar size={14} style={{ color: "var(--text-tertiary)" }} />
                          {formatDate(event.start_date)}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--font-size-small)", color: "var(--text-secondary)" }}>
                          <Users size={14} style={{ color: "var(--text-tertiary)" }} />
                          {event.approved_participants}/{event.max_capacity}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "2px 10px", borderRadius: "var(--radius-pill)",
                          fontSize: "var(--font-size-micro)", fontWeight: "var(--font-weight-semibold)",
                          backgroundColor: statusColor.bg, color: statusColor.text,
                        }}>
                          {statusLabel}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <Link
                          to={`/manager/events/${event.event_id}`}
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
      {loading && events.length > 0 && (
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
          <Button
            variant="secondary"
            size="md"
            disabled={pagination.page <= 1}
            onClick={() => handlePageChange(1)}
            title="Trang đầu"
          >
            <ChevronsLeft size={18} />
          </Button>

          <Button
            variant="secondary"
            size="md"
            disabled={pagination.page <= 1}
            onClick={() => handlePageChange(pagination.page - 1)}
          >
            <ChevronLeft size={18} />
          </Button>

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

          <Button
            variant="secondary"
            size="md"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            <ChevronRight size={18} />
          </Button>

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
              ({pagination.total} sự kiện)
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