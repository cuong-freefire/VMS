import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

export default function OTPInput({ value, onChange, error, disabled = false, length = 6 }) {
  const refs = useRef([]);
  useEffect(() => { refs.current = refs.current.slice(0, length); }, [length]);

  const handleChange = (index, e) => {
    const char = e.target.value.replace(/[^0-9]/g, '').slice(-1);
    const newVal = (value || '').split('');
    newVal[index] = char;
    onChange(newVal.join(''));
    if (char && index < length - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !value?.[index] && index > 0) refs.current[index - 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
    onChange(pasted);
    if (pasted.length === length) refs.current[length - 1]?.focus();
    else refs.current[pasted.length]?.focus();
  };

  const inputStyle = (isErr) => ({
    width: 48, height: 56, textAlign: 'center', fontSize: 'var(--font-size-h2)', fontFamily: 'var(--font-primary)',
    fontWeight: 'var(--font-weight-semibold)', letterSpacing: 'var(--letter-spacing-normal)', color: 'var(--text-primary)',
    backgroundColor: disabled ? 'var(--surface-ceramic)' : 'var(--surface-white)',
    border: '1.5px solid ' + (isErr ? 'var(--color-error)' : '#d6dbde'), borderRadius: 'var(--radius-input)',
    outline: 'none', transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)', boxShadow: 'none',
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {Array.from({ length }).map((_, i) => (
          <input key={i} ref={(el) => { refs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1}
            value={value?.[i] || ''} disabled={disabled}
            onChange={(e) => handleChange(i, e)} onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            aria-label={'OTP digit ' + (i + 1)}
            style={inputStyle(!!error)}
            onFocus={(e) => { e.currentTarget.style.borderColor = error ? 'var(--color-error)' : 'var(--green-accent)'; e.currentTarget.style.boxShadow = error ? '0 0 0 3px var(--color-error-tint)' : '0 0 0 3px rgba(0,117,74,0.12)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = error ? 'var(--color-error)' : '#d6dbde'; e.currentTarget.style.boxShadow = 'none'; }} />
        ))}
      </div>
      {error && <p style={{ margin: '8px 0 0', textAlign: 'center', fontSize: 'var(--font-size-small)', color: 'var(--color-error)' }}>{error}</p>}
    </div>
  );
}

OTPInput.propTypes = { value: PropTypes.string, onChange: PropTypes.func.isRequired, error: PropTypes.string, disabled: PropTypes.bool, length: PropTypes.number };
