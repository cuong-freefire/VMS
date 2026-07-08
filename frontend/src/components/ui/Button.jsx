import PropTypes from 'prop-types';

const variantClassMap = {
  primary: 'btn-vms-primary',
  secondary: 'btn-vms-secondary',
  dark: 'btn-vms-dark',
  danger: 'btn-vms-danger',
  ghost: 'btn-vms-ghost',
};

const sizeClassMap = {
  sm: 'btn-vms-sm',
  md: 'btn-vms-md',
  lg: 'btn-vms-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  children,
  style,
  ...rest
}) {
  const isDisabled = disabled || loading;
  const variantClass = variantClassMap[variant] || variantClassMap.primary;
  const sizeClass = sizeClassMap[size] || sizeClassMap.md;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      className={`btn-vms ${variantClass} ${sizeClass}`}
      style={{
        width: fullWidth ? '100%' : 'auto',
        ...style,
      }}
      {...rest}
    >
      {loading ? (
        <span className="btn-vms-spinner" />
      ) : (
        children
      )}
    </button>
  );
}

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'dark', 'danger', 'ghost']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  fullWidth: PropTypes.bool,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  type: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
};