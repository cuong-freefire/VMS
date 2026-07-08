import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { User, Phone, Camera, Save, X } from 'lucide-react';
import { useAuth } from '../../../contexts/authContext.context';
import { userService } from '../../../services/user.service';
import FormInput from '../../ui/FormInput';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import { toast } from 'react-toastify';

export default function ProfileEditPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { fullName: user?.full_name || '', phoneNumber: user?.phone_number || user?.phone || '' } });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) { if (file.size > 5*1024*1024) { toast.error('Ảnh không được vượt quá 5MB.'); return; } setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);
        fd.append('full_name', data.fullName);
        fd.append('phone_number', data.phoneNumber);
        const res = await userService.updateProfileWithAvatar(fd);
        updateUser(res?.data || res);
      } else {
        const payload = {
          full_name: data.fullName,
          phone_number: data.phoneNumber,
        };
        const res = await userService.updateProfile(payload);
        updateUser(res?.data || res);
      }
      toast.success('Hồ sơ đã được cập nhật.'); navigate('/profile');
    } catch (err) { toast.error(err?.message || 'Cập nhật thất bại.'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div style={{ maxWidth: 500, margin: 'var(--space-6) auto', padding: '0 var(--space-4)' }}>
      <Card title="Chỉnh sửa hồ sơ" subtitle="Cập nhật thông tin cá nhân của bạn.">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
            <label style={{ cursor: 'pointer', display: 'inline-block', position: 'relative' }}>
              <div style={{ width: 96, height: 96, borderRadius: '50%%', backgroundColor: 'var(--green-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', overflow: 'hidden', fontSize: 'var(--font-size-jumbo)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-on-dark)' }}>
                {avatarPreview ? <img src={avatarPreview} alt="Avatar" style={{ width: '100%%', height: '100%%', objectFit: 'cover' }} /> : (user?.full_name?.[0]?.toUpperCase() || <User size={36} />)}
              </div>
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: '50%%', backgroundColor: 'var(--green-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-card)' }}><Camera size={14} style={{ color: 'var(--text-on-dark)' }} /></div>
              <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleAvatarChange} style={{ display: 'none' }} />
            </label>
          </div>
          <FormInput label="Họ và tên" name="fullName" icon={User} register={register} rules={{ required: 'Vui lòng nhập họ tên' }} placeholder="Nguyễn Văn A" error={errors.fullName?.message} />
          <FormInput label="Số điện thoại" name="phoneNumber" icon={Phone} register={register} rules={{ required: 'Vui lòng nhập số điện thoại' }} placeholder="0xxx xxx xxx" error={errors.phoneNumber?.message} />
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <Button type="button" variant="ghost" onClick={() => navigate('/profile')}><X size={16} /> Hủy</Button>
            <Button type="submit" variant="primary" loading={isSubmitting} style={{ flex: 1 }}><Save size={16} /> Lưu thay đổi</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}