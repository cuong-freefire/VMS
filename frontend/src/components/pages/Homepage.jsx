import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartHandshake, CalendarCheck, Clock, Award } from 'lucide-react';
import { useAuth } from '../../contexts/authContext.context';
import Card from '../ui/Card';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import './Homepage.css';

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="homepage-unauth-container">
        <Card>
          <EmptyState 
            icon={HeartHandshake} 
            title="Vui lòng đăng nhập" 
            message="Đăng nhập để xem bảng điều khiển và tham gia các hoạt động tình nguyện." 
            action={<Button variant="primary" onClick={() => navigate('/login')}>Đăng nhập</Button>} 
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="homepage-container">
      <section className="homepage-hero">
        <div className="homepage-hero-bg" style={{ backgroundImage: 'url(/images/volunteer-event.jpg)' }} />
        <div className="homepage-hero-content">
          <h1 className="homepage-hero-title">Xin chào, {user?.full_name || 'Tình nguyện viên'}!</h1>
          <p className="homepage-hero-subtitle">Cảm ơn bạn đã là một phần của cộng đồng VMS.</p>
        </div>
      </section>

      <div className="homepage-content-wrapper">
        <div className="row g-4 m-0">
          {[{ icon: CalendarCheck, label: 'Sự kiện đã tham gia', val: '0' }, { icon: Clock, label: 'Giờ tình nguyện', val: '0' }, { icon: Award, label: 'Chứng nhận', val: '0' }].map((s, i) => (
            <div className="col-md-4" key={i}>
              <Card>
                <div className="homepage-stat-card">
                  <div className="homepage-stat-icon-wrapper">
                    <s.icon size={24} className="homepage-stat-icon" />
                  </div>
                  <div>
                    <div className="homepage-stat-value">{s.val}</div>
                    <div className="homepage-stat-label">{s.label}</div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <h2 className="homepage-section-title">Truy cập nhanh</h2>
          <div className="row g-3 m-0">
            {[{ title: 'Hồ sơ cá nhân', desc: 'Xem và chỉnh sửa thông tin cá nhân.', link: '/profile' }, { title: 'Lịch sử tình nguyện', desc: 'Xem các sự kiện đã tham gia.', link: '/history' }, { title: 'Sự kiện sắp tới', desc: 'Khám phá các sự kiện tình nguyện.', link: '/events' }].map((a, i) => (
              <div className="col-sm-6 col-lg-4" key={i}>
                <Card padding="var(--space-4)">
                  <h3 className="homepage-quick-card-title">{a.title}</h3>
                  <p className="homepage-quick-card-desc">{a.desc}</p>
                  <Button variant="secondary" size="sm" onClick={() => navigate(a.link)}>
                    {'Xem ' + (i === 0 ? 'hồ sơ' : i === 1 ? 'lịch sử' : 'sự kiện')}
                  </Button>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
