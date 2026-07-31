import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { categoryService } from "../../../services/category.service.js";
import useFormSubmit from "../../../hooks/useFormSubmit";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import FormInput from "../../ui/FormInput";
import Skeleton from "../../ui/Skeleton";
import ErrorState from "../../ui/ErrorState";

/* ------------------------------------------------------------------ */
/*  EditCategoryPage                                                  */
/* ------------------------------------------------------------------ */
export default function EditCategoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isSubmitting, error, handleSubmit, clearError } = useFormSubmit();

  const [loadingCategory, setLoadingCategory] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
  });
  const [fieldErrors, setFieldErrors] = useState({});

  /* Load category — prefer data passed via router state; otherwise fetch list & find by ID */
  useEffect(() => {
    let cancelled = false;
    setLoadingCategory(true);
    setFetchError(null);

    const applyCategory = (category) => {
      if (cancelled) return;
      setFormData({
        name: category.name || "",
        description: category.description || "",
        is_active: category.is_active,
      });
      setLoadingCategory(false);
    };

    const passedCategory = location.state?.category;
    if (passedCategory && String(passedCategory.category_id) === String(id)) {
      applyCategory(passedCategory);
      return;
    }

    categoryService.getCategories({ limit: 100 })
      .then((response) => {
        if (cancelled) return;
        const categories = response.data?.categories || [];
        const found = categories.find((c) => String(c.category_id) === String(id));
        if (found) {
          applyCategory(found);
        } else {
          setFetchError("Không tìm thấy danh mục.");
          setLoadingCategory(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setFetchError(err?.message || "Không thể tải thông tin danh mục.");
          setLoadingCategory(false);
        }
      });

    return () => { cancelled = true; };
  }, [id, location.state]);

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
    if (!formData.name.trim()) {
      errors.name = "Tên danh mục không được để trống";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const onSubmit = useCallback(async () => {
    if (!validate()) return;

    const result = await handleSubmit(
      () => categoryService.updateCategory(id, {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        is_active: formData.is_active,
      }),
      "Cập nhật danh mục thành công"
    );

    if (result.success) {
      navigate("/admin/categories");
    }
  }, [formData, id, handleSubmit, navigate, validate]);

  /* Loading state */
  if (loadingCategory) {
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
          title="Không thể tải thông tin danh mục"
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
            Chỉnh sửa danh mục
          </h1>
          <p style={{ fontSize: "var(--font-size-small)", color: "var(--text-secondary)", margin: "4px 0 0" }}>
            Cập nhật thông tin cho danh mục: <strong>{formData.name}</strong>
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
          {/* Name */}
          <FormInput
            label="Tên danh mục *"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            error={fieldErrors.name}
            placeholder="Nhập tên danh mục"
          />

          {/* Description */}
          <FormInput
            label="Mô tả"
            name="description"
            type="text"
            value={formData.description}
            onChange={handleChange}
            error={fieldErrors.description}
            placeholder="Nhập mô tả"
          />

          {/* Visibility */}
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
              Hiển thị danh mục
            </label>
            <p style={{
              margin: "4px 0 0",
              fontSize: "var(--font-size-micro)",
              color: "var(--text-tertiary)",
              marginLeft: 28,
            }}>
              Bỏ chọn để ẩn danh mục khỏi người dùng.
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
            <Link to="/admin/categories" style={{ textDecoration: "none" }}>
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