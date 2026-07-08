import { Link } from "react-router-dom";
import { HeartHandshake, MessageCircle, Globe, Mail } from "lucide-react";

const socialIconStyle = {
    background: "none",
    border: "none",
    color: "var(--text-on-dark-soft)",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
    transition: "color var(--transition-fast)",
};

export default function Footer() {
    return (
        <footer style={{ backgroundColor: "var(--green-house)", paddingTop: "var(--space-6)", paddingBottom: "var(--space-4)" }}>
            <div style={{ maxWidth: "var(--max-content-width)", margin: "0 auto", padding: "0 var(--space-4)" }}>
                {/* Top section */}
                <div className="row g-4" style={{ marginBottom: "var(--space-6)" }}>
                    {/* Logo + mô tả */}
                    <div className="col-lg-4 col-md-6 col-12">
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                            <HeartHandshake size={24} style={{ color: "var(--gold)" }} />
                            <span style={{ fontSize: "var(--font-size-body)", fontWeight: "var(--font-weight-bold)", color: "var(--text-on-dark)", letterSpacing: "var(--letter-spacing-normal)" }}>VMS</span>
                        </div>
                        <p style={{ color: "var(--text-on-dark-soft)", fontSize: "var(--font-size-small)", lineHeight: "var(--line-height-normal)", margin: 0 }}>
                            Hệ thống Quản lý Tình nguyện viên — Kết nối những trái tim thiện nguyện.
                        </p>
                    </div>

                    {/* Trang */}
                    <div className="col-6 col-lg-2">
                        <h6 style={{ color: "var(--gold)", fontSize: "var(--font-size-small)", fontWeight: "var(--font-weight-semibold)", marginBottom: 16, letterSpacing: "var(--letter-spacing-loose)" }}>TRUY CẬP NHANH</h6>
                        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                            <FooterLink to="/" label="Trang chủ" />
                            <FooterLink to="/events" label="Sự kiện" />
                            <FooterLink to="/about" label="Về chúng tôi" />
                        </ul>
                    </div>

                    {/* Hỗ trợ */}
                    <div className="col-6 col-lg-2">
                        <h6 style={{ color: "var(--gold)", fontSize: "var(--font-size-small)", fontWeight: "var(--font-weight-semibold)", marginBottom: 16, letterSpacing: "var(--letter-spacing-loose)" }}>HỖ TRỢ</h6>
                        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                            <FooterLink to="/contact" label="Liên hệ" />
                            <FooterLink to="/faq" label="Câu hỏi thường gặp" />
                            <FooterLink to="/terms" label="Điều khoản sử dụng" />
                        </ul>
                    </div>

                    {/* Liên hệ */}
                    <div className="col-lg-4 col-md-6 col-12">
                        <h6 style={{ color: "var(--gold)", fontSize: "var(--font-size-small)", fontWeight: "var(--font-weight-semibold)", marginBottom: 16, letterSpacing: "var(--letter-spacing-loose)" }}>LIÊN HỆ</h6>
                        <p style={{ color: "var(--text-on-dark-soft)", fontSize: "var(--font-size-small)", margin: "0 0 8px" }}>Hà Nội, Việt Nam</p>
                        <p style={{ color: "var(--text-on-dark-soft)", fontSize: "var(--font-size-small)", margin: "0 0 8px" }}>support@vms.vn</p>
                        <p style={{ color: "var(--text-on-dark-soft)", fontSize: "var(--font-size-small)", margin: 0 }}>0123 456 789</p>
                    </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: "rgba(255,255,255,0.12)", marginBottom: "var(--space-4)" }} />

                {/* Bottom bar */}
                <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                    <p style={{ color: "var(--text-on-dark-soft)", fontSize: "var(--font-size-micro)", margin: 0 }}>
                        © 2026 Volunteer Management System. Bảo lưu mọi quyền.
                    </p>
                    <div style={{ display: "flex", gap: 16 }}>
            <SocialButton aria-label="Facebook"><MessageCircle size={18} /></SocialButton>
                        <SocialButton aria-label="Website"><Globe size={18} /></SocialButton>
                        <SocialButton aria-label="Email"><Mail size={18} /></SocialButton>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function SocialButton({ children, "aria-label": ariaLabel }) {
    return (
        <button
            type="button"
            aria-label={ariaLabel}
            style={socialIconStyle}
            className="social-btn-vms"
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--gold)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-on-dark-soft)"; }}
        >
            {children}
        </button>
    );
}

function FooterLink({ to, label }) {
    return (
        <li style={{ marginBottom: 8 }}>
            <Link
                to={to}
                style={{
                    color: "var(--text-on-dark-soft)",
                    fontSize: "var(--font-size-small)",
                    textDecoration: "none",
                    cursor: "pointer",
                    padding: 0,
                    transition: "color var(--transition-fast)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--gold)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-on-dark-soft)"; }}
            >
                {label}
            </Link>
        </li>
    );
}