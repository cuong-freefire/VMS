import PropTypes from 'prop-types';

export default function Card({ title, subtitle, padding = 'var(--space-3)', children, style, className, ...rest }) {
  return (
    <div className={`card-vms${className ? ` ${className}` : ''}`} style={{ padding, ...style }} {...rest}>
      {title && (
        <h3 className="card-vms-title">{title}</h3>
      )}
      {subtitle && (
        <p className="card-vms-subtitle">{subtitle}</p>
      )}
      {children}
    </div>
  );
}

Card.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  padding: PropTypes.string,
  children: PropTypes.node,
};