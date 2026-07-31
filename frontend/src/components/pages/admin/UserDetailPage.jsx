import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  ArrowLeft,
  Edit,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { userService } from "../../../services/user.service.js";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import Skeleton from "../../ui/Skeleton";
import EmptyState from "../../ui/EmptyState";
import ErrorState from "../../ui/ErrorState";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
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
/*  InfoRow                                                           */
/* ------------------------------------------------------------------ */
function InfoRow({ icon: Icon, label, children }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 12,
      padding: "12px 0",
      borderBottom: "1px solid var(--surface-ceramic)",
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
/*  UserDetailPage                                                   */
/* ------------------------------------------------------------------ */
export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.getUserById(id);
      setUser(response.data);
    } catch (err) {
      setError(err?.message || "Không thể tải thông tin người dùng.");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  /* Loading state */
  if (loading) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ marginBottom: "var(--space-4)" }}>
          <Skeleton width="80px" height="30px" />
        </div>
        <Card>
          <div style={{ textAlign: "center", marginBottom: "var(--space-4)" }}>
            <Skeleton width="96px" height="96px" style={{ borderRadius: "50%", margin: "0 auto" }} />
            <Skeleton width="200px" height="24px" style={{ marginTop: 16 }} />
            <Skeleton width="120px" height="20px" style={{ marginTop: 8 }} />
          </div>
          <Skeleton count={6} />
        </Card>
      </div>
    );
  }

  /* Error state */
  if (error) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <ErrorState
          icon={AlertCircle}
          title="Không thể tải thông tin người dùng"
          message={error}
          onRetry={fetchUser}
        />
      </div>
    );
  }

  /* Not found */
  if (!user) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <Card>
          <EmptyState
            icon={AlertCircle}
            title="Không tìm thấy người dùng"
            message="Người dùng không tồn tại hoặc đã bị xóa."
          />
        </Card>
      </div>
    );
  }

  const roleColor = ROLE_BADGE_COLORS[user.role] || ROLE_BADGE_COLORS.VOLUNTEER;
  const roleLabel = ROLE_LABELS[user.role] || user.role;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
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
        Quay lại danh sách
      </button>

      <Card>
        {/* Avatar section */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-4)" }}>
          <div style={{
            width: 96, height: 96, borderRadius: "50%",
            backgroundColor: "var(--green-accent)", color: "var(--text-on-dark)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto var(--space-3)", overflow: "hidden",
            fontSize: "var(--font-size-jumbo)", fontWeight: "var(--font-weight-bold)",
          }}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              user.full_name?.[0]?.toUpperCase() || <User size={36} />
            )}
          </div>
          <h1 style={{
            fontSize: "var(--font-size-h2)", fontWeight: "var(--font-weight-semibold)",
            color: "var(--text-primary)", margin: "0 0 4px",
          }}>
            {user.full_name}
          </h1>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "2px 12px", borderRadius: "var(--radius-pill)",
            fontSize: "var(--font-size-small)", fontWeight: "var(--font-weight-semibold)",
            backgroundColor: roleColor.bg, color: roleColor.text,
          }}>
            <Shield size={14} />
            {roleLabel}
          </span>
        </div>

        {/* User details */}
        <InfoRow icon={Mail} label="Email">
          {user.email}
        </InfoRow>

        <InfoRow icon={Phone} label="Số điện thoại">
          {user.phone || <span style={{ color: "var(--text-tertiary)", fontStyle: "italic" }}>Chưa cập nhật</span>}
        </InfoRow>

        <InfoRow icon={CheckCircle2} label="Trạng thái">
          {user.is_active ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#166534" }}>
              <CheckCircle2 size={16} />
              Đang hoạt động
            </span>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#991b1b" }}>
              <XCircle size={16} />
              Đã vô hiệu hóa
            </span>
          )}
        </InfoRow>

        <InfoRow icon={Calendar} label="Ngày tạo">
          {formatDate(user.created_at)}
        </InfoRow>

        <InfoRow icon={Clock} label="Cập nhật lần cuối">
          {formatDateTime(user.updated_at)}
        </InfoRow>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, marginTop: "var(--space-4)" }}>
          <Link to={`/admin/users/${user.user_id}/edit`} style={{ textDecoration: "none", flex: 1 }}>
            <Button variant="primary" style={{ width: "100%" }}>
              <Edit size={16} />
              Chỉnh sửa thông tin
            </Button>
          </Link>
          <Link to="/admin/users" style={{ textDecoration: "none" }}>
            <Button variant="secondary">
              <ArrowLeft size={16} />
              Quay lại
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}