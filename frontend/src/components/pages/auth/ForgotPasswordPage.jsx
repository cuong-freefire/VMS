import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail } from 'lucide-react';
import { authService } from '../../../services/auth.service';
import FormInput from '../../ui/FormInput';
import PasswordInput from '../../ui/PasswordInput';
import OTPInput from '../../ui/OTPInput';
import Button from '../../ui/Button';
import useCountdown from '../../../hooks/useCountdown';
import { toast } from 'react-toastify';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { seconds, isActive, start } = useCountdown();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { email: '', otp: '', newPassword: '', confirmPassword: '' },
  });

  const handleRequest = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await authService.forgotPasswordRequest(data.email);
      setEmail(data.email);
      setStep(2);
      toast.success(res?.message || 'Nếu email tồn tại, OTP đã được gửi.');
      start(res?.data?.cooldown_seconds || 60);
    } catch (err) {
      if (err?.code === 'COOLDOWN_ACTIVE') start(err?.detail?.remaining_seconds || 60);
      toast.error(err?.message || 'Không thể gửi yêu cầu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (data) => {
    setIsSubmitting(true);
    try {
      await authService.forgotPasswordVerifyOtp({ email, otp: data.otp });
      setStep(3);
      toast.success('Mã OTP hợp lệ.');
    } catch (err) {
      toast.error(err?.message || 'Xác thực thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Mật khẩu mới và xác nhận không khớp.');
      return;
    }
    setIsSubmitting(true);
    try {
      await authService.forgotPasswordReset({ email, otp: data.otp, newPassword: data.newPassword });
      toast.success('Mật khẩu đã được đặt lại!');
      navigate('/login', { state: { passwordReset: true } });
    } catch (err) {
      toast.error(err?.message || 'Đặt lại mật khẩu thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsSubmitting(true);
    try {
      const res = await authService.forgotPasswordRequest(email);
      toast.success('Đã gửi lại mã OTP.');
      start(res?.data?.cooldown_seconds || 60);
    } catch (err) {
      toast.error(err?.message || 'Không thể gửi lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitle = { 1: 'Quên mật khẩu', 2: 'Xác thực OTP', 3: 'Đặt mật khẩu mới' };
  const stepDesc = {
    1: 'Nhập email đã đăng ký để nhận mã OTP.',
    2: 'Nhập mã OTP đã được gửi đến email của bạn.',
    3: 'Đặt mật khẩu mới cho tài khoản của bạn.',
  };

  return (
    <div>
      <h2 style={headerStyle}>{stepTitle[step]}</h2>
      <p style={descStyle}>{stepDesc[step]}</p>

      {/* Step indicator */}
      <div style={stepIndicatorStyle}>
        {[1, 2, 3].map((s) => (
          <div key={s} style={stepDotStyle(s <= step)} />
        ))}
      </div>

      {step === 1 && (
        <form onSubmit={handleSubmit(handleRequest)}>
          <FormInput
            label="Email"
            name="email"
            type="email"
            icon={Mail}
            register={register}
            rules={{ required: 'Vui lòng nhập email' }}
            placeholder="your@email.com"
            error={errors.email?.message}
          />
          <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting}>
            Gửi mã OTP
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit(handleVerifyOtp)}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label style={otpLabelStyle}>Mã OTP đã gửi đến {email}</label>
            <OTPInput value={watch('otp')} onChange={(val) => setValue('otp', val)} error={errors.otp?.message} />
          </div>
          <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting}>
            Xác nhận
          </Button>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            {isActive ? (
              <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--text-secondary)' }}>
                Gửi lại mã sau {seconds}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                style={resendBtnStyle}
              >
                Gửi lại mã
              </button>
            )}
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleSubmit(handleReset)}>
          <PasswordInput
            label="Mật khẩu mới"
            name="newPassword"
            register={register}
            rules={{ required: 'Vui lòng nhập mật khẩu mới' }}
            placeholder="Ít nhất 8 ký tự"
            error={errors.newPassword?.message}
            showStrength
            value={watch('newPassword') || ''}
          />
          <PasswordInput
            label="Xác nhận mật khẩu mới"
            name="confirmPassword"
            register={register}
            rules={{
              required: 'Vui lòng xác nhận mật khẩu mới',
              validate: (val) => watch('newPassword') !== val ? 'Mật khẩu xác nhận không khớp' : undefined,
            }}
            placeholder="Nhập lại mật khẩu mới"
            error={errors.confirmPassword?.message}
          />
          <PasswordRequirements pwd={watch('newPassword') || ''} />
          <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting}>
            Đặt lại mật khẩu
          </Button>
        </form>
      )}

      <p style={footerStyle}>
        <Link to="/login" style={backLinkStyle}>
          Quay lại đăng nhập
        </Link>
      </p>
    </div>
  );
}

