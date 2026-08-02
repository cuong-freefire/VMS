import React, { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Calendar,
  Mail,
  Phone,
  User,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import { applicationService } from "../../../services/application.service.js";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import Skeleton from "../../ui/Skeleton";
import ErrorState from "../../ui/ErrorState";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
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
/*  ApplicationDetailPage (UC23, UC24, UC25)                          */
/* ------------------------------------------------------------------ */
export default function ApplicationDetailPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  /* Approve state */
  const [approving, setApproving] = useState(false);
  const [approveConfirm, setApproveConfirm] = useState(false);

  /* Reject state */
  const [rejecting, setRejecting] = useState(false);
  const [rejectConfirm, setRejectConfirm] = useState(false);
  const [rejectMessage, setRejectMessage] = useState("");
  const [rejectError, setRejectError] = useState(null);

  const fetchApplication = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await applicationService.getApplicationDetail(applicationId);
      setApplication(res.data);
    } catch (err) {
      setLoadError(err?.message || "Không thể tải thông tin đơn đăng ký.");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  /* Approve flow — backend requires no body */
  const handleApprove = useCallback(async () => {
    setApproving(true);
    try {
      await applicationService.approveApplication(applicationId);
      toast.success("Phê duyệt đơn đăng ký thành công");
      setApproveConfirm(false);
      fetchApplication();
    } catch (err) {
      toast.error(err?.message || "Không thể phê duyệt đơn đăng ký.");
      setApproveConfirm(false);
      fetchApplication();
    } finally {
      setApproving(false);
    }
  }, [applicationId, fetchApplication]);

  /* Reject flow — backend requires message (min 10 chars) */
  const handleReject = useCallback(async () => {
    if (!rejectMessage.trim() || rejectMessage.trim().length < 10) {
      setRejectError("Lý do từ chối phải có ít nhất 10 ký tự.");
      return;
    }
    setRejectError(null);
    setRejecting(true);
    try {
      await applicationService.rejectApplication(applicationId, { message: rejectMessage.trim() });
      toast.success("Từ chối đơn đăng ký thành công");
      setRejectConfirm(false);
      setRejectMessage("");
      fetchApplication();
    } catch (err) {
      toast.error(err?.message || "Không thể từ chối đơn đăng ký.");
      setRejectConfirm(false);
      fetchApplication();
    } finally {
      setRejecting(false);
    }
  }, [applicationId, rejectMessage, fetchApplication]);

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
          title="Không thể tải đơn đăng ký"
          message={loadError}
          onRetry={fetchApplication}
        />
      </div>
    );
  }

  /* Not found */
  if (!application) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
        <Card>
          <AlertCircle size={48} style={{ color: "var(--text-tertiary)", marginBottom: "var(--space-3)" }} />
          <h3 style={{ fontSize: "var(--font-size-h3)", color: "var(--text-primary)", margin: "0 0 8px" }}>
            Không tìm thấy đơn đăng ký
          </h3>
          <Link to="/staff/events">
            <Button variant="primary">
              <ArrowLeft size={16} />
              Quay lại danh sách sự kiện
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const statusKey = application.status?.toLowerCase();
  const statusColor = STATUS_BADGE_COLORS[statusKey] || STATUS_BADGE_COLORS.pending;
  const statusLabel = STATUS_LABELS[statusKey] || application.status;
  const isPending = statusKey === "pending";

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
              width: 56, height: 56, borderRadius: "50%",
              backgroundColor: "var(--green-accent)", color: "var(--text-on-dark)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "var(--font-size-h3)", fontWeight: "var(--font-weight-bold)",
              flexShrink: 0, overflow: "hidden",
            }}>
              {application.volunteer?.avatarUrl ? (
                <img src={application.volunteer.avatarUrl} alt={application.volunteer.fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                application.volunteer?.fullName?.[0]?.toUpperCase() || <User size={24} />
              )}
            </div>
            <div>
              <h1 style={{ fontSize: "var(--font-size-h2)", fontWeight: "var(--font-weight-semibold)", color: "var(--text-primary)", margin: 0 }}>
                {application.volunteer?.fullName || `#${application.userId}`}
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
                {application.event && (
                  <span style={{ fontSize: "var(--font-size-small)", color: "var(--text-tertiary)" }}>
                    {application.event.title}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Approve / Reject actions — only for pending */}
          {isPending && (
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
          Thông tin đơn đăng ký
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--space-3)" }}>
          <div>
            <div style={{ fontSize: "var(--font-size-micro)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Email
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: "var(--font-size-body)", color: "var(--text-primary)" }}>
              <Mail size={16} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
              {application.volunteer?.email || "\u2014"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-micro)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Số điện thoại
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: "var(--font-size-body)", color: "var(--text-primary)" }}>
              <Phone size={16} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
              {application.volunteer?.phone || "\u2014"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-micro)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Ngày đăng ký
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: "var(--font-size-body)", color: "var(--text-primary)" }}>
              <Calendar size={16} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
              {formatDateTime(application.createdAt)}
            </div>
          </div>
          {application.event && (
            <div>
              <div style={{ fontSize: "var(--font-size-micro)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Sự kiện
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: "var(--font-size-body)", color: "var(--text-primary)" }}>
                <ShieldCheck size={16} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
                {application.event.title}
              </div>
            </div>
          )}
        </div>

        {/* Skills */}
        {application.volunteer?.skills?.length > 0 && (
          <div style={{ marginTop: "var(--space-4)" }}>
            <div style={{ fontSize: "var(--font-size-micro)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Kỹ năng
            </div>
            <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", marginTop: 4 }}>
              {application.volunteer.skills.map((skill) => (
                <span
                  key={skill.id}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "2px 10px", borderRadius: "var(--radius-pill)",
                    fontSize: "var(--font-size-micro)", fontWeight: "var(--font-weight-semibold)",
                    backgroundColor: "var(--green-light)", color: "var(--green-accent)",
                  }}
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Message */}
        {application.message && (
          <div style={{ marginTop: "var(--space-4)" }}>
            <div style={{ fontSize: "var(--font-size-micro)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Lời nhắn
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "var(--font-size-body)", color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {application.message}
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
              Bạn có chắc chắn muốn phê duyệt đơn đăng ký của <strong>{application.volunteer?.fullName || `#${application.userId}`}</strong>?
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
              Bạn có chắc chắn muốn từ chối đơn đăng ký của <strong>{application.volunteer?.fullName || `#${application.userId}`}</strong>?
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
              value={rejectMessage}
              onChange={(e) => {
                setRejectMessage(e.target.value);
                if (rejectError) setRejectError(null);
              }}
              placeholder="Nhập lý do từ chối (tối thiểu 10 ký tự)"
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