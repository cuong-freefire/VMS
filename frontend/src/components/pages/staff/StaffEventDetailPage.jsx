import React, { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  Calendar,
  MapPin,
  Users,
  Clock,
  Image as ImageIcon,
  ShieldCheck,
} from "lucide-react";
import { eventService } from "../../../services/event.service.js";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import Skeleton from "../../ui/Skeleton";
import ErrorState from "../../ui/ErrorState";
import EmptyState from "../../ui/EmptyState";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  StaffEventDetailPage (READ-ONLY)                                  */
/* ------------------------------------------------------------------ */
export default function StaffEventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const fetchEvent = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await eventService.getManageEventById(id);
      setEvent(res.data);
    } catch (err) {
      setLoadError(err?.message || "Không thể tải thông tin sự kiện.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  /* Loading skeleton */
  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Skeleton width="100px" height="20px" style={{ marginBottom: "var(--space-4)" }} />
        <Card>
          <Skeleton width="300px" height="28px" />
          <Skeleton width="180px" height="16px" style={{ marginTop: 8, marginBottom: 24 }} />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <Skeleton width="120px" height="14px" />
              <Skeleton width="100%" height="20px" style={{ marginTop: 4 }} />
            </div>
          ))}
        </Card>
      </div>
    );
  }

  /* Error with retry */
  if (loadError) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <button
          onClick={() => navigate(-1)}
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
          title="Không thể tải sự kiện"
          message={loadError}
          onRetry={fetchEvent}
        />
      </div>
    );
  }

  /* Not found */
  if (!event) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Card>
          <EmptyState
            icon={AlertCircle}
            title="Không tìm thấy sự kiện"
            message="Sự kiện không tồn tại hoặc đã bị xóa."
            action={
              <Link to="/staff/events" style={{ textDecoration: "none" }}>
                <Button variant="primary">
                  <ArrowLeft size={16} />
                  Quay lại danh sách
                </Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  const statusColor = STATUS_BADGE_COLORS[event.status] || STATUS_BADGE_COLORS.draft;
  const statusLabel = STATUS_LABELS[event.status] || event.status;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
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

      {/* Header */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 12,
              backgroundColor: "var(--green-light)", color: "var(--green-accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, overflow: "hidden",
            }}>
              {event.image_url ? (
                <img src={event.image_url} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <ImageIcon size={24} />
              )}
            </div>
            <div>
              <h1 style={{ fontSize: "var(--font-size-h2)", fontWeight: "var(--font-weight-semibold)", color: "var(--text-primary)", margin: 0 }}>
                {event.title}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "2px 10px", borderRadius: "var(--radius-pill)",
                  fontSize: "var(--font-size-micro)", fontWeight: "var(--font-weight-semibold)",
                  backgroundColor: statusColor.bg, color: statusColor.text,
                }}>
                  {statusLabel}
                </span>
                {event.category && (
                  <span style={{ fontSize: "var(--font-size-small)", color: "var(--text-tertiary)" }}>
                    {event.category.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Details */}
      <Card style={{ marginTop: "var(--space-4)" }}>
        <h3 style={{ fontSize: "var(--font-size-h3)", fontWeight: "var(--font-weight-semibold)", color: "var(--text-primary)", margin: "0 0 var(--space-3)" }}>
          Thông tin sự kiện
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--space-3)" }}>
          <div>
            <div style={{ fontSize: "var(--font-size-micro)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Địa điểm
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: "var(--font-size-body)", color: "var(--text-primary)" }}>
              <MapPin size={16} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
              {event.location}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-micro)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Ngày bắt đầu
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: "var(--font-size-body)", color: "var(--text-primary)" }}>
              <Calendar size={16} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
              {formatDateTime(event.start_date)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-micro)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Ngày kết thúc
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: "var(--font-size-body)", color: "var(--text-primary)" }}>
              <Calendar size={16} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
              {formatDateTime(event.end_date)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-micro)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Hạn đăng ký
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: "var(--font-size-body)", color: "var(--text-primary)" }}>
              <Clock size={16} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
              {formatDateTime(event.application_deadline)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-micro)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Sức chứa
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: "var(--font-size-body)", color: "var(--text-primary)" }}>
              <Users size={16} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
              {event.approved_participants}/{event.max_capacity}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-micro)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Người tạo
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: "var(--font-size-body)", color: "var(--text-primary)" }}>
              <ShieldCheck size={16} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
              {event.created_by?.full_name || "\u2014"}
            </div>
          </div>
        </div>

        {event.description && (
          <div style={{ marginTop: "var(--space-4)" }}>
            <div style={{ fontSize: "var(--font-size-micro)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Mô tả
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "var(--font-size-body)", color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {event.description}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}