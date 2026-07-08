import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, User, Phone } from 'lucide-react';
import { authService } from '../../../services/auth.service';
import FormInput from '../../ui/FormInput';
import PasswordInput from '../../ui/PasswordInput';
import OTPInput from '../../ui/OTPInput';
import Button from '../../ui/Button';
import useCountdown from '../../../hooks/useCountdown';
import { toast } from 'react-toastify';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { seconds, isActive, start } = useCountdown();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { email: '', otp: '', fullName: '', phoneNumber: '', password: '', confirmPassword: '' },
  });
  const passwordValue = watch('password');

  const handleSendOtp = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await authService.registerSendOtp(data.email);
      setEmail(data.email);
      setStep(2);
      toast.success(res?.message || 'Mã OTP đã được gửi.');
      start(res?.data?.cooldown_seconds || 60);
    } catch (err) {
      const msg = err?.message || 'Không thể gửi OTP.';
      if (err?.code === 'EMAIL_ALREADY_EXISTS') toast.warning(msg);
      else toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (data) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Mật khẩu và xác nhận mật khẩu không khớp.');
      return;
    }
    setIsSubmitting(true);
    try {
      await authService.registerVerifyOtp({
        email,
        otp: data.otp,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        password: data.password,
      });
      toast.success('Đăng ký thành công!');
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      const msg = err?.message || 'Xác thực thất bại.';
      if (err?.code === 'OTP_EXPIRED') {
        toast.error(msg);
        setStep(1);
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsSubmitting(true);
    try {
      const res = await authService.registerSendOtp(email);
      toast.success('Đã gửi lại mã OTP.');
      start(res?.data?.cooldown_seconds || 60);
    } catch (err) {
      toast.error(err?.message || 'Không thể gửi lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 style={headerStyle}>Đăng ký</h2>
      <p style={descStyle}>
        {step === 1
          ? 'Nhập email để nhận mã xác thực OTP.'
          : 'Nhập mã OTP và thông tin cá nhân để hoàn tất đăng ký.'}
      </p>

      {step === 1 ? (
        <form onSubmit={handleSubmit(handleSendOtp)}>
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
      ) : (
        <form onSubmit={handleSubmit(handleVerifyOtp)}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label style={otpLabelStyle}>Mã OTP đã gửi đến {email}</label>
            <OTPInput value={watch('otp')} onChange={(val) => setValue('otp', val)} error={errors.otp?.message} />
          </div>
          <FormInput
            label="Họ và tên"
            name="fullName"
            icon={User}
            register={register}
            rules={{ required: 'Vui lòng nhập họ tên', minLength: { value: 2, message: 'Họ tên tối thiểu 2 ký tự' } }}
            placeholder="Nguyễn Văn A"
            error={errors.fullName?.message}
          />
          <FormInput
            label="Số điện thoại"
            name="phoneNumber"
            icon={Phone}
            register={register}
            rules={{ required: 'Vui lòng nhập số điện thoại' }}
            placeholder="0xxx xxx xxx"
            error={errors.phoneNumber?.message}
          />
          <PasswordInput
            label="Mật khẩu"
            name="password"
            register={register}
            rules={{ required: 'Vui lòng nhập mật khẩu' }}
            placeholder="Ít nhất 8 ký tự"
            error={errors.password?.message}
            showStrength
            value={passwordValue || ''}
          />
          <PasswordInput
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            register={register}
            rules={{
              required: 'Vui lòng xác nhận mật khẩu',
              validate: (val) => val !== watch('password') ? 'Mật khẩu xác nhận không khớp' : undefined,
            }}
            placeholder="Nhập lại mật khẩu"
            error={errors.confirmPassword?.message}
          />
          <PasswordRequirements pwd={passwordValue || ''} />
          <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting}>
            Đăng ký
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

      <p style={footerStyle}>
        Đã có tài khoản?{' '}
        <Link to="/login" style={{ color: 'var(--green-accent)', fontWeight: 'var(--font-weight-semibold)', textDecoration: 'none' }}>
          Đăng nhập
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
  margin: '0 0 var(--space-5)',
};

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