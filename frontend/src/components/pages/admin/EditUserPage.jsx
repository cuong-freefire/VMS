import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { userService } from "../../../services/user.service.js";
import useFormSubmit from "../../../hooks/useFormSubmit";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import FormInput from "../../ui/FormInput";
import Skeleton from "../../ui/Skeleton";
import ErrorState from "../../ui/ErrorState";

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
/*  EditUserPage                                                       */
/* ------------------------------------------------------------------ */
export default function EditUserPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isSubmitting, error, handleSubmit, clearError } = useFormSubmit();

    const [loadingUser, setLoadingUser] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [formData, setFormData] = useState({
        full_name: "",
        phone: "",
        role_id: 1,
        is_active: true,
    });
    const [fieldErrors, setFieldErrors] = useState({});

    /* Fetch user data on mount */
    useEffect(() => {
        let cancelled = false;
        setLoadingUser(true);
        setFetchError(null);

        userService.getUserById(id)
            .then((response) => {
                if (!cancelled) {
                    const user = response.data;
                    setFormData({
                        full_name: user.full_name || "",
                        phone: user.phone || "",
                        role_id: (() => {
                            // Map role name to ID
                            const roleMap = {
                                VOLUNTEER: 1,
                                STAFF: 2,
                                MANAGER: 3,
                                ADMIN: 4,
                            };
                            return roleMap[user.role] || 1;
                        })(),
                        is_active: user.is_active,
                    });
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setFetchError(
                        err?.details ??
                        err?.detail ??
                        err?.message ??
                        "Không thể tải thông tin người dùng.");
                }
            })
            .finally(() => {
                if (!cancelled) setLoadingUser(false);
            });

        return () => { cancelled = true; };
    }, [id]);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        setFieldErrors((prev) => ({ ...prev, [name]: "" }));
        clearError();
    }, [clearError]);

    const validate = useCallback(() => {
        const errors = {};
        if (!formData.full_name.trim()) {
            errors.full_name = "Họ và tên không được để trống";
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
            () => userService.updateUser(id, {
                full_name: formData.full_name.trim(),
                phone: formData.phone.trim() || undefined,
                role_id: Number(formData.role_id),
                is_active: formData.is_active,
            }),
            "Cập nhật thông tin người dùng thành công"
        );

        if (result.success) {
            navigate(`/admin/users/${id}`);
        }
    }, [formData, id, handleSubmit, navigate, validate]);

    /* Loading state */
    if (loadingUser) {
        return (
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
                <div style={{ marginBottom: "var(--space-4)" }}>
                    <Skeleton width="80px" height="30px" />
                </div>
                <Card>
                    <Skeleton count={6} />
                </Card>
            </div>
        );
    }

    /* Error state */
    if (fetchError) {
        return (
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
                <ErrorState
                    title="Không thể tải thông tin người dùng"
                    message={fetchError}
                    onRetry={() => window.location.reload()}
                />
            </div>
        );
    }

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
                        Chỉnh sửa thông tin
                    </h1>
                    <p style={{ fontSize: "var(--font-size-small)", color: "var(--text-secondary)", margin: "4px 0 0" }}>
                        Cập nhật thông tin cho người dùng: <strong>{formData.full_name}</strong>
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

                    {/* Phone */}
                    <FormInput
                        label="Số điện thoại"
                        name="phone"
                        type="text"
                        value={formData.phone}
                        onChange={handleChange}
                        error={fieldErrors.phone}
                        placeholder="Nhập số điện thoại"
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

                    {/* Active status */}
                    <div className="mb-3">
                        <label
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                cursor: "pointer",
                                fontSize: "var(--font-size-small)",
                                fontWeight: "var(--font-weight-semibold)",
                                color: "var(--text-primary)",
                            }}
                        >
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                                style={{
                                    width: 18, height: 18,
                                    accentColor: "var(--green-accent)",
                                    cursor: "pointer",
                                }}
                            />
                            Đang hoạt động
                        </label>
                        <p style={{
                            margin: "4px 0 0",
                            fontSize: "var(--font-size-micro)",
                            color: "var(--text-tertiary)",
                            marginLeft: 28,
                        }}>
                            Bỏ chọn để vô hiệu hóa tài khoản. Người dùng sẽ không thể đăng nhập.
                        </p>
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
                            <Save size={16} />
                            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                        <Link to={`/admin/users/${id}`} style={{ textDecoration: "none" }}>
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