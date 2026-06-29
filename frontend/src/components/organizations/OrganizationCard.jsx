/**
 * OrganizationCard Component
 *
 * Hiển thị thông tin tóm tắt của một tổ chức trong danh sách.
 * Bao gồm: tên, email, trạng thái active/inactive, số lượng sự kiện.
 *
 * @module components/organizations/OrganizationCard
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

function OrganizationCard({ organization }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/organizations/${organization.id}`);
  };

  return (
    <div
      className="card mb-3 organization-card"
      style={{ cursor: 'pointer', opacity: organization.is_active ? 1 : 0.6 }}
      onClick={handleClick}
    >
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h5 className="card-title mb-1">
              {organization.name}
              {!organization.is_active && (
                <span className="badge bg-secondary ms-2">Inactive</span>
              )}
            </h5>
            {organization.email && (
              <p className="card-text text-muted mb-1">
                <small>{organization.email}</small>
              </p>
            )}
          </div>
          <span className="badge bg-primary rounded-pill">
            {organization.event_count} sự kiện
          </span>
        </div>
        {organization.description && (
          <p className="card-text mt-2">
            {organization.description.length > 150
              ? `${organization.description.substring(0, 150)}...`
              : organization.description}
          </p>
        )}
        <div className="d-flex justify-content-between align-items-center mt-2">
          <small className="text-muted">
            Ngày tạo: {new Date(organization.created_at).toLocaleDateString('vi-VN')}
          </small>
          {organization.phone && (
            <small className="text-muted">{organization.phone}</small>
          )}
        </div>
      </div>
    </div>
  );
}

OrganizationCard.propTypes = {
  organization: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string,
    phone: PropTypes.string,
    description: PropTypes.string,
    is_active: PropTypes.bool.isRequired,
    event_count: PropTypes.number,
    created_at: PropTypes.string,
  }).isRequired,
};

export default OrganizationCard;