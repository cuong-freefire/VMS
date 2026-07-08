import PropTypes from 'prop-types';
import { Inbox } from 'lucide-react';
import './EmptyState.css';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Không có dữ liệu',
  message = 'Hiện tại chưa có dữ liệu nào để hiển thị.',
  action,
}) {
  return (
    <div className="vms-empty-state">
      <Icon size={48} className="vms-empty-state-icon" />
      <h3 className="vms-empty-state-title">{title}</h3>
      <p className="vms-empty-state-message">{message}</p>
      {action && (
        <div className="vms-empty-state-action">
          {action}
        </div>
      )}
    </div>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string,
  message: PropTypes.string,
  action: PropTypes.node,
};