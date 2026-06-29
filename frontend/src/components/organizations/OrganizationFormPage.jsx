/**
 * OrganizationFormPage Component
 *
 * Form thêm mới (UC39) và chỉnh sửa (UC40) tổ chức.
 * Dùng chung cho cả Add và Edit mode.
 * - Add mode: Tạo mới, sau đó chuyển hướng về danh sách (fetch lại dữ liệu mới)
 * - Edit mode: Cập nhật, sau đó chuyển hướng về chi tiết (fetch lại dữ liệu mới)
 *
 * @module components/organizations/OrganizationFormPage
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';
import organizationService from '../../services/organization.service';

function OrganizationFormPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    logo_url: '',
    description: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch dữ liệu cũ nếu là edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchOrganization = async () => {
        setFetching(true);
        try {
          const result = await organizationService.getOrganizationById(id);
          setFormData({
            name: result.name || '',
            email: result.email || '',
            phone: result.phone || '',
            address: result.address || '',
            website: result.website || '',
            logo_url: result.logo_url || '',
            description: result.description || '',
            is_active: result.is_active,
          });
        } catch (err) {
          setError(err.message || 'Không thể tải thông tin tổ chức.');
        } finally {
          setFetching(false);
        }
      };
      fetchOrganization();
    }
  }, [id, isEditMode]);

  /**
   * Xử lý thay đổi input.
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  /**
   * Xử lý submit form.
   * Sau khi thành công, chuyển hướng về danh sách (add) hoặc chi tiết (edit).
   * Dữ liệu trên màn hình sẽ được fetch lại nhờ component re-mount.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isEditMode) {
        await organizationService.updateOrganization(id, formData);
        setSuccessMessage('Cập nhật tổ chức thành công!');
        // Chuyển hướng về trang chi tiết — component sẽ fetch lại dữ liệu mới
        setTimeout(() => navigate(`/organizations/${id}`), 500);
      } else {
        await organizationService.createOrganization(formData);
        setSuccessMessage('Tạo tổ chức thành công!');
        // Chuyển hướng về danh sách — component sẽ fetch lại dữ liệu mới
        setTimeout(() => navigate('/organizations'), 500);
      }
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Xử lý hủy.
   */
  const handleCancel = () => {
    if (isEditMode) {
      navigate(`/organizations/${id}`);
    } else {
      navigate('/organizations');
    }
  };

  if (fetching) {
    return (
      <div className="container mt-4 text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
        <p className="mt-2 text-muted">Đang tải thông tin tổ chức...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <h2 className="mb-4">
            {isEditMode ? 'Chỉnh sửa tổ chức' : 'Thêm tổ chức mới'}
          </h2>

          {/* Error message */}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {/* Success message */}
          {successMessage && (
            <div className="alert alert-success" role="alert">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Tên tổ chức */}
            <div className="mb-3">
              <label htmlFor="name" className="form-label">
                Tên tổ chức <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                maxLength={255}
                placeholder="Nhập tên tổ chức"
              />
            </div>

            {/* Email */}
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email liên hệ</label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="info@example.com"
              />
            </div>

            {/* Số điện thoại */}
            <div className="mb-3">
              <label htmlFor="phone" className="form-label">Số điện thoại</label>
              <input
                type="text"
                className="form-control"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0901234567"
                maxLength={20}
              />
            </div>

            {/* Địa chỉ */}
            <div className="mb-3">
              <label htmlFor="address" className="form-label">Địa chỉ</label>
              <input
                type="text"
                className="form-control"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Đường ABC, Quận 1, TP.HCM"
                maxLength={500}
              />
            </div>

            {/* Website */}
            <div className="mb-3">
              <label htmlFor="website" className="form-label">Website</label>
              <input
                type="url"
                className="form-control"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://example.com"
              />
            </div>

            {/* Logo URL */}
            <div className="mb-3">
              <label htmlFor="logo_url" className="form-label">Logo URL</label>
              <input
                type="url"
                className="form-control"
                id="logo_url"
                name="logo_url"
                value={formData.logo_url}
                onChange={handleChange}
                placeholder="https://cloudinary.com/logo.jpg"
              />
              {formData.logo_url && (
                <div className="mt-2">
                  <img
                    src={formData.logo_url}
                    alt="Preview logo"
                    style={{ maxHeight: '80px' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
            </div>

            {/* Mô tả */}
            <div className="mb-3">
              <label htmlFor="description" className="form-label">Mô tả</label>
              <textarea
                className="form-control"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                maxLength={2000}
                placeholder="Giới thiệu về tổ chức..."
              />
            </div>

            {/* Trạng thái active (chỉ hiển thị ở edit mode) */}
            {isEditMode && (
              <div className="mb-3 form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="is_active">
                  Đang hoạt động
                </label>
                <div className="form-text text-muted">
                  Bỏ chọn để vô hiệu hóa tổ chức (soft-delete).
                  Chỉ thực hiện khi tổ chức không còn sự kiện đang hoạt động.
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Đang xử lý...
                  </>
                ) : (
                  isEditMode ? 'Cập nhật' : 'Tạo mới'
                )}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={loading}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

OrganizationFormPage.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number,
    role: PropTypes.string,
  }),
};

export default OrganizationFormPage;