import { Link } from 'react-router-dom';
import Button from '../ui/Button';

export default function NotFoundPage() {
  return (
    <div style={containerStyle}>
      <span style={codeStyle}>404</span>
      <h1 style={titleStyle}>Trang không tồn tại</h1>
      <p style={descStyle}>
        Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
      </p>
      <Link to="/">
        <Button variant="primary">Quay về trang chủ</Button>
      </Link>
    </div>
  );
}

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '60vh',
  padding: 'var(--space-4)',
  textAlign: 'center',
  gap: 16,
  backgroundColor: 'var(--surface-warm)',
};

const codeStyle = {
  fontSize: 'var(--font-size-display)',
  fontWeight: 'var(--font-weight-bold)',
  color: 'var(--green-primary)',
  lineHeight: 1,
};

const titleStyle = {
  margin: 0,
  fontSize: 'var(--font-size-h2)',
  fontWeight: 'var(--font-weight-semibold)',
  color: 'var(--text-primary)',
};

const descStyle = {
  margin: 0,
  maxWidth: 400,
  fontSize: 'var(--font-size-small)',
  color: 'var(--text-secondary)',
};