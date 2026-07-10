import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Construction, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/authContext.context';
import { roleRouteMap } from '../../constants/roles';
import Button from '../ui/Button';
import Card from '../ui/Card';

export default function PlaceholderPage({ title, member }) {
  const { roleName } = useAuth();
  const navigate = useNavigate();

  const backPath = roleName ? (roleRouteMap[roleName] || '/home') : '/';

  return (
    <div style={containerStyle}>
      <Card style={{ textAlign: 'center', padding: 'var(--space-6) var(--space-5)', maxWidth: 480, width: '100%' }}>
        <Construction size={48} style={{ color: 'var(--gold)', marginBottom: 'var(--space-4)' }} />
        <h1 style={headingStyle}>{title}</h1>
        <p style={subStyle}>
          Trang này đang được phát triển bởi <strong>{member}</strong>.
        </p>
        <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(backPath, { replace: true })}>
          Quay lại
        </Button>
      </Card>
    </div>
  );
}

PlaceholderPage.propTypes = {
  title: PropTypes.string.isRequired,
  member: PropTypes.string.isRequired,
};

const containerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '60vh',
  padding: 'var(--space-4)',
};

const headingStyle = {
  fontSize: 'var(--font-size-body-large)',
  fontWeight: 'var(--font-weight-semibold)',
  color: 'var(--text-primary)',
  margin: '0 0 var(--space-2)',
};

const subStyle = {
  fontSize: 'var(--font-size-small)',
  color: 'var(--text-secondary)',
  margin: '0 0 var(--space-5)',
  lineHeight: 1.6,
};