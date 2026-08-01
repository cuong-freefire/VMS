import React, { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { skillService } from "../../../services/skill.service.js";
import useFormSubmit from "../../../hooks/useFormSubmit";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import FormInput from "../../ui/FormInput";

/* ------------------------------------------------------------------ */
/*  AddSkillPage                                                      */
/* ------------------------------------------------------------------ */
export default function AddSkillPage() {
  const navigate = useNavigate();
  const { isSubmitting, error, handleSubmit, clearError } = useFormSubmit();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
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
    if (!formData.name.trim()) {
      errors.name = "Tên kỹ năng không được để trống";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const onSubmit = useCallback(async () => {
    if (!validate()) return;

    const result = await handleSubmit(
      () => skillService.createSkill({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      }),
      "Tạo kỹ năng thành công"
    );

    if (result.success) {
      navigate("/admin/skills");
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
            Thêm kỹ năng mới
          </h1>
          <p style={{ fontSize: "var(--font-size-small)", color: "var(--text-secondary)", margin: "4px 0 0" }}>
            Tạo kỹ năng mới cho tình nguyện viên
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
            label="Tên kỹ năng *"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            error={fieldErrors.name}
            placeholder="Nhập tên kỹ năng"
          />

          {/* Description */}
          <FormInput
            label="Mô tả"
            name="description"
            type="text"
            value={formData.description}
            onChange={handleChange}
            error={fieldErrors.description}
            placeholder="Nhập mô tả (không bắt buộc)"
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
              {isSubmitting ? "Đang tạo..." : "Tạo kỹ năng"}
            </Button>
            <Link to="/admin/skills" style={{ textDecoration: "none" }}>
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