import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../../../services/auth.service';
import PasswordInput from '../../ui/PasswordInput';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import { toast } from 'react-toastify';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }
    setIsSubmitting(true);
    try {
      await authService.changePassword(data);
      toast.success('Mật khẩu đã được thay đổi thành công.');
      navigate('/profile');
    } catch (err) {
      toast.error(err?.message || 'Đổi mật khẩu thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={pageContainerStyle}>
      <Card
        title="Đổi mật khẩu"
        subtitle="Cập nhật mật khẩu cho tài khoản của bạn."
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <PasswordInput
            label="Mật khẩu cũ"
            name="oldPassword"
            register={register}
            rules={{ required: 'Vui lòng nhập mật khẩu cũ' }}
            placeholder="Nhập mật khẩu cũ"
            error={errors.oldPassword?.message}
          />
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
              validate: (val) =>
                val !== watch('newPassword')
                  ? 'Mật khẩu xác nhận không khớp'
                  : undefined,
            }}
            placeholder="Nhập lại mật khẩu mới"
            error={errors.confirmPassword?.message}
          />
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/profile')}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              style={{ flex: 1 }}
            >
              Đổi mật khẩu
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

const pageContainerStyle = {
  maxWidth: 500,
  margin: 'var(--space-6) auto',
  padding: '0 var(--space-4)',
};