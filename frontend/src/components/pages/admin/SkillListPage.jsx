import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Eye,
  Plus,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Sparkles,
} from "lucide-react";
import useSkillList from "../../../hooks/useSkillList";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import Skeleton from "../../ui/Skeleton";
import EmptyState from "../../ui/EmptyState";
import ErrorState from "../../ui/ErrorState";

/* ------------------------------------------------------------------ */
/*  SkillListPage                                                     */
/* ------------------------------------------------------------------ */
export default function SkillListPage() {
  const { skills, loading, error, setParams, refetch } = useSkillList();

  /* Local state */
  const [searchInput, setSearchInput] = useState("");

  /* Search is debounced inside useSkillList */
  const handleSearchChange = useCallback(
    (e) => {
      const val = e.target.value;
      setSearchInput(val);
      setParams({ search: val });
    },
    [setParams]
  );

  /* ------------------------------------------------------------------ */
  /*  Render: Loading                                                   */
  /* ------------------------------------------------------------------ */
  if (loading && skills.length === 0) {
    return (
      <div style={{ maxWidth: "var(--max-content-width)", margin: "0 auto" }}>
        {/* Skeleton header */}
        <div style={{ marginBottom: "var(--space-4)" }}>
          <Skeleton width="300px" height="32px" />
          <Skeleton width="200px" height="16px" style={{ marginTop: 8 }} />
        </div>
        {/* Skeleton search */}
        <div style={{ marginBottom: "var(--space-4)" }}>
          <Skeleton width="280px" height="40px" />
        </div>
        {/* Skeleton table */}
        <Card>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ display: "flex", gap: 16, padding: "12px 0", borderBottom: i < 7 ? "1px solid var(--surface-ceramic)" : "none" }}>
              <Skeleton width="40px" height="40px" style={{ borderRadius: 8, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <Skeleton width="60%" height="16px" />
                <Skeleton width="40%" height="12px" style={{ marginTop: 6 }} />
              </div>
              <Skeleton width="80px" height="24px" />
            </div>
          ))}
        </Card>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Render: Error                                                     */
  /* ------------------------------------------------------------------ */
  if (error && skills.length === 0) {
    return (
      <div style={{ maxWidth: "var(--max-content-width)", margin: "0 auto" }}>
        <ErrorState
          icon={AlertCircle}
          title="Không thể tải danh sách kỹ năng"
          message={error}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Render: Main content                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div style={{ maxWidth: "var(--max-content-width)", margin: "0 auto" }}>
      {/* Page heading */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <div>
          <h1 style={{ fontSize: "var(--font-size-h1)", fontWeight: "var(--font-weight-semibold)", color: "var(--text-primary)", margin: 0 }}>
            Quản lý Kỹ năng
          </h1>
          <p style={{ fontSize: "var(--font-size-small)", color: "var(--text-secondary)", margin: "4px 0 0" }}>
            Quản lý danh sách kỹ năng cho tình nguyện viên
          </p>
        </div>
        <Link to="/admin/skills/add" style={{ textDecoration: "none" }}>
          <Button variant="primary">
            <Plus size={18} />
            Thêm kỹ năng
          </Button>
        </Link>
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: "var(--space-4)" }}>
        <div style={{ position: "relative", maxWidth: 400 }}>
          <Search size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
          <input
            type="text"
            className="input-vms"
            style={{ paddingLeft: 40, width: "100%" }}
            placeholder="Tìm kiếm theo tên hoặc mô tả..."
            value={searchInput}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Empty state */}
      {!loading && skills.length === 0 && (
        <Card>
          <EmptyState
            icon={Sparkles}
            title="Không tìm thấy kỹ năng"
            message="Hiện không có kỹ năng nào phù hợp với tiêu chí tìm kiếm."
          />
        </Card>
      )}

      {/* Skill table */}
      {skills.length > 0 && (
        <Card padding="0" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--surface-ceramic)", borderBottom: "2px solid var(--border-color)" }}>
                  <th style={thStyle}>Tên kỹ năng</th>
                  <th style={thStyle}>Mô tả</th>
                  <th style={thStyle}>Trạng thái</th>
                  <th style={{ ...thStyle, textAlign: "center", width: 80 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {skills.map((skill) => (
                  <tr
                    key={skill.skill_id}
                    style={{ borderBottom: "1px solid var(--surface-ceramic)", transition: "background-color 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--surface-ceramic)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          backgroundColor: "var(--green-light)", color: "var(--green-accent)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <Sparkles size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: "var(--font-size-body)", fontWeight: "var(--font-weight-semibold)", color: "var(--text-primary)" }}>
                            {skill.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <FileText size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
                        <span style={{ fontSize: "var(--font-size-small)", color: "var(--text-secondary)" }}>
                          {skill.description || <span style={{ color: "var(--text-tertiary)", fontStyle: "italic" }}>Chưa có mô tả</span>}
                        </span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      {skill.is_active ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "var(--font-size-small)", color: "#166534" }}>
                          <CheckCircle2 size={14} />
                          Hoạt động
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "var(--font-size-small)", color: "#991b1b" }}>
                          <XCircle size={14} />
                          Vô hiệu hóa
                        </span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <Link
                        to={`/admin/skills/${skill.skill_id}/edit`}
                        style={{ textDecoration: "none" }}
                        title="Xem/Chỉnh sửa"
                      >
                        <Button variant="ghost" size="sm">
                          <Eye size={16} />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Loading overlay for search */}
      {loading && skills.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-4)" }}>
          <div style={{
            width: 32, height: 32,
            border: "3px solid var(--surface-ceramic)",
            borderTopColor: "var(--green-accent)",
            borderRadius: "50%",
            animation: "btn-spin 0.7s linear infinite",
          }} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Table cell styles                                                 */
/* ------------------------------------------------------------------ */
const thStyle = {
  padding: "12px 16px",
  textAlign: "left",
  fontSize: "var(--font-size-small)",
  fontWeight: "var(--font-weight-semibold)",
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "12px 16px",
  verticalAlign: "middle",
};