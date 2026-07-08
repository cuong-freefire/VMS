import { Link, Outlet } from "react-router-dom";
import { HeartHandshake, ArrowLeft } from "lucide-react";

export default function AuthLayout() {
  return (
    <div style={containerStyle}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Branding */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-5)" }}>
          <HeartHandshake size={40} style={{ color: "var(--green-primary)" }} />
          <h1 style={brandTitleStyle}>VMS</h1>
          <p style={brandSubStyle}>Hệ thống Quản lý Tình nguyện viên</p>
        </div>

        {/* Card */}
        <div className="card-vms" style={{ padding: "var(--space-5) var(--space-4)", position: "relative" }}>
          <Link to="/" style={backLinkStyle}>
            <ArrowLeft size={16} />
            Trang chủ
          </Link>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

const containerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  padding: "var(--space-4)",
  backgroundColor: "var(--surface-warm)",
};

const brandTitleStyle = {
  margin: "8px 0 0",
  fontSize: "var(--font-size-h2)",
  fontWeight: "var(--font-weight-semibold)",
  color: "var(--green-primary)",
  letterSpacing: "var(--letter-spacing-normal)",
};

const brandSubStyle = {
  margin: "4px 0 0",
  fontSize: "var(--font-size-small)",
  color: "var(--text-secondary)",
};

const backLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: "var(--font-size-small)",
  color: "var(--text-secondary)",
  textDecoration: "none",
  marginBottom: "var(--space-4)",
  transition: "color var(--transition-fast)",
};

