import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Plus, RefreshCw } from "lucide-react";
import { eventService } from "../../../services/event.service.js";
import { categoryService } from "../../../services/category.service.js";
import useFormSubmit from "../../../hooks/useFormSubmit";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import FormInput from "../../ui/FormInput";
import Skeleton from "../../ui/Skeleton";

/* ------------------------------------------------------------------ */
/*  CreateEventPage (UC15)                                            */
/* ------------------------------------------------------------------ */
export default function CreateEventPage() {
  const navigate = useNavigate();
  const { isSubmitting, error, handleSubmit, clearError } = useFormSubmit();

  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categoryError, setCategoryError] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    applicationDeadline: "",
    maxCapacity: "",
    categoryId: "",
    imageUrl: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});

  /* Fetch categories for dropdown */
  const loadCategories = useCallback(async () => {
    setCategoryLoading(true);
    setCategoryError(null);
    try {
      const res = await categoryService.fetchEventTypes();
      setCategories(res.data?.categories || []);
    } catch (err) {
      setCategoryError(err?.message || "Không thể tải danh mục.");
      setCategories([]);
    } finally {
      setCategoryLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCategoryLoading(true);
      setCategoryError(null);
      try {
        const res = await categoryService.fetchEventTypes();
        if (!cancelled) setCategories(res.data?.categories || []);
      } catch (err) {
        if (!cancelled) setCategoryError(err?.message || "Không thể tải danh mục.");
      } finally {
        if (!cancelled) setCategoryLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    clearError();
  }, [clearError]);

  const validate = useCallback(() => {
    const errors = {};
    if (!formData.title.trim()) errors.title = "Tiêu đề không được để trống";
    if (!formData.location.trim()) errors.location = "Địa điểm không được để trống";
    if (!formData.startDate) errors.startDate = "Ngày bắt đầu không được để trống";
    if (!formData.endDate) errors.endDate = "Ngày kết thúc không được để trống";
    if (!formData.applicationDeadline) errors.applicationDeadline = "Hạn đăng ký không được để trống";
    if (!formData.maxCapacity) errors.maxCapacity = "Sức chứa không được để trống";
    if (!formData.categoryId) errors.categoryId = "Danh mục không được để trống";

    // Date validations
    if (formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      errors.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
    }
    if (formData.startDate && formData.applicationDeadline && new Date(formData.applicationDeadline) >= new Date(formData.startDate)) {
      errors.applicationDeadline = "Hạn đăng ký phải trước ngày bắt đầu";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const onSubmit = useCallback(async () => {
    if (!validate()) return;

    const result = await handleSubmit(
      () => eventService.createEvent({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        location: formData.location.trim(),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        applicationDeadline: new Date(formData.applicationDeadline).toISOString(),
        maxCapacity: Number(formData.maxCapacity),
        categoryId: Number(formData.categoryId),
        imageUrl: formData.imageUrl.trim() || undefined,
      }),
      "Tạo sự kiện thành công"
    );

    if (result.success) {
      navigate("/staff/events");
    }
  }, [formData, handleSubmit, navigate, validate]);

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
        Quay lại
      </button>

      <Card>
        <div style={{ marginBottom: "var(--space-4)" }}>
          <h1 style={{
            fontSize: "var(--font-size-h2)", fontWeight: "var(--font-weight-semibold)",
            color: "var(--text-primary)", margin: 0,
          }}>
            Tạo sự kiện mới
          </h1>
          <p style={{ fontSize: "var(--font-size-small)", color: "var(--text-secondary)", margin: "4px 0 0" }}>
            Điền thông tin để tạo sự kiện tình nguyện. Sự kiện sẽ được tạo ở trạng thái Bản nháp.
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
          {/* Title */}
          <FormInput
            label="Tiêu đề *"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            error={fieldErrors.title}
            placeholder="Nhập tiêu đề sự kiện"
          />

          {/* Description */}
          <FormInput
            label="Mô tả"
            name="description"
            type="text"
            value={formData.description}
            onChange={handleChange}
            error={fieldErrors.description}
            placeholder="Nhập mô tả sự kiện (không bắt buộc)"
          />

          {/* Location */}
          <FormInput
            label="Địa điểm *"
            name="location"
            type="text"
            value={formData.location}
            onChange={handleChange}
            error={fieldErrors.location}
            placeholder="Nhập địa điểm tổ chức"
          />

          {/* Start Date */}
          <FormInput
            label="Ngày bắt đầu *"
            name="startDate"
            type="datetime-local"
            value={formData.startDate}
            onChange={handleChange}
            error={fieldErrors.startDate}
          />

          {/* End Date */}
          <FormInput
            label="Ngày kết thúc *"
            name="endDate"
            type="datetime-local"
            value={formData.endDate}
            onChange={handleChange}
            error={fieldErrors.endDate}
          />

          {/* Application Deadline */}
          <FormInput
            label="Hạn đăng ký *"
            name="applicationDeadline"
            type="datetime-local"
            value={formData.applicationDeadline}
            onChange={handleChange}
            error={fieldErrors.applicationDeadline}
          />

          {/* Max Capacity */}
          <FormInput
            label="Sức chứa tối đa *"
            name="maxCapacity"
            type="number"
            value={formData.maxCapacity}
            onChange={handleChange}
            error={fieldErrors.maxCapacity}
            placeholder="Nhập số lượng tình nguyện viên tối đa"
          />

          {/* Category */}
          <div className="mb-3">
            <label
              style={{
                display: "block",
                fontSize: "var(--font-size-small)",
                fontWeight: "var(--font-weight-semibold)",
                color: fieldErrors.categoryId ? "var(--color-error)" : "var(--text-primary)",
                marginBottom: "var(--space-1)",
              }}
            >
              Danh mục *
            </label>
            {categoryLoading ? (
              <Skeleton width="100%" height="40px" />
            ) : categoryError ? (
              <div
                style={{
                  backgroundColor: "#fee2e2",
                  color: "#991b1b",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-3)",
                  fontSize: "var(--font-size-small)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "var(--space-2)",
                }}
              >
                <span>{categoryError}</span>
                <button
                  type="button"
                  className="btn-vms btn-vms-secondary btn-vms-sm"
                  onClick={loadCategories}
                >
                  <RefreshCw size={14} />
                  Thử lại
                </button>
              </div>
            ) : (
              <select
                name="categoryId"
                className={`input-vms ${fieldErrors.categoryId ? "input-error" : ""}`}
                value={formData.categoryId}
                onChange={handleChange}
                style={{ width: "100%" }}
              >
                <option value="">Chọn danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
            {fieldErrors.categoryId && !categoryLoading && !categoryError && (
              <p style={{ margin: "4px 0 0", fontSize: "var(--font-size-small)", color: "var(--color-error)" }}>
                {fieldErrors.categoryId}
              </p>
            )}
          </div>

          {/* Image URL */}
          <FormInput
            label="URL ảnh"
            name="imageUrl"
            type="text"
            value={formData.imageUrl}
            onChange={handleChange}
            error={fieldErrors.imageUrl}
            placeholder="Nhập URL ảnh bìa (không bắt buộc)"
          />

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, marginTop: "var(--space-4)" }}>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
              style={{ flex: 1 }}
            >
              <Plus size={16} />
              {isSubmitting ? "Đang tạo..." : "Tạo sự kiện"}
            </Button>
            <Link to="/staff/events" style={{ textDecoration: "none" }}>
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