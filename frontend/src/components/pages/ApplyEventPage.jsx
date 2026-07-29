import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { MapPin, Calendar, Clock, Users, ArrowLeft, Send } from "lucide-react";
import { useAuth } from "../../contexts/authContext.context";
import { applicationService } from "../../services/application.service";
import { eventService } from "../../services/event.service";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Skeleton from "../ui/Skeleton";
import ErrorState from "../ui/ErrorState";
import LoadingSpinner from "../ui/LoadingSpinner";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function formatDate(iso) {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ------------------------------------------------------------------ */
/*  ApplyEventPage                                                     */
/* ------------------------------------------------------------------ */
export default function ApplyEventPage() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchEvent() {
      try {
        const res = await eventService.getEventDetail(eventId);
        if (!cancelled) setEvent(res.data?.data || res.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Không thể tải thông tin sự kiện.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchEvent();
    return () => { cancelled = true; };
  }, [eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await applicationService.submitApplication(Number(eventId), message || undefined);
      toast.success("Đăng ký sự kiện thành công!");
      navigate(`/volunteer/events/${eventId}`);
    } catch (err) {
      const msg = err.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <div className="container py-5" style={{ maxWidth: 700 }}>
        <Skeleton height={32} width="60%" style={{ marginBottom: 16 }} />
        <Skeleton height={200} style={{ marginBottom: 16 }} />
        <Skeleton height={120} />
      </div>
    );
  }

  /* ---------- Error ---------- */
  if (error) {
    return (
      <div className="container py-5" style={{ maxWidth: 700 }}>
        <ErrorState
          title="Lỗi tải dữ liệu"
          message={error}
          actionLabel="Quay lại"
          onAction={() => navigate(-1)}
        />
      </div>
    );
  }

  /* ---------- No event ---------- */
  if (!event) {
    return (
      <div className="container py-5" style={{ maxWidth: 700 }}>
        <ErrorState
          title="Không tìm thấy sự kiện"
          message="Sự kiện không tồn tại hoặc đã bị gỡ bỏ."
          actionLabel="Quay lại"
          onAction={() => navigate(-1)}
        />
      </div>
    );
  }

  return (
    <div className="container py-5" style={{ maxWidth: 700 }}>
      {/* Back button */}
      <button
        className="btn btn-link text-decoration-none p-0 mb-3 d-inline-flex align-items-center gap-1"
        onClick={() => navigate(-1)}
        style={{ color: "var(--bs-primary, #0d6efd)" }}
      >
        <ArrowLeft size={18} />
        Quay lại
      </button>

      <h4 className="mb-4">Đăng ký tham gia sự kiện</h4>

      {/* Event summary card */}
      <Card className="mb-4">
        <h5 className="mb-3">{event.title || event.name}</h5>
        <div className="d-flex flex-column gap-2 text-secondary" style={{ fontSize: "0.9rem" }}>
          <div className="d-flex align-items-center gap-2">
            <MapPin size={16} />
            <span>{event.location || "Chưa cập nhật địa điểm"}</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Calendar size={16} />
            <span>{formatDate(event.startDate)}</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Clock size={16} />
            <span>
              {formatTime(event.startDate)}
              {event.endDate && ` - ${formatTime(event.endDate)}`}
            </span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Users size={16} />
            <span>
              {event.currentParticipants ?? 0} / {event.maxCapacity ?? "?"} người đã đăng ký
            </span>
          </div>
        </div>
      </Card>

      {/* Application form */}
      <Card>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-medium">
              Người đăng ký
            </label>
            <input
              type="text"
              className="form-control"
              value={user?.full_name || user?.email || ""}
              disabled
              readOnly
            />
          </div>

          <div className="mb-4">
            <label htmlFor="apply-message" className="form-label fw-medium">
              Lời nhắn
            </label>
            <textarea
              id="apply-message"
              className="form-control"
              rows={4}
              maxLength={500}
              placeholder="Chia sẻ lý do bạn muốn tham gia sự kiện này..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="form-text text-end">{message.length}/500</div>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <Button
              type="button"
              variant="outline-secondary"
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className="d-inline-flex align-items-center gap-1"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Gửi đơn đăng ký
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}