import { useNavigate } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { useAuth } from '../../contexts/authContext.context';
import { roleRouteMap } from '../../constants/roles';
import Button from '../ui/Button';
import Card from '../ui/Card';

export default function UnauthorizedPage() {
  const { roleName, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fallbackPath = isAuthenticated && roleName
    ? (roleRouteMap[roleName] || '/home')
    : '/';

  return (
    <div style={containerStyle}>
      <Card style={{ textAlign: 'center', padding: 'var(--space-6) var(--space-5)', maxWidth: 480, width: '100%' }}>
        <ShieldX size={56} style={{ color: 'var(--color-error)', marginBottom: 'var(--space-4)' }} />
        <h1 style={headingStyle}>403 — Không có quyền truy cập</h1>
        <p style={subStyle}>
          {isAuthenticated
            ? `Bạn không có quyền truy cập trang này với vai trò hiện tại${roleName ? ` (${roleName})` : ''}.`
            : 'Vui lòng đăng nhập để truy cập trang này.'}
        </p>
        <Button variant="primary" onClick={() => navigate(fallbackPath, { replace: true })}>
          {isAuthenticated ? 'Quay về trang chủ' : 'Đăng nhập'}
        </Button>
      </Card>
    </div>
  );
}

const containerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '60vh',
  padding: 'var(--space-4)',
};

const headingStyle = {
  fontSize: 'var(--font-size-body-large)',
  fontWeight: 'var(--font-weight-bold)',
  color: 'var(--text-primary)',
  margin: '0 0 var(--space-3)',
};

const subStyle = {
  fontSize: 'var(--font-size-small)',
  color: 'var(--text-secondary)',
  margin: '0 0 var(--space-5)',
  lineHeight: 1.6,
};