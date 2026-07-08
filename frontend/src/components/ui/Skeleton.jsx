import PropTypes from 'prop-types';

export default function Skeleton({ width = '100%', height = 16, style, ...rest }) {
    return (
        <div
            aria-hidden="true"
            style={{
                width,
                height,
                borderRadius: 'var(--radius-input)',
                animation: 'skeleton-pulse 1.5s ease-in-out infinite',
                ...style,
            }}
            {...rest}
        />
    );
}

Skeleton.propTypes = {
    width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    style: PropTypes.object,
};