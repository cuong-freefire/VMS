import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  User,
  X,
} from "lucide-react";
import { applicationService } from "../../../services/application.service.js";
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
  { value: "pending", label: "Chờ xét duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Bị từ chối" },
  { value: "cancelled", label: "Đã hủy" },
];

const STATUS_BADGE_COLORS = {
  pending: { bg: "#fef3c7", text: "#92400e" },
  approved: { bg: "#dcfce7", text: "#166534" },
  rejected: { bg: "#fee2e2", text: "#991b1b" },
  cancelled: { bg: "#f3f4f6", text: "#374151" },
};

const STATUS_LABELS = {
  pending: "Chờ xét duyệt",
  approved: "Đã duyệt",
  rejected: "Bị từ chối",
  cancelled: "Đã hủy",
};

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
/*  ApplicationListPage (UC22)                                        */
/* ------------------------------------------------------------------ */
export default function ApplicationListPage() {
  const { eventId } = useParams();

  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusValue, setStatusValue] = useState("");
  const [page, setPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState(0);

  /* Track active filter count */
  React.useEffect(() => {
    let count = 0;
    if (statusValue) count++;
    setActiveFilters(count);
  }, [statusValue]);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cleanParams = {};
      if (statusValue) cleanParams.status = statusValue;
      cleanParams.page = page;
      cleanParams.limit = 20;

      const response = await applicationService.getApplicationsByEvent(eventId, cleanParams);
      setApplications(response.data?.applications || []);
      setPagination(response.data?.pagination || null);
    } catch (err) {
      setError(err?.message || "Không thể tải danh sách đơn đăng ký.");
      setApplications([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [eventId, statusValue, page]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleStatusChange = useCallback((e) => {
    const val = e.target.value;
    setStatusValue(val);
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setStatusValue("");
    setPage(1);
  }, []);

  const handlePageChange = useCallback((p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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
  if (loading && applications.length === 0) {
    return (
      <div style={{ maxWidth: "var(--max-content-width)", margin: "0 auto" }}>
        <Skeleton width="100px" height="20px" style={{ marginBottom: "var(--space-4)" }} />
        <div style={{ marginBottom: "var(--space-4)" }}>
          <Skeleton width="300px" height="32px" />
          <Skeleton width="200px" height="16px" style={{ marginTop: 8 }} />
        </div>
        <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-4)", flexWrap: "wrap" }}>
          <Skeleton width="180px" height="40px" />
        </div>
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
  if (error && applications.length === 0) {
    return (
      <div style={{ maxWidth: "var(--max-content-width)", margin: "0 auto" }}>
        <button
          onClick={() => window.history.back()}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer",
            fontSize: "var(--font-size-body)", color: "var(--text-secondary)",
            marginBottom: "var(--space-4)", padding: 0,
          }}
        >
          <ArrowLeft size={18} />
          Quay lại
        </button>
        <ErrorState
          icon={AlertCircle}
          title="Không thể tải danh sách đơn đăng ký"
          message={error}
          onRetry={fetchApplications}
        />
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Render: Main content                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div style={{ maxWidth: "var(--max-content-width)", margin: "0 auto" }}>
      {/* Back button */}
      <button
        onClick={() => window.history.back()}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          fontSize: "var(--font-size-body)", color: "var(--text-secondary)",
          marginBottom: "var(--space-4)", padding: 0,
        }}
      >
        <ArrowLeft size={18} />
        Quay lại
      </button>

      {/* Page heading */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <div>
          <h1 style={{ fontSize: "var(--font-size-h1)", fontWeight: "var(--font-weight-semibold)", color: "var(--text-primary)", margin: 0 }}>
            Đơn đăng ký
          </h1>
          <p style={{ fontSize: "var(--font-size-small)", color: "var(--text-secondary)", margin: "4px 0 0" }}>
            Xem và xét duyệt các đơn đăng ký của sự kiện
          </p>
        </div>
      </div>

      {/* Filters bar */}
      <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-4)", flexWrap: "wrap", alignItems: "center" }}>
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
      {!loading && applications.length === 0 && (
        <Card>
          <EmptyState
            icon={AlertCircle}
            title="Không tìm thấy đơn đăng ký"
            message="Hiện không có đơn đăng ký nào phù hợp với tiêu chí tìm kiếm."
          />
        </Card>
      )}

      {/* Application table */}
      {applications.length > 0 && (
        <Card padding="0" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--surface-ceramic)", borderBottom: "2px solid var(--border-color)" }}>
                  <th style={thStyle}>Tình nguyện viên</th>
                  <th style={thStyle}>Ngày đăng ký</th>
                  <th style={thStyle}>Trạng thái</th>
                  <th style={{ ...thStyle, textAlign: "center", width: 80 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const statusKey = app.status?.toLowerCase();
                  const statusColor = STATUS_BADGE_COLORS[statusKey] || STATUS_BADGE_COLORS.pending;
                  const statusLabel = STATUS_LABELS[statusKey] || app.status;
                  return (
                    <tr
                      key={app.id}
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
                            {app.volunteer?.avatarUrl ? (
                              <img src={app.volunteer.avatarUrl} alt={app.volunteer.fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              app.volunteer?.fullName?.[0]?.toUpperCase() || <User size={16} />
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: "var(--font-size-body)", fontWeight: "var(--font-weight-semibold)", color: "var(--text-primary)" }}>
                              {app.volunteer?.fullName || `#${app.userId}`}
                            </div>
                            {app.message && (
                              <div style={{ fontSize: "var(--font-size-micro)", color: "var(--text-tertiary)", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {app.message}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: "var(--font-size-small)", color: "var(--text-secondary)" }}>
                          {formatDate(app.createdAt)}
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
                          to={`/staff/events/${eventId}/applications/${app.id}`}
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
      {loading && applications.length > 0 && (
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
              ({pagination.total} đơn đăng ký)
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