import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Calendar, Edit, Lock } from 'lucide-react';
import { useAuth } from '../../../contexts/authContext.context';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import LoadingSpinner from '../../ui/LoadingSpinner';

function formatDate(dateStr) {
  if (!dateStr) return '\u2014';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '\u2014';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return dd + '/' + mm + '/' + yyyy;
}

export default function ProfileViewPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading || !user) return <div style={{ maxWidth: 'var(--max-content-width)', margin: 'var(--space-6) auto', padding: '0 var(--space-4)' }}><LoadingSpinner message="Đang tải hồ sơ..." /></div>;

  const fields = [
    { icon: User, label: 'Họ và tên', value: user.full_name || 'Chưa cập nhật' },
    { icon: Mail, label: 'Email', value: user.email },
    { icon: Phone, label: 'Số điện thoại', value: user.phone_number || user.phone || 'Chưa cập nhật' },
    { icon: Calendar, label: 'Ngày tham gia', value: formatDate(user.created_at) },
  ];

  return (
    <div style={{ maxWidth: 600, margin: 'var(--space-6) auto', padding: '0 var(--space-4)' }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%%', backgroundColor: 'var(--green-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-3)', overflow: 'hidden', fontSize: 'var(--font-size-jumbo)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-on-dark)' }}>
            {user.avatar_url ? <img src={user.avatar_url} alt={user.full_name} style={{ width: '100%%', height: '100%%', objectFit: 'cover' }} /> : (user.full_name?.[0]?.toUpperCase() || <User size={36} />)}
          </div>
          <h1 style={{ fontSize: 'var(--font-size-h2)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', margin: '0 0 4px' }}>{user.full_name || 'Người dùng VMS'}</h1>
          <span style={{ fontSize: 'var(--font-size-small)', backgroundColor: 'var(--green-light)', color: 'var(--green-primary)', padding: '2px 12px', borderRadius: 'var(--radius-pill)', fontWeight: 'var(--font-weight-semibold)' }}>
            {
              user?.role_name === 'VOLUNTEER' ?
                'Tình nguyện viên'
                :
                user?.role_name === 'STAFF' ?
                'Nhân viên'
                :
                user?.role_name === 'MANAGER' ?
                'Người quản lý'
                :
                'ADMIN'
            }
          </span>
        </div>

        <div style={{ marginBottom: 'var(--space-4)' }}>
          {fields.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < fields.length - 1 ? '1px solid var(--surface-ceramic)' : 'none' }}>
              <f.icon size={20} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              <div><div style={{ fontSize: 'var(--font-size-micro)', color: 'var(--text-secondary)' }}>{f.label}</div><div style={{ fontSize: 'var(--font-size-body)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>{f.value}</div></div>
            </div>
          ))}
        </div>

        {user.skills && user.skills.length > 0 && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ fontSize: 'var(--font-size-micro)', color: 'var(--text-secondary)', marginBottom: 8 }}>Kỹ năng</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {user.skills.map((sk, i) => <span key={i} style={{ fontSize: 'var(--font-size-micro)', color: 'var(--green-accent)', backgroundColor: 'var(--green-light)', padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontWeight: 'var(--font-weight-semibold)' }}>{typeof sk === 'string' ? sk : sk.name}</span>)}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="primary" onClick={() => navigate('/profile/edit')} style={{ flex: 1 }}><Edit size={16} /> Chỉnh sửa hồ sơ</Button>
          <Button variant="secondary" onClick={() => navigate('/change-password')}><Lock size={16} /> Đổi mật khẩu</Button>
        </div>
      </Card>
    </div>
  );
}