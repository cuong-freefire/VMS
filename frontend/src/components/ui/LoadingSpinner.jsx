import PropTypes from 'prop-types';

export default function LoadingSpinner({ message = 'Đang tải...' }) {
  return (
    <div style={containerStyle}>
      <div style={spinnerStyle} />
      {message && (
        <p style={textStyle}>{message}</p>
      )}
    </div>
  );
}

LoadingSpinner.propTypes = {
  message: PropTypes.string,
};

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 200,
  gap: 16,
};

const spinnerStyle = {
  width: 40,
  height: 40,
  border: '3px solid var(--surface-ceramic)',
  borderTopColor: 'var(--green-accent)',
  borderRadius: '50%',
  animation: 'btn-spin 0.7s linear infinite',
};

const textStyle = {
  margin: 0,
  fontSize: 'var(--font-size-small)',
  color: 'var(--text-secondary)',
};