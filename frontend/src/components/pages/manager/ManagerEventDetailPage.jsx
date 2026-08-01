import React, { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Calendar,
  MapPin,
  Users,
  Clock,
  Image as ImageIcon,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import { eventService } from "../../../services/event.service.js";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import Skeleton from "../../ui/Skeleton";
import ErrorState from "../../ui/ErrorState";

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
/*  ManagerEventDetailPage (UC68, UC69, UC70)                         */
/* ------------------------------------------------------------------ */
export default function ManagerEventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  /* Approve state */
  const [approving, setApproving] = useState(false);
  const [approveConfirm, setApproveConfirm] = useState(false);

  /* Reject state */
  const [rejecting, setRejecting] = useState(false);
  const [rejectConfirm, setRejectConfirm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectError, setRejectError] = useState(null);

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

  /* Approve flow — backend requires no body */
  const handleApprove = useCallback(async () => {
    setApproving(true);
    try {
      await eventService.approveEvent(id);
      toast.success("Phê duyệt sự kiện thành công");
      setApproveConfirm(false);
      fetchEvent();
    } catch (err) {
      toast.error(err?.message || "Không thể phê duyệt sự kiện.");
      setApproveConfirm(false);
    } finally {
      setApproving(false);
    }
  }, [id, fetchEvent]);

  /* Reject flow — backend requires rejection_reason */
  const handleReject = useCallback(async () => {
    if (!rejectionReason.trim()) {
      setRejectError("Vui lòng cung cấp lý do từ chối.");
      return;
    }
    setRejectError(null);
    setRejecting(true);
    try {
      await eventService.rejectEvent(id, { rejection_reason: rejectionReason.trim() });
      toast.success("Từ chối sự kiện thành công");
      setRejectConfirm(false);
      setRejectionReason("");
      fetchEvent();
    } catch (err) {
      toast.error(err?.message || "Không thể từ chối sự kiện.");
      setRejectConfirm(false);
    } finally {
      setRejecting(false);
    }
  }, [id, rejectionReason, fetchEvent]);

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
      <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
        <Card>
          <AlertCircle size={48} style={{ color: "var(--text-tertiary)", marginBottom: "var(--space-3)" }} />
          <h3 style={{ fontSize: "var(--font-size-h3)", color: "var(--text-primary)", margin: "0 0 8px" }}>
            Không tìm thấy sự kiện
          </h3>
          <Link to="/manager/events">
            <Button variant="primary">
              <ArrowLeft size={16} />
              Quay lại danh sách
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const statusColor = STATUS_BADGE_COLORS[event.status] || STATUS_BADGE_COLORS.draft;
  const statusLabel = STATUS_LABELS[event.status] || event.status;
  const isPendingApproval = event.status === "pending_approval";

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

          {/* Approve / Reject actions — only for pending_approval */}
          {isPendingApproval && (
            <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
              <Button variant="primary" onClick={() => setApproveConfirm(true)}>
                <CheckCircle2 size={16} />
                Phê duyệt
              </Button>
              <Button variant="danger" onClick={() => setRejectConfirm(true)}>
                <XCircle size={16} />
                Từ chối
              </Button>
            </div>
          )}
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

      {/* ----- Approve Confirmation Dialog ----- */}
      {approveConfirm && (
        <div style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: "var(--surface-white)", borderRadius: "var(--radius-lg)",
            padding: "var(--space-6)", maxWidth: 440, width: "100%",
            margin: "0 var(--space-4)", position: "relative",
          }}>
            <h3 style={{ fontSize: "var(--font-size-h3)", fontWeight: "var(--font-weight-semibold)", color: "var(--text-primary)", marginBottom: "var(--space-3)" }}>
              Xác nhận phê duyệt
            </h3>
            <p style={{ fontSize: "var(--font-size-body)", color: "var(--text-secondary)", marginBottom: "var(--space-4)", lineHeight: 1.6 }}>
              Bạn có chắc chắn muốn phê duyệt sự kiện <strong>{event.title}</strong>? Sự kiện sẽ được công bố.
            </p>
            <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
              <Button variant="secondary" onClick={() => setApproveConfirm(false)} disabled={approving}>
                Hủy
              </Button>
              <Button variant="primary" onClick={handleApprove} disabled={approving}>
                {approving ? "Đang phê duyệt..." : "Xác nhận phê duyệt"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ----- Reject Confirmation Dialog ----- */}
      {rejectConfirm && (
        <div style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: "var(--surface-white)", borderRadius: "var(--radius-lg)",
            padding: "var(--space-6)", maxWidth: 440, width: "100%",
            margin: "0 var(--space-4)", position: "relative",
          }}>
            <h3 style={{ fontSize: "var(--font-size-h3)", fontWeight: "var(--font-weight-semibold)", color: "var(--text-primary)", marginBottom: "var(--space-3)" }}>
              Xác nhận từ chối
            </h3>
            <p style={{ fontSize: "var(--font-size-body)", color: "var(--text-secondary)", marginBottom: "var(--space-3)", lineHeight: 1.6 }}>
              Bạn có chắc chắn muốn từ chối sự kiện <strong>{event.title}</strong>?
            </p>
            <label
              style={{
                display: "block", fontSize: "var(--font-size-small)",
                fontWeight: "var(--font-weight-semibold)", color: "var(--text-primary)",
                marginBottom: "var(--space-1)",
              }}
            >
              Lý do từ chối *
            </label>
            <textarea
              className={`input-vms ${rejectError ? "input-error" : ""}`}
              rows={4}
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                if (rejectError) setRejectError(null);
              }}
              placeholder="Nhập lý do từ chối (bắt buộc)"
              style={{ width: "100%", resize: "vertical" }}
            />
            {rejectError && (
              <p style={{ margin: "4px 0 0", fontSize: "var(--font-size-small)", color: "var(--color-error)" }}>
                {rejectError}
              </p>
            )}
            <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", marginTop: "var(--space-4)" }}>
              <Button variant="secondary" onClick={() => setRejectConfirm(false)} disabled={rejecting}>
                Hủy
              </Button>
              <Button variant="danger" onClick={handleReject} disabled={rejecting}>
                {rejecting ? "Đang từ chối..." : "Xác nhận từ chối"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}