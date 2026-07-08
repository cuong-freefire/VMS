import PropTypes from 'prop-types';
import { AlertCircle } from 'lucide-react';

export default function ErrorState({
    title = 'Tải dữ liệu thất bại',
    message = 'Đã có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.',
    onRetry,
}) {
    return (
        <div style={containerStyle}>
            <AlertCircle size={48} style={{ color: 'var(--color-error)', marginBottom: 16 }} />
            <h3 style={titleStyle}>{title}</h3>
            <p style={messageStyle}>{message}</p>
            {onRetry && (
                <button
                    type="button"
                    className="btn-vms btn-vms-secondary"
                    style={{ padding: '7px 16px', fontSize: 'var(--font-size-small)' }}
                    onClick={onRetry}
                >
                    Thử lại
                </button>
            )}
        </div>
    );
}

ErrorState.propTypes = {
    title: PropTypes.string,
    message: PropTypes.string,
    onRetry: PropTypes.func,
};

const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-9) var(--space-4)',
    textAlign: 'center',
    gap: 8,
};

const titleStyle = {
    margin: 0,
    fontSize: 'var(--font-size-h3)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--text-primary)',
};

const messageStyle = {
    margin: 0,
    maxWidth: 400,
    fontSize: 'var(--font-size-small)',
    color: 'var(--text-secondary)',
};