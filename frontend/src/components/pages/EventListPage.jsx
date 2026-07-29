import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import {
  MapPin,
  Calendar,
  Users,
  Tag,
  Search,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  ListFilter,
  DollarSign,
  X,
  UsersRound,
} from "lucide-react";
import useEventList from "../../hooks/useEventList";
import { categoryService } from "../../services/category.service";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Skeleton from "../ui/Skeleton";
import EmptyState from "../ui/EmptyState";
import ErrorState from "../ui/ErrorState";
import "./EventListPage.css";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
const STATUS_LABELS = {
  PUBLISHED: "Sắp diễn ra",
  IN_PROGRESS: "Đang diễn ra",
  COMPLETED: "Đã kết thúc",
};

const STATUS_COLORS = {
  PUBLISHED: { bg: "#dbeafe", text: "#1e40af" },
  IN_PROGRESS: { bg: "#dcfce7", text: "#166534" },
  COMPLETED: { bg: "#f3f4f6", text: "#374151" },
};

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "upcoming", label: "Sắp diễn ra" },
];

const PAID_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "true", label: "Có phí" },
  { value: "false", label: "Miễn phí" },
];

const SLOTS_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "true", label: "Còn chỗ" },
  { value: "false", label: "Đã đầy" },
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

function formatDateTime(iso) {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "\u2014";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function formatPrice(price) {
  if (price == null || price === 0) return null;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

/* ------------------------------------------------------------------ */
/*  EventCard Sub-component                                           */
/* ------------------------------------------------------------------ */
function EventCard({ event }) {
  const statusColor = STATUS_COLORS[event.status] || STATUS_COLORS.PUBLISHED;
  const statusLabel = STATUS_LABELS[event.status] || event.status;
  const priceLabel = formatPrice(event.price);
  
  // Calculate capacity percentage
  const maxCap = event.maxCapacity || 1;
  const approvedCount = event.approvedParticipants || 0;
  const percentFilled = Math.min(100, Math.round((approvedCount / maxCap) * 100));

  return (
    <Link to={`/volunteer/events/${event.id}`} className="event-card-link">
      <Card className="hover-card event-card" padding="0">
        {/* Banner image */}
        <div className="event-card-image-wrapper">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="event-card-image"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <div className="event-card-image-placeholder">
              <Calendar size={36} />
            </div>
          )}
          {/* Status badge */}
          <span
            className="event-card-status"
            style={{
              backgroundColor: statusColor.bg,
              color: statusColor.text,
            }}
          >
            {statusLabel}
          </span>
          {/* Full badge */}
          {event.isFull && (
            <span className="event-card-full-badge">Đã đầy</span>
          )}
          {/* Price badge */}
          {priceLabel && (
            <span className="event-card-price-badge">
              {priceLabel}
            </span>
          )}
        </div>

        {/* Card body */}
        <div className="event-card-body">
          {/* Category Tag at Top */}
          {event.category && (
            <span className="event-card-category-tag">
              {event.category.name}
            </span>
          )}

          <h3 className="event-card-title">{event.title}</h3>

          <div className="event-card-meta">
            <div className="event-card-meta-row">
              <Calendar size={14} />
              <span>{formatDateTime(event.startDate)}</span>
            </div>
            <div className="event-card-meta-row">
              <MapPin size={14} />
              <span className="event-card-meta-truncate">{event.location}</span>
            </div>
            
            {/* Progress bar capacity indicator */}
            <div className="event-card-capacity-section">
              <div className="event-card-capacity-label">
                <span className="event-card-capacity-users">
                  <Users size={14} />
                  <strong>{approvedCount}</strong>/{maxCap} chỗ
                </span>
                <span className="event-card-capacity-percent">
                  {percentFilled}%
                </span>
              </div>
              <div className="event-card-progress-bar">
                <div 
                  className={`event-card-progress-fill${event.isFull ? " full" : ""}`} 
                  style={{ width: `${percentFilled}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

EventCard.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    status: PropTypes.string,
    imageUrl: PropTypes.string,
    isFull: PropTypes.bool,
    price: PropTypes.number,
    startDate: PropTypes.string,
    location: PropTypes.string,
    approvedParticipants: PropTypes.number,
    maxCapacity: PropTypes.number,
    remainingSlots: PropTypes.number,
    category: PropTypes.shape({
      name: PropTypes.string,
    }),
  }).isRequired,
};

/* ------------------------------------------------------------------ */
/*  EventListPage                                                     */
/* ------------------------------------------------------------------ */
export default function EventListPage() {
  const { events, pagination, loading, error, setParams, refetch } =
    useEventList();

  /* Local state */
  const [searchInput, setSearchInput] = useState("");
  const [sortValue, setSortValue] = useState("newest");
  const [categoryValue, setCategoryValue] = useState("");
  const [paidValue, setPaidValue] = useState("");
  const [slotsValue, setSlotsValue] = useState("");
  const [categories, setCategories] = useState([]);
  const [activeFilters, setActiveFilters] = useState(0);

  /* Fetch categories on mount */
  useEffect(() => {
    let cancelled = false;
    categoryService
      .fetchEventTypes()
      .then((res) => {
        if (!cancelled) {
          setCategories(res.data?.categories || []);
        }
      })
      .catch((err) => {
        console.error("Lỗi khi tải danh sách thể loại:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* Track active filter count */
  useEffect(() => {
    let count = 0;
    if (categoryValue) count++;
    if (paidValue) count++;
    if (slotsValue) count++;
    setActiveFilters(count);
  }, [categoryValue, paidValue, slotsValue]);

  /* Search is debounced inside useEventList */
  const handleSearchChange = useCallback(
    (e) => {
      const val = e.target.value;
      setSearchInput(val);
      setParams({ search: val });
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

  const handleCategoryChange = useCallback(
    (e) => {
      const val = e.target.value;
      setCategoryValue(val);
      setParams({ category: val || undefined });
    },
    [setParams]
  );

  const handlePaidChange = useCallback(
    (e) => {
      const val = e.target.value;
      setPaidValue(val);
      setParams({ isPaid: val === "" ? undefined : val === "true" });
    },
    [setParams]
  );

  const handleSlotsChange = useCallback(
    (e) => {
      const val = e.target.value;
      setSlotsValue(val);
      setParams({ hasSlots: val === "" ? undefined : val === "true" });
    },
    [setParams]
  );

  const handleClearFilters = useCallback(() => {
    setSearchInput("");
    setCategoryValue("");
    setPaidValue("");
    setSlotsValue("");
    setSortValue("newest");
    setParams({
      search: "",
      category: undefined,
      isPaid: undefined,
      hasSlots: undefined,
      sort: "newest",
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
      <div className="event-list-page">
        <div className="event-list-container">
          {/* Skeleton filters */}
          <div className="event-list-filters">
            <Skeleton width="100%" height="48px" />
            <Skeleton width="180px" height="48px" />
          </div>
          {/* Skeleton grid */}
          <div className="event-list-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <Skeleton width="100%" height="200px" />
                <div style={{ padding: "var(--space-4)" }}>
                  <Skeleton width="80%" height="24px" />
                  <Skeleton count={3} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Render: Error                                                     */
  /* ------------------------------------------------------------------ */
  if (error && events.length === 0) {
    return (
      <div className="event-list-page">
        <div className="event-list-container">
          <ErrorState
            icon={AlertCircle}
            title="Không thể tải danh sách sự kiện"
            message={error}
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Render: Main content                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div className="event-list-page">
      <div className="event-list-container">
        {/* Page heading */}
        <div className="event-list-heading">
          <h1 className="event-list-title">Danh sách Sự kiện</h1>
          <p className="event-list-subtitle">
            Khám phá và đăng ký tham gia các sự kiện tình nguyện
          </p>
        </div>

        {/* Filters bar */}
        <div className="event-list-filters">
          {/* Search */}
          <div className="event-list-search-wrapper">
            <Search size={20} className="event-list-search-icon" />
            <input
              type="text"
              className="event-list-search-input"
              placeholder="Tìm kiếm sự kiện..."
              value={searchInput}
              onChange={handleSearchChange}
            />
          </div>

          {/* Category filter */}
          <div className="event-list-filter-group">
            <Tag size={16} className="event-list-filter-icon" />
            <select
              className="event-list-filter-select"
              value={categoryValue}
              onChange={handleCategoryChange}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Paid/Free filter */}
          <div className="event-list-filter-group">
            <DollarSign size={16} className="event-list-filter-icon" />
            <select
              className="event-list-filter-select"
              value={paidValue}
              onChange={handlePaidChange}
            >
              {PAID_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Availability filter */}
          <div className="event-list-filter-group">
            <UsersRound size={16} className="event-list-filter-icon" />
            <select
              className="event-list-filter-select"
              value={slotsValue}
              onChange={handleSlotsChange}
            >
              {SLOTS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filters row 2 — Sort + Clear */}
        <div className="event-list-filters event-list-filters-row2">
          {/* Sort */}
          <div className="event-list-sort-wrapper">
            <ListFilter size={18} className="event-list-sort-icon" />
            <select
              className="event-list-sort-select"
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
              className="event-list-clear-filters"
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
              icon={SlidersHorizontal}
              title="Không tìm thấy sự kiện"
              message="Hiện không có sự kiện nào phù hợp với tiêu chí tìm kiếm."
            />
          </Card>
        )}

        {/* Event grid */}
        <div className="event-list-grid">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {/* Loading overlay for pagination */}
        {loading && events.length > 0 && (
          <div className="event-list-loading-overlay">
            <div className="event-list-spinner" />
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="event-list-pagination">
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
            <div className="event-list-pagination-pages">
              {visiblePages.map((p, idx) =>
                p === "..." ? (
                  <span key={`ellipsis-${idx}`} className="event-list-page-ellipsis">
                    &hellip;
                  </span>
                ) : (
                  <button
                    key={p}
                    className={`event-list-page-btn${p === pagination.page ? " active" : ""
                      }`}
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

            <div className="event-list-pagination-info">
              Trang {pagination.page} / {pagination.totalPages}
              <span className="event-list-pagination-total">
                ({pagination.total} sự kiện)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}