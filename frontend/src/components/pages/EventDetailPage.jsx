import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
    MapPin,
    Calendar,
    Clock,
    Users,
    Tag,
    User,
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Clock4,
    Ban,
} from "lucide-react";
import useEventDetail from "../../hooks/useEventDetail";
import { useAuth } from "../../contexts/authContext.context";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Skeleton from "../ui/Skeleton";
import EmptyState from "../ui/EmptyState";
import ErrorState from "../ui/ErrorState";
import LoadingSpinner from "../ui/LoadingSpinner";

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

const APP_STATUS_LABELS = {
    PENDING: "Chờ duyệt",
    APPROVED: "Đã duyệt",
    REJECTED: "Từ chối",
    CANCELLED: "Đã hủy",
};

const APP_STATUS_COLORS = {
    PENDING: { bg: "#fef3c7", text: "#92400e" },
    APPROVED: { bg: "#dbeafe", text: "#1e40af" },
    REJECTED: { bg: "#fee2e2", text: "#991b1b" },
    CANCELLED: { bg: "#f3f4f6", text: "#374151" },
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
/*  Info Row                                                          */
/* ------------------------------------------------------------------ */
function InfoRow({ icon: Icon, label, children }) {
    return (
        <div style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            marginBottom: "var(--space-3)",
        }}>
            <Icon size={20} style={{ color: "var(--text-tertiary)", flexShrink: 0, marginTop: 2 }} />
            <div>
                <div style={{
                    fontSize: "var(--font-size-micro)", color: "var(--text-secondary)",
                    marginBottom: 2,
                }}>
                    {label}
                </div>
                <div style={{ fontSize: "var(--font-size-body)", color: "var(--text-primary)" }}>
                    {children}
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Application Status Banner                                         */
/* ------------------------------------------------------------------ */
function ApplicationStatusBanner({ application }) {
    if (!application) return null;

    const status = application.status;
    const color = APP_STATUS_COLORS[status] || APP_STATUS_COLORS.PENDING;
    const label = APP_STATUS_LABELS[status] || status;

    const StatusIcon = {
        PENDING: Clock4,
        APPROVED: CheckCircle2,
        REJECTED: XCircle,
        CANCELLED: Ban,
    }[status] || Clock4;

    return (
        <div style={{
            backgroundColor: color.bg,
            borderRadius: "var(--radius-md)",
            padding: "var(--space-3) var(--space-4)",
            marginBottom: "var(--space-4)",
            display: "flex",
            alignItems: "center",
            gap: 10,
        }}>
            <StatusIcon size={20} style={{ color: color.text }} />
            <span style={{
                fontSize: "var(--font-size-body)",
                fontWeight: "var(--font-weight-semibold)",
                color: color.text,
            }}>
                Trạng thái đơn: {label}
            </span>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  EventDetailPage                                                   */
/* ------------------------------------------------------------------ */
export default function EventDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { event, loading, error, refetch } = useEventDetail(id);

    if (loading) {
        return (
            <div style={{
                maxWidth: "var(--max-content-width)", margin: "var(--space-6) auto",
                padding: "0 var(--space-4)",
            }}>
                <div style={{ marginBottom: "var(--space-4)" }}>
                    <Skeleton width="80px" height="30px" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-4)" }}>
                    <Card>
                        <Skeleton count={8} />
                    </Card>
                    <div>
                        <Card>
                            <Skeleton count={5} />
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                maxWidth: "var(--max-content-width)", margin: "var(--space-6) auto",
                padding: "0 var(--space-4)",
            }}>
                <ErrorState
                    icon={AlertCircle}
                    title="Không thể tải thông tin sự kiện"
                    message={error}
                    onRetry={refetch}
                />
            </div>
        );
    }

    if (!event) {
        return (
            <div style={{
                maxWidth: "var(--max-content-width)", margin: "var(--space-6) auto",
                padding: "0 var(--space-4)",
            }}>
                <Card>
                    <EmptyState
                        icon={AlertCircle}
                        title="Không tìm thấy sự kiện"
                        message="Sự kiện không tồn tại hoặc đã bị gỡ xuống."
                    />
                </Card>
            </div>
        );
    }

    const statusColor = STATUS_COLORS[event.status] || STATUS_COLORS.PUBLISHED;
    const statusLabel = STATUS_LABELS[event.status] || event.status;

    return (
        <div style={{
            maxWidth: "var(--max-content-width)", margin: "var(--space-6) auto",
            padding: "0 var(--space-4)",
        }}>
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

            {/* Status label + title */}
            <div style={{ marginBottom: "var(--space-3)" }}>
                <span style={{
                    display: "inline-block",
                    padding: "2px 12px",
                    borderRadius: "var(--radius-pill)",
                    fontSize: "var(--font-size-small)",
                    fontWeight: "var(--font-weight-semibold)",
                    backgroundColor: statusColor.bg,
                    color: statusColor.text,
                    marginBottom: "var(--space-2)",
                }}>
                    {statusLabel}
                </span>
                <h1 style={{
                    fontSize: "var(--font-size-h1)",
                    fontWeight: "var(--font-weight-semibold)",
                    color: "var(--text-primary)",
                    margin: 0,
                }}>
                    {event.title}
                </h1>
            </div>

            {/* Application Status Banner (for logged-in users with application) */}
            {isAuthenticated && event.userApplication && (
                <ApplicationStatusBanner application={event.userApplication} />
            )}

            {/* Main content: two columns */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
                gap: "var(--space-4)",
                marginTop: "var(--space-4)",
            }}>
                {/* Left column: Image + Description */}
                <div>
                    {/* Banner image */}
                    {event?.imageUrl && (
                        <div style={{
                            borderRadius: "var(--radius-md)",
                            overflow: "hidden",
                            marginBottom: "var(--space-4)",
                            backgroundColor: "var(--surface-ceramic)",
                        }}>
                            <img
                                src={event?.imageUrl}
                                alt={event?.title}
                                style={{
                                    width: "100%",
                                    height: "auto",
                                    maxHeight: 400,
                                    objectFit: "cover",
                                    display: "block",
                                }}
                                onError={(e) => { e.target.style.display = "none"; }}
                            />
                        </div>
                    )}

                    {/* Description */}
                    <Card>
                        <h2 style={{
                            fontSize: "var(--font-size-h3)",
                            fontWeight: "var(--font-weight-semibold)",
                            color: "var(--text-primary)",
                            marginBottom: "var(--space-3)",
                        }}>
                            Mô tả sự kiện
                        </h2>
                        {event.description ? (
                            <div
                                dangerouslySetInnerHTML={{ __html: event.description }}
                                style={{
                                    fontSize: "var(--font-size-body)",
                                    color: "var(--text-primary)",
                                    lineHeight: 1.7,
                                }}
                            />
                        ) : (
                            <span style={{ color: "var(--text-tertiary)", fontStyle: "italic" }}>
                                Chưa có mô tả chi tiết.
                            </span>
                        )}
                    </Card>
                </div>

                {/* Right column: Event details sidebar */}
                <div>
                    <Card>
                        <h2 style={{
                            fontSize: "var(--font-size-h3)",
                            fontWeight: "var(--font-weight-semibold)",
                            color: "var(--text-primary)",
                            marginBottom: "var(--space-4)",
                        }}>
                            Thông tin sự kiện
                        </h2>

                        <InfoRow icon={Calendar} label="Ngày bắt đầu">
                            {formatDateTime(event.startDate)}
                        </InfoRow>

                        <InfoRow icon={Calendar} label="Ngày kết thúc">
                            {formatDateTime(event.endDate)}
                        </InfoRow>

                        <InfoRow icon={Clock} label="Hạn đăng ký">
                            {formatDateTime(event.applicationDeadline)}
                        </InfoRow>

                        <InfoRow icon={MapPin} label="Địa điểm">
                            {event.location}
                        </InfoRow>

                        <InfoRow icon={Users} label="Sức chứa">
                            <span>
                                {event.approvedParticipants}/{event.maxCapacity} người tham gia
                                {event.remainingSlots !== undefined && (
                                    <span style={{ marginLeft: 8, fontSize: "var(--font-size-micro)" }}>
                                        {event.isFull ? (
                                            <span style={{ color: "#991b1b", fontWeight: "var(--font-weight-semibold)" }}>
                                                (Đã đầy)
                                            </span>
                                        ) : (
                                            <span style={{ color: "#166534", fontWeight: "var(--font-weight-semibold)" }}>
                                                (Còn {event.remainingSlots} chỗ)
                                            </span>
                                        )}
                                    </span>
                                )}
                            </span>
                        </InfoRow>

                        {event.category && (
                            <InfoRow icon={Tag} label="Danh mục">
                                {event.category.name}
                            </InfoRow>
                        )}

                        {event.createdBy && (
                            <InfoRow icon={User} label="Người tạo">
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    {event.createdBy.avatarUrl && (
                                        <img
                                            src={event.createdBy.avatarUrl}
                                            alt={event.createdBy.fullName}
                                            style={{
                                                width: 24, height: 24, borderRadius: "50%", objectFit: "cover",
                                            }}
                                            onError={(e) => { e.target.style.display = "none"; }}
                                        />
                                    )}
                                    {event.createdBy.fullName}
                                </div>
                            </InfoRow>
                        )}

                        <InfoRow icon={Clock} label="Ngày tạo">
                            {formatDate(event.createdAt)}
                        </InfoRow>
                    </Card>

                    {/* CTA: Apply button for logged-in volunteers without application */}
                    {isAuthenticated && !event.userApplication && event.status === "PUBLISHED" && (
                        <div style={{ marginTop: "var(--space-3)" }}>
                            <Link to={`/volunteer/events/${event.id}/apply`} style={{ textDecoration: "none" }}>
                                <Button style={{ width: "100%" }}>
                                    Đăng ký tham gia
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* CTA: Login prompt for guests */}
                    {!isAuthenticated && event.status === "PUBLISHED" && (
                        <div style={{ marginTop: "var(--space-3)" }}>
                            <Link to="/login" style={{ textDecoration: "none" }}>
                                <Button variant="secondary" style={{ width: "100%" }}>
                                    Đăng nhập để đăng ký
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}