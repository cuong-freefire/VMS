import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail } from 'lucide-react';
import { useAuth } from '../../contexts/authContext.context';
import { roleRouteMap } from '../../constants/roles';
import FormInput from '../ui/FormInput';
import PasswordInput from '../ui/PasswordInput';
import Button from '../ui/Button';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const userData = await login(data);
      const from = location.state?.from || roleRouteMap[userData.role_name] || '/home';
      navigate(from, { replace: true });
    } catch (err) {
      const code = err?.code;
      const msg = err?.message || 'Đã xảy ra lỗi.';
      if (code === 'ACCOUNT_LOCKED') toast.warning(msg, { autoClose: 8000 });
      else toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 style={headerStyle}>Đăng nhập</h2>
      <p style={subHeaderStyle}>Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục.</p>

      <form onSubmit={handleSubmit(onSubmit)}>
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
        <PasswordInput
          label="Mật khẩu"
          name="password"
          register={register}
          rules={{ required: 'Vui lòng nhập mật khẩu' }}
          placeholder="Nhập mật khẩu"
          error={errors.password?.message}
        />

        <div style={{ textAlign: 'right', marginBottom: 'var(--space-4)' }}>
          <Link
            to="/forgot-password"
            style={forgotLinkStyle}
          >
            Quên mật khẩu?
          </Link>
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting}>
          Đăng nhập
        </Button>
      </form>

      <p style={footerTextStyle}>
        Chưa có tài khoản?{' '}
        <Link to="/register" style={footerLinkStyle}>
          Đăng ký
        </Link>
      </p>
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

const subHeaderStyle = {
  textAlign: 'center',
  fontSize: 'var(--font-size-small)',
  color: 'var(--text-secondary)',
  margin: '0 0 var(--space-5)',
};

const forgotLinkStyle = {
  fontSize: 'var(--font-size-small)',
  color: 'var(--green-accent)',
  textDecoration: 'none',
};

const footerTextStyle = {
  textAlign: 'center',
  marginTop: 'var(--space-4)',
  fontSize: 'var(--font-size-small)',
  color: 'var(--text-secondary)',
};

const footerLinkStyle = {
  color: 'var(--green-accent)',
  fontWeight: 'var(--font-weight-semibold)',
  textDecoration: 'none',
};