function PasswordRequirements({ pwd }) {
  const reqs = [
    { met: pwd.length >= 8, label: 'Ít nhất 8 ký tự' },
    { met: /[A-Z]/.test(pwd), label: 'Ít nhất 1 chữ in hoa' },
    { met: /[a-z]/.test(pwd), label: 'Ít nhất 1 chữ thường' },
    { met: /[0-9]/.test(pwd), label: 'Ít nhất 1 chữ số' },
    { met: /[^A-Za-z0-9]/.test(pwd), label: 'Ít nhất 1 ký tự đặc biệt' },
  ];
  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      {reqs.map((r, i) => (
        <div key={i} style={reqItemStyle(r.met)}>
          <span style={reqDotStyle(r.met)}>{r.met ? '✓' : ''}</span>
          {r.label}
        </div>
      ))}
    </div>
  );
}

const headerStyle = {
  textAlign: 'center',
  fontSize: 'var(--font-size-body-large)',
  fontWeight: 'var(--font-weight-semibold)',
  color: 'var(--text-primary)',
  margin: '0 0 8px',
};

const descStyle = {
  textAlign: 'center',
  fontSize: 'var(--font-size-small)',
  color: 'var(--text-secondary)',
  margin: '0 0 var(--space-3)',
};

const stepIndicatorStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: 8,
  marginBottom: 'var(--space-4)',
};

const stepDotStyle = (active) => ({
  width: 32,
  height: 4,
  borderRadius: 2,
  background: active ? 'var(--green-accent)' : 'var(--surface-ceramic)',
  transition: 'background var(--transition-base)',
});

const otpLabelStyle = {
  display: 'block',
  fontSize: 'var(--font-size-small)',
  fontWeight: 'var(--font-weight-semibold)',
  color: 'var(--text-primary)',
  marginBottom: 8,
  textAlign: 'center',
};

const resendBtnStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--green-accent)',
  cursor: 'pointer',
  fontSize: 'var(--font-size-small)',
  fontWeight: 'var(--font-weight-semibold)',
  padding: 0,
  fontFamily: 'var(--font-primary)',
};

const footerStyle = {
  textAlign: 'center',
  marginTop: 'var(--space-4)',
  fontSize: 'var(--font-size-small)',
  color: 'var(--text-secondary)',
};

const backLinkStyle = {
  color: 'var(--green-accent)',
  fontWeight: 'var(--font-weight-semibold)',
  textDecoration: 'none',
};

const reqItemStyle = (met) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 'var(--font-size-micro)',
  color: met ? 'var(--green-accent)' : 'var(--text-tertiary)',
  marginBottom: 2,
});

const reqDotStyle = (met) => ({
  display: 'inline-block',
  width: 14,
  height: 14,
  borderRadius: '50%',
  background: met ? 'var(--green-accent)' : 'var(--surface-ceramic)',
  color: 'var(--surface-white)',
  fontSize: 10,
  lineHeight: '14px',
  textAlign: 'center',
  flexShrink: 0,
});