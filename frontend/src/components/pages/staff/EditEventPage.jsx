import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, AlertCircle, RefreshCw } from "lucide-react";
import { eventService } from "../../../services/event.service.js";
import { categoryService } from "../../../services/category.service.js";
import useFormSubmit from "../../../hooks/useFormSubmit";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import FormInput from "../../ui/FormInput";
import Skeleton from "../../ui/Skeleton";

/* ------------------------------------------------------------------ */
/*  EditEventPage (UC16)                                              */
/* ------------------------------------------------------------------ */
export default function EditEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSubmitting, error, handleSubmit, clearError } = useFormSubmit();

  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categoryError, setCategoryError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [event, setEvent] = useState(null);

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

  /* Fetch event detail */
  const fetchEvent = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await eventService.getManageEventById(id);
      const ev = res.data;
      setEvent(ev);

      // Helper to format ISO date to datetime-local input value
      const toInput = (iso) => {
        if (!iso) return "";
        const d = new Date(iso);
        if (isNaN(d.getTime())) return "";
        // Format: YYYY-MM-DDTHH:mm
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };

      setFormData({
        title: ev.title || "",
        description: ev.description || "",
        location: ev.location || "",
        startDate: toInput(ev.start_date),
        endDate: toInput(ev.end_date),
        applicationDeadline: toInput(ev.application_deadline),
        maxCapacity: ev.max_capacity != null ? String(ev.max_capacity) : "",
        categoryId: ev.category?.id ? String(ev.category.id) : "",
        imageUrl: ev.image_url || "",
      });
    } catch (err) {
      setLoadError(err?.message || "Không thể tải thông tin sự kiện.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    clearError();
  }, [clearError]);

  const validate = useCallback(() => {
    const errors = {};
    if (formData.title && !formData.title.trim()) errors.title = "Tiêu đề không được để trống";
    if (formData.location && !formData.location.trim()) errors.location = "Địa điểm không được để trống";

    // Date validations (only when both start and end are provided)
    if (formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      errors.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
    }
    if (formData.startDate && formData.applicationDeadline && new Date(formData.applicationDeadline) >= new Date(formData.startDate)) {
      errors.applicationDeadline = "Hạn đăng ký phải trước ngày bắt đầu";
    }
    // maxCapacity is required and must be a positive integer (matches CreateEventPage / backend validator)
    if (!formData.maxCapacity || isNaN(Number(formData.maxCapacity)) || Number(formData.maxCapacity) <= 0) {
      errors.maxCapacity = "Sức chứa phải là số nguyên dương";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const onSubmit = useCallback(async () => {
    if (!validate()) return;

    // Build update payload — only include changed fields
    const payload = {};

    const originalTitle = event?.title || "";
    const originalDescription = event?.description || "";
    const originalLocation = event?.location || "";
    const originalImageUrl = event?.image_url || "";

    if (formData.title.trim() !== originalTitle) {
      payload.title = formData.title.trim();
    }
    if (formData.description.trim() !== originalDescription) {
      payload.description = formData.description.trim();
    }
    if (formData.location.trim() !== originalLocation) {
      payload.location = formData.location.trim();
    }
    if (formData.imageUrl.trim() !== originalImageUrl) {
      payload.imageUrl = formData.imageUrl.trim() || null;
    }

    const originalStart = event?.start_date ? new Date(event.start_date).toISOString() : null;
    const originalEnd = event?.end_date ? new Date(event.end_date).toISOString() : null;
    const originalDeadline = event?.application_deadline ? new Date(event.application_deadline).toISOString() : null;

    const newStart = formData.startDate ? new Date(formData.startDate).toISOString() : null;
    const newEnd = formData.endDate ? new Date(formData.endDate).toISOString() : null;
    const newDeadline = formData.applicationDeadline ? new Date(formData.applicationDeadline).toISOString() : null;

    if (newStart !== originalStart) payload.startDate = newStart;
    if (newEnd !== originalEnd) payload.endDate = newEnd;
    if (newDeadline !== originalDeadline) payload.applicationDeadline = newDeadline;

    if (formData.maxCapacity && Number(formData.maxCapacity) !== event?.max_capacity) {
      payload.maxCapacity = Number(formData.maxCapacity);
    }
    if (formData.categoryId && Number(formData.categoryId) !== event?.category?.id) {
      payload.categoryId = Number(formData.categoryId);
    }

    // If nothing changed, no-op
    if (Object.keys(payload).length === 0) {
      navigate("/staff/events");
      return;
    }

    const result = await handleSubmit(
      () => eventService.updateEvent(id, payload),
      "Cập nhật sự kiện thành công"
    );

    if (result.success) {
      navigate("/staff/events");
    }
  }, [formData, event, id, handleSubmit, navigate, validate]);

  /* Loading skeleton */
  if (loading) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <Skeleton width="100px" height="20px" style={{ marginBottom: "var(--space-4)" }} />
        <Card>
          <Skeleton width="250px" height="28px" />
          <Skeleton width="180px" height="16px" style={{ marginTop: 8, marginBottom: 24 }} />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <Skeleton width="80px" height="14px" />
              <Skeleton width="100%" height="40px" style={{ marginTop: 4 }} />
            </div>
          ))}
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <Skeleton width="150px" height="40px" style={{ borderRadius: "var(--radius-input)" }} />
            <Skeleton width="80px" height="40px" style={{ borderRadius: "var(--radius-input)" }} />
          </div>
        </Card>
      </div>
    );
  }

  /* Error with retry */
  if (loadError) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
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
          <AlertCircle size={48} style={{ color: "var(--color-error)", marginBottom: "var(--space-3)" }} />
          <h3 style={{ fontSize: "var(--font-size-h3)", color: "var(--text-primary)", margin: "0 0 8px" }}>
            Không thể tải sự kiện
          </h3>
          <p style={{ fontSize: "var(--font-size-small)", color: "var(--text-secondary)", margin: "0 0 16px" }}>
            {loadError}
          </p>
          <Button variant="primary" onClick={fetchEvent}>
            <RefreshCw size={16} />
            Thử lại
          </Button>
        </Card>
      </div>
    );
  }

  /* Not found */
  if (!event) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
        <Card>
          <AlertCircle size={48} style={{ color: "var(--text-tertiary)", marginBottom: "var(--space-3)" }} />
          <h3 style={{ fontSize: "var(--font-size-h3)", color: "var(--text-primary)", margin: "0 0 8px" }}>
            Không tìm thấy sự kiện
          </h3>
          <Link to="/staff/events">
            <Button variant="primary">
              <ArrowLeft size={16} />
              Quay lại danh sách
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  /* Main form */
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
            Chỉnh sửa sự kiện
          </h1>
          <p style={{ fontSize: "var(--font-size-small)", color: "var(--text-secondary)", margin: "4px 0 0" }}>
            Đang chỉnh sửa: <strong>{event.title}</strong>
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
            label="Tiêu đề"
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
            placeholder="Nhập mô tả sự kiện"
          />

          {/* Location */}
          <FormInput
            label="Địa điểm"
            name="location"
            type="text"
            value={formData.location}
            onChange={handleChange}
            error={fieldErrors.location}
            placeholder="Nhập địa điểm tổ chức"
          />

          {/* Start Date */}
          <FormInput
            label="Ngày bắt đầu"
            name="startDate"
            type="datetime-local"
            value={formData.startDate}
            onChange={handleChange}
            error={fieldErrors.startDate}
          />

          {/* End Date */}
          <FormInput
            label="Ngày kết thúc"
            name="endDate"
            type="datetime-local"
            value={formData.endDate}
            onChange={handleChange}
            error={fieldErrors.endDate}
          />

          {/* Application Deadline */}
          <FormInput
            label="Hạn đăng ký"
            name="applicationDeadline"
            type="datetime-local"
            value={formData.applicationDeadline}
            onChange={handleChange}
            error={fieldErrors.applicationDeadline}
          />

          {/* Max Capacity */}
          <FormInput
            label="Sức chứa tối đa"
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
              Danh mục
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
            placeholder="Nhập URL ảnh bìa"
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
              <Save size={16} />
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
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