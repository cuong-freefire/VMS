import { useState } from 'react';
import PropTypes from 'prop-types';
import { Eye, EyeOff } from 'lucide-react';
import FormInput from './FormInput';

export default function PasswordInput({
  label,
  name,
  error,
  register,
  rules = {},
  showStrength = false,
  value = '',
  ...rest
}) {
  const [visible, setVisible] = useState(false);
  const strength = showStrength && value ? getStrength(value) : null;

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <FormInput
          label={label}
          name={name}
          type={visible ? 'text' : 'password'}
          error={error}
          register={register}
          rules={rules}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          aria-pressed={visible}
          style={toggleBtnStyle}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {showStrength && value && strength && (
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          {[1, 2, 3, 4].map((lvl) => (
            <div
              key={lvl}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: lvl <= strength.level ? strength.color : 'var(--surface-ceramic)',
                transition: 'background var(--transition-base)',
              }}
            />
          ))}
          <span
            style={{
              fontSize: 'var(--font-size-micro)',
              color: strength.color || 'var(--text-secondary)',
              marginLeft: 8,
              minWidth: 80,
            }}
          >
            {strength.label}
          </span>
        </div>
      )}
    </div>
  );
}

PasswordInput.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  error: PropTypes.string,
  register: PropTypes.func,
  rules: PropTypes.object,
  showStrength: PropTypes.bool,
  value: PropTypes.string,
};

function getStrength(pwd) {
  if (!pwd) return null;
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  const map = {
    1: { level: 1, label: 'Yếu', color: 'var(--color-error)' },
    2: { level: 2, label: 'Trung bình', color: 'var(--color-warning)' },
    3: { level: 3, label: 'Tốt', color: '#52c41a' },
    4: { level: 4, label: 'Mạnh', color: 'var(--green-accent)' },
  };
  return map[s] || map[1];
}

const toggleBtnStyle = {
  position: 'absolute',
  right: 8,
  top: 38,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--text-secondary)',
  padding: 6,
  display: 'flex',
  alignItems: 'center',
};