import React, { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, UserPlus } from "lucide-react";
import { userService } from "../../../services/user.service.js";
import useFormSubmit from "../../../hooks/useFormSubmit";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import FormInput from "../../ui/FormInput";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
const ROLE_OPTIONS = [
  { value: 1, label: "Tình nguyện viên" },
  { value: 2, label: "Nhân viên" },
  { value: 3, label: "Quản lý" },
  { value: 4, label: "Quản trị viên" },
];

/* ------------------------------------------------------------------ */
/*  AddUserPage                                                       */
/* ------------------------------------------------------------------ */
export default function AddUserPage() {
  const navigate = useNavigate();
  const { isSubmitting, error, handleSubmit, clearError } = useFormSubmit();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role_id: 1,
  });

  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    clearError();
  }, [clearError]);

  const validate = useCallback(() => {
    const errors = {};
    if (!formData.full_name.trim()) {
      errors.full_name = "Họ và tên không được để trống";
    }
    if (!formData.email.trim()) {
      errors.email = "Email không được để trống";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Email không đúng định dạng";
    }
    if (!formData.password) {
      errors.password = "Mật khẩu không được để trống";
    } else if (formData.password.length < 8) {
      errors.password = "Mật khẩu phải có ít nhất 8 ký tự";
    }
    if (!formData.role_id) {
      errors.role_id = "Vai trò không được để trống";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const onSubmit = useCallback(async () => {
    if (!validate()) return;

    const result = await handleSubmit(
      () => userService.createUser({
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || undefined,
        password: formData.password,
        role_id: Number(formData.role_id),
      }),
      "Tạo người dùng thành công"
    );

    if (result.success) {
      navigate("/admin/users");
    }
  }, [formData, handleSubmit, navigate, validate]);

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
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

      <Card>
        <div style={{ marginBottom: "var(--space-4)" }}>
          <h1 style={{
            fontSize: "var(--font-size-h2)", fontWeight: "var(--font-weight-semibold)",
            color: "var(--text-primary)", margin: 0,
          }}>
            Thêm người dùng mới
          </h1>
          <p style={{ fontSize: "var(--font-size-small)", color: "var(--text-secondary)", margin: "4px 0 0" }}>
            Tạo tài khoản mới cho tình nguyện viên, nhân viên, quản lý hoặc quản trị viên
          </p>
        </div>

        {/* API Error */}
        {error && (
          <div style={{
            backgroundColor: "#fee2e2", color: "#991b1b",
            borderRadius: "var(--radius-md)", padding: "var(--space-3)",
            marginBottom: "var(--space-4)", fontSize: "var(--font-size-small)",
          }}>
            {error}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
          {/* Full name */}
          <FormInput
            label="Họ và tên *"
            name="full_name"
            type="text"
            value={formData.full_name}
            onChange={handleChange}
            error={fieldErrors.full_name}
            placeholder="Nhập họ và tên"
          />

          {/* Email */}
          <FormInput
            label="Email *"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={fieldErrors.email}
            placeholder="Nhập địa chỉ email"
          />

          {/* Phone */}
          <FormInput
            label="Số điện thoại"
            name="phone"
            type="text"
            value={formData.phone}
            onChange={handleChange}
            error={fieldErrors.phone}
            placeholder="Nhập số điện thoại (không bắt buộc)"
          />

          {/* Password */}
          <FormInput
            label="Mật khẩu *"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={fieldErrors.password}
            placeholder="Nhập mật khẩu (ít nhất 8 ký tự)"
          />

          {/* Role */}
          <div className="mb-3">
            <label
              style={{
                display: "block",
                fontSize: "var(--font-size-small)",
                fontWeight: "var(--font-weight-semibold)",
                color: fieldErrors.role_id ? "var(--color-error)" : "var(--text-primary)",
                marginBottom: "var(--space-1)",
              }}
            >
              Vai trò *
            </label>
            <select
              name="role_id"
              className={`input-vms ${fieldErrors.role_id ? "input-error" : ""}`}
              value={formData.role_id}
              onChange={handleChange}
              style={{ width: "100%" }}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {fieldErrors.role_id && (
              <p style={{ margin: "4px 0 0", fontSize: "var(--font-size-small)", color: "var(--color-error)" }}>
                {fieldErrors.role_id}
              </p>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, marginTop: "var(--space-4)" }}>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
              style={{ flex: 1 }}
            >
              <UserPlus size={16} />
              {isSubmitting ? "Đang tạo..." : "Tạo người dùng"}
            </Button>
            <Link to="/admin/users" style={{ textDecoration: "none" }}>
              <Button variant="secondary" disabled={isSubmitting}>
                Hủy
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}