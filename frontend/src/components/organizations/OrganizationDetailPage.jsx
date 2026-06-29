/**
 * OrganizationDetailPage Component
 *
 * Trang chi tiết tổ chức (UC38).
 * Hiển thị đầy đủ thông tin tổ chức + 10 sự kiện gần nhất.
 * Admin thấy cả inactive. Manager/Staff inactive → 404.
 * Có nút chỉnh sửa cho Admin, đưa về form edit.
 * Sau khi chỉnh sửa thành công và quay lại, tự động fetch lại dữ liệu mới.
 *
 * @module components/organizations/OrganizationDetailPage
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import organizationService from '../../services/organization.service';

function OrganizationDetailPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch chi tiết tổ chức.
   */
  const fetchOrganization = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await organizationService.getOrganizationById(id);
      setOrganization(result);
    } catch (err) {
      if (err.status === 404) {
        setError('Không tìm thấy tổ chức.');
      } else {
        setError(err.message || 'Không thể tải thông tin tổ chức.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch khi component mount hoặc id thay đổi
  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization, location.key]); // location.key giúp re-fetch khi quay lại từ edit

  /**
   * Xử lý chỉnh sửa (Admin only).
   */
  const handleEdit = () => {
    navigate(`/organizations/${id}/edit`);
  };

  /**
   * Xử lý quay lại danh sách.
   */
  const handleBack = () => {
    navigate('/organizations');
  };

  /**
   * Render trạng thái.
   */
  const renderStatus = (status) => {
    const statusMap = {
      DRAFT: { label: 'Nháp', class: 'bg-secondary' },
      PUBLISHED: { label: 'Đã xuất bản', class: 'bg-primary' },
      IN_PROGRESS: { label: 'Đang diễn ra', class: 'bg-success' },
      COMPLETED: { label: 'Đã hoàn thành', class: 'bg-info' },
      CANCELLED: { label: 'Đã hủy', class: 'bg-danger' },
    };
    const s = statusMap[status] || { label: status, class: 'bg-secondary' };
    return <span className={`badge ${s.class}`}>{s.label}</span>;
  };

  if (loading) {
    return (
      <div className="container mt-4 text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
        <p className="mt-2 text-muted">Đang tải thông tin tổ chức...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <button className="btn btn-secondary" onClick={handleBack}>
          Quay lại danh sách
        </button>
      </div>
    );
  }

  if (!organization) return null;

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button className="btn btn-outline-secondary me-2" onClick={handleBack}>
            &larr; Quay lại
          </button>
        </div>
        <h2 className="mb-0">{organization.name}</h2>
        {user?.role === 'ADMIN' && (
          <button className="btn btn-primary" onClick={handleEdit}>
            Chỉnh sửa
          </button>
        )}
      </div>

      {/* Thông tin cơ bản */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Thông tin cơ bản</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p><strong>Tên tổ chức:</strong> {organization.name}</p>
              {organization.email && <p><strong>Email:</strong> {organization.email}</p>}
              {organization.phone && <p><strong>Số điện thoại:</strong> {organization.phone}</p>}
              {organization.website && (
                <p>
                  <strong>Website:</strong>{' '}
                  <a href={organization.website} target="_blank" rel="noopener noreferrer">
                    {organization.website}
                  </a>
                </p>
              )}
            </div>
            <div className="col-md-6">
              <p>
                <strong>Trạng thái:</strong>{' '}
                {organization.is_active ? (
                  <span className="badge bg-success">Đang hoạt động</span>
                ) : (
                  <span className="badge bg-secondary">Đã vô hiệu hóa</span>
                )}
              </p>
              <p><strong>Số sự kiện:</strong> {organization.event_count}</p>
              <p>
                <strong>Ngày tạo:</strong>{' '}
                {new Date(organization.created_at).toLocaleDateString('vi-VN')}
              </p>
              <p>
                <strong>Cập nhật lần cuối:</strong>{' '}
                {new Date(organization.updated_at).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>
          {organization.address && (
            <p><strong>Địa chỉ:</strong> {organization.address}</p>
          )}
          {organization.description && (
            <div className="mt-2">
              <strong>Mô tả:</strong>
              <p className="mt-1">{organization.description}</p>
            </div>
          )}
          {organization.logo_url && (
            <div className="mt-2">
              <strong>Logo:</strong>
              <br />
              <img
                src={organization.logo_url}
                alt={`Logo ${organization.name}`}
                style={{ maxHeight: '100px', marginTop: '8px' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Danh sách sự kiện gần nhất */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Sự kiện gần nhất ({organization.recent_events?.length || 0})</h5>
        </div>
        <div className="card-body">
          {organization.recent_events && organization.recent_events.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Tên sự kiện</th>
                    <th>Ngày bắt đầu</th>
                    <th>Ngày kết thúc</th>
                    <th>Trạng thái</th>
                    <th>Địa điểm</th>
                    <th>SL đăng ký</th>
                  </tr>
                </thead>
                <tbody>
                  {organization.recent_events.map((event) => (
                    <tr key={event.id}>
                      <td>{event.title}</td>
                      <td>{new Date(event.start_date).toLocaleDateString('vi-VN')}</td>
                      <td>{new Date(event.end_date).toLocaleDateString('vi-VN')}</td>
                      <td>{renderStatus(event.status)}</td>
                      <td>{event.location}</td>
                      <td>{event.approved_participants}/{event.max_capacity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted mb-0">Chưa có sự kiện nào.</p>
          )}
        </div>
      </div>
    </div>
  );
}

OrganizationDetailPage.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number,
    role: PropTypes.string,
  }),
};

export default OrganizationDetailPage;