import { Link, useNavigate } from "react-router-dom";
import { HeartHandshake, Menu, X, User, ChevronDown, LogOut, History, Lock } from "lucide-react";
import { useAuth } from "../../contexts/authContext.context";
import { ROLES } from "../../constants/roles";
import { useState, useRef, useEffect } from "react";
import Button from "./Button";
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout, roleName } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const dropdownBtnRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && dropdownOpen) {
        setDropdownOpen(false);
        dropdownBtnRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [dropdownOpen]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setDropdownOpen(false);
    navigate("/");
    await logout();
    setIsLoggingOut(false);
  };

  const handleDropdownKeyDown = (e, index, itemsCount) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = e.currentTarget.parentElement.children[index + 1]?.querySelector("button");
      if (next) next.focus();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = index > 0 ? index - 1 : itemsCount - 1;
      const prev = e.currentTarget.parentElement.children[prevIndex]?.querySelector("button");
      if (prev) prev.focus();
    }
    if (e.key === "Escape") {
      setDropdownOpen(false);
      dropdownBtnRef.current?.focus();
    }
  };

  const roleNavLinks = {
    [ROLES.VOLUNTEER]: [
      { name: "Trang chủ", link: "/home" },
      { name: "Sự kiện", link: "/volunteer/events" },
      { name: "Chứng nhận", link: "/volunteer/certificates" },
    ],
    [ROLES.STAFF]: [
      { name: "Trang chủ", link: "/staff/events" },
      { name: "Sự kiện", link: "/staff/events" },
      { name: "Đơn đăng ký", link: "/staff/applications" },
      { name: "Điểm danh", link: "/staff/attendance" },
    ],
    [ROLES.MANAGER]: [
      { name: "Trang chủ", link: "/manager/dashboard" },
    ],
    [ROLES.ADMIN]: [
      { name: "Trang chủ", link: "/admin/dashboard" },
      { name: "Người dùng", link: "/admin/users" },
      { name: "Danh mục", link: "/admin/categories" },
      { name: "Kỹ năng", link: "/admin/skills" },
    ],
  };

  const guestNavLinks = [
    { name: "Trang chủ", link: "/" },
    { name: "Về chúng tôi", link: "/about" },
  ];

  const navLinks = isAuthenticated
    ? (roleNavLinks[roleName] || [{ name: "Trang chủ", link: "/home" }])
    : guestNavLinks;

  const baseDropdownItems = [
    { icon: User, label: "Hồ sơ cá nhân", action: () => { setDropdownOpen(false); navigate("/profile"); } },
  ];

  const volunteerDropdownItems = [
    ...baseDropdownItems,
    { icon: History, label: "Lịch sử tình nguyện", action: () => { setDropdownOpen(false); navigate("/history"); } },
    { divider: true },
    { icon: Lock, label: "Đổi mật khẩu", action: () => { setDropdownOpen(false); navigate("/change-password"); } },
    { icon: LogOut, label: "Đăng xuất", action: handleLogout, color: "var(--color-error)", disabled: isLoggingOut },
  ];

  const otherRoleDropdownItems = [
    ...baseDropdownItems,
    { divider: true },
    { icon: Lock, label: "Đổi mật khẩu", action: () => { setDropdownOpen(false); navigate("/change-password"); } },
    { icon: LogOut, label: "Đăng xuất", action: handleLogout, color: "var(--color-error)", disabled: isLoggingOut },
  ];

  const dropdownItems = roleName === ROLES.VOLUNTEER ? volunteerDropdownItems : otherRoleDropdownItems;

  const userInitial = user?.full_name?.[0]?.toUpperCase() || null;

  return (
    <nav className="navbar-vms">
      <div className="navbar-vms-inner">
        <div className="navbar-vms-left">
          <Link to={isAuthenticated ? "/home" : "/"} className="navbar-vms-brand">
            <HeartHandshake size={28} style={{ color: "var(--gold)" }} />
            <span className="navbar-vms-brand-text">VMS</span>
          </Link>
        </div>

        {/* Desktop nav links (Center) */}
        <div className="navbar-vms-center d-none d-lg-flex">
          {navLinks.map((it) => (
            <Link key={it.name} to={it.link} className="nav-link-vms">
              {it.name}
            </Link>
          ))}
        </div>

        {/* Desktop auth/profile (Right) */}
        <div className="navbar-vms-right d-none d-lg-flex">
          {isAuthenticated ? (
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                ref={dropdownBtnRef}
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-expanded={dropdownOpen}
                aria-haspopup="menu"
                className="navbar-vms-avatar-btn"
              >
                <div className="navbar-vms-avatar-icon">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || "Avatar"}
                      className="navbar-vms-avatar-img"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <span style={{ display: user?.avatar_url ? "none" : "flex" }}>
                    {userInitial || <User size={16} />}
                  </span>
                </div>
                <span className="navbar-vms-username">
                  {user?.full_name || "Người dùng"}
                </span>
                <ChevronDown 
                  size={14} 
                  style={{
                    color: "var(--text-on-dark-soft)",
                    transform: dropdownOpen ? "rotate(180deg)" : "rotate(0)",
                    transition: "transform var(--transition-fast)"
                  }} 
                />
              </button>

              {dropdownOpen && (
                <div role="menu" className="navbar-vms-dropdown">
                  {dropdownItems.map((item, i) => {
                    if (item.divider) {
                      return <div key={`div-${i}`} className="navbar-vms-dropdown-divider" />;
                    }
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        role="menuitem"
                        className="dropdown-item-vms"
                        disabled={item.disabled}
                        onClick={item.action}
                        onKeyDown={(e) => handleDropdownKeyDown(e, i, dropdownItems.length)}
                        style={{ color: item.color || "var(--text-primary)" }}
                        tabIndex={0}
                      >
                        {Icon && <Icon size={18} />}
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login"><Button variant="dark" size="md">Đăng nhập</Button></Link>
              <Link to="/register"><Button variant="primary" size="md">Đăng ký</Button></Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="navbar-vms-mobile-btn d-lg-none"
          aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <div className="navbar-vms-mobile-menu d-lg-none">
          {navLinks.map((it) => (
            <Link
              key={it.name}
              to={it.link}
              className="navbar-vms-mobile-link"
              onClick={() => setMobileOpen(false)}
            >
              {it.name}
            </Link>
          ))}
          <div className="navbar-vms-dropdown-divider" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
          {isAuthenticated ? (
            <>
              <MobileMenuItem icon={User} label="Hồ sơ cá nhân" onClick={() => { navigate("/profile"); setMobileOpen(false); }} />
              {roleName === ROLES.VOLUNTEER && (
                <MobileMenuItem icon={History} label="Lịch sử tình nguyện" onClick={() => { navigate("/history"); setMobileOpen(false); }} />
              )}
              <MobileMenuItem icon={Lock} label="Đổi mật khẩu" onClick={() => { navigate("/change-password"); setMobileOpen(false); }} />
              <MobileMenuItem icon={LogOut} label="Đăng xuất" color="var(--color-error)" onClick={() => { handleLogout(); setMobileOpen(false); }} />
            </>
          ) : (
            <div className="d-flex flex-column gap-3 mt-2">
              <Link to="/login" onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none' }}>
                <Button variant="dark" size="lg" style={{ width: "100%" }}>Đăng nhập</Button>
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="lg" style={{ width: "100%" }}>Đăng ký</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

function MobileMenuItem({ icon: Icon, label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="navbar-vms-mobile-menu-item"
      style={{ color: color || "var(--text-on-dark)" }}
    >
      {Icon && <Icon size={20} />}
      {label}
    </button>
  );
}