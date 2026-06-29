/**
 * OrganizationListPage Component
 *
 * Trang danh sách tổ chức (UC37).
 * Hiển thị danh sách với phân trang, tìm kiếm, và nút thêm mới (Admin).
 * Sau khi thêm/sửa thành công, tự động fetch lại dữ liệu mới nhất.
 *
 * @module components/organizations/OrganizationListPage
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import OrganizationCard from './OrganizationCard';
import organizationService from '../../services/organization.service';

function OrganizationListPage({ user }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [organizations, setOrganizations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total_items: 0, total_pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');

  // Lấy page từ URL params
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  /**
   * Fetch danh sách tổ chức từ API.
   * Sử dụng useCallback để tránh tạo hàm mới mỗi lần render.
   */
  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await organizationService.getOrganizations({
        page: currentPage,
        limit: 20,
        search: search.trim(),
      });
      setOrganizations(result.items || []);
      setPagination(result.pagination || { page: 1, limit: 20, total_items: 0, total_pages: 0 });
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách tổ chức.');
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search]);

  // Fetch khi component mount hoặc page/search thay đổi
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  /**
   * Xử lý tìm kiếm.
   * Reset về trang 1 khi tìm kiếm.
   */
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ search, page: '1' });
  };

  /**
   * Xử lý chuyển trang.
   */
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.total_pages) return;
    setSearchParams({ search, page: newPage.toString() });
  };

  /**
   * Xử lý thêm mới tổ chức (Admin only).
   * Sau khi tạo thành công, fetch lại danh sách.
   */
  const handleAdd = () => {
    navigate('/organizations/add');
  };

  /**
   * Render phân trang.
   */
  const renderPagination = () => {
    if (pagination.total_pages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= pagination.total_pages; i++) {
      pages.push(
        <li key={i} className={`page-item ${i === currentPage ? 'active' : ''}`}>
          <button className="page-link" onClick={() => handlePageChange(i)}>
            {i}
          </button>
        </li>
      );
    }

    return (
      <nav aria-label="Phân trang">
        <ul className="pagination justify-content-center">
          <li className={`page-item ${currentPage <= 1 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>
              Trước
            </button>
          </li>
          {pages}
          <li className={`page-item ${currentPage >= pagination.total_pages ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>
              Sau
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Danh sách tổ chức</h2>
        {user?.role === 'ADMIN' && (
          <button className="btn btn-primary" onClick={handleAdd}>
            + Thêm tổ chức
          </button>
        )}
      </div>

      {/* Form tìm kiếm */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Tìm kiếm theo tên tổ chức..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn btn-outline-secondary" type="submit">
            Tìm kiếm
          </button>
          {search && (
            <button
              className="btn btn-outline-danger"
              type="button"
              onClick={() => {
                setSearch('');
                setSearchParams({ page: '1' });
              }}
            >
              Xóa
            </button>
          )}
        </div>
      </form>

      {/* Loading */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p className="mt-2 text-muted">Đang tải danh sách tổ chức...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Danh sách rỗng */}
      {!loading && !error && organizations.length === 0 && (
        <div className="text-center py-5">
          <p className="text-muted">
            {search
              ? 'Không tìm thấy tổ chức nào phù hợp.'
              : 'Chưa có tổ chức nào. Hãy thêm tổ chức đầu tiên!'}
          </p>
        </div>
      )}

      {/* Danh sách tổ chức */}
      {!loading && organizations.length > 0 && (
        <>
          <div className="row">
            {organizations.map((org) => (
              <div key={org.id} className="col-md-6 col-lg-4">
                <OrganizationCard organization={org} />
              </div>
            ))}
          </div>

          {/* Thông tin tổng số */}
          <div className="text-center text-muted mb-3">
            <small>
              Hiển thị {organizations.length} / {pagination.total_items} tổ chức
            </small>
          </div>

          {/* Phân trang */}
          {renderPagination()}
        </>
      )}
    </div>
  );
}

OrganizationListPage.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number,
    role: PropTypes.string,
  }),
};

export default OrganizationListPage;