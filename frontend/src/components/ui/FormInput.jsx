import PropTypes from 'prop-types';

export default function FormInput({
  label,
  name,
  type = 'text',
  error,
  register,
  rules = {},
  icon: Icon,
  className = '',
  ...rest
}) {
  const hasError = Boolean(error);

  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          style={{
            display: 'block',
            fontSize: 'var(--font-size-small)',
            fontWeight: 'var(--font-weight-semibold)',
            color: hasError ? 'var(--color-error)' : 'var(--text-primary)',
            marginBottom: 'var(--space-1)',
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {Icon && (
          <span style={iconWrapperStyle}>
            <Icon size={18} />
          </span>
        )}
        <input
          id={name}
          type={type}
          className={`input-vms ${hasError ? 'input-error' : ''} ${Icon ? 'input-vms-has-icon' : ''}`}
          {...(register ? register(name, rules) : {})}
          {...rest}
        />
      </div>
      {error && (
        <p style={errorMessageStyle}>{error}</p>
      )}
    </div>
  );
}

FormInput.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
  error: PropTypes.string,
  register: PropTypes.func,
  rules: PropTypes.object,
  icon: PropTypes.elementType,
  className: PropTypes.string,
};

const iconWrapperStyle = {
  position: 'absolute',
  left: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--text-secondary)',
  display: 'flex',
  alignItems: 'center',
  pointerEvents: 'none',
  zIndex: 1,
};

const errorMessageStyle = {
  margin: '4px 0 0',
  fontSize: 'var(--font-size-small)',
  color: 'var(--color-error)',
};