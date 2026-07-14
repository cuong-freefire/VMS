// Homepage.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartHandshake, CalendarCheck, Clock, Award, Sparkles, User, History, CalendarDays } from 'lucide-react';
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
        <Card className="hover-card">
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
        <div className="homepage-hero-decoration">
          <Sparkles size={220} strokeWidth={0.5} />
        </div>
        <div className="homepage-hero-content">
          <div className="homepage-hero-text">
            <h1 className="homepage-hero-title">Xin chào, {user?.full_name || 'Tình nguyện viên'}!</h1>
            <p className="homepage-hero-subtitle">
              Cảm ơn bạn đã là một phần của cộng đồng VMS. Cùng nhau, chúng ta sẽ tiếp tục tạo nên những thay đổi tích cực cho xã hội.
            </p>
          </div>
          <div className="homepage-hero-image-wrapper">
            <div className="hero-image-composition">
              <img 
                src="/images/volunteer-event1.jpg" 
                alt="Hoạt động cộng đồng" 
                className="hero-img img-top-left"
              />
              <img 
                src="/images/homepageVolunteer.jpg" 
                alt="Tình nguyện viên" 
                className="hero-img hero-img-main"
              />
              <img 
                src="/images/happy-childs.jpg" 
                alt="Trẻ em vui vẻ" 
                className="hero-img img-bottom-right"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="homepage-content-wrapper">
        <div className="row g-4 m-0">
          {[
            { icon: CalendarCheck, label: 'Sự kiện đã tham gia', val: '0' }, 
            { icon: Clock, label: 'Giờ tình nguyện', val: '0' }, 
            { icon: Award, label: 'Chứng nhận', val: '0' }
          ].map((s, i) => (
            <div className="col-md-4" key={i}>
              <Card className="hover-card">
                <div className="homepage-stat-card">
                  <div className="homepage-stat-icon-wrapper">
                    <s.icon size={28} className="homepage-stat-icon" />
                  </div>
                  <div className="homepage-stat-info">
                    <div className="homepage-stat-value">{s.val}</div>
                    <div className="homepage-stat-label">{s.label}</div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>

        <div className="homepage-quick-access">
          <h2 className="homepage-section-title">Truy cập nhanh</h2>
          <div className="row g-4 m-0">
            {[
              { 
                title: 'Hồ sơ cá nhân', 
                desc: 'Xem và cập nhật thông tin cá nhân của bạn.', 
                link: '/profile', 
                actionText: 'Quản lý hồ sơ', 
                icon: User 
              }, 
              { 
                title: 'Lịch sử tình nguyện', 
                desc: 'Theo dõi lại danh sách các sự kiện bạn đã đóng góp.', 
                link: '/history', 
                actionText: 'Xem lịch sử', 
                icon: History 
              }, 
              { 
                title: 'Sự kiện sắp tới', 
                desc: 'Khám phá và đăng ký tham gia các sự kiện mới nhất.', 
                link: '/events', 
                actionText: 'Tìm sự kiện', 
                icon: CalendarDays 
              }
            ].map((a, i) => (
              <div className="col-sm-6 col-lg-4" key={i}>
                <Card padding="var(--space-5)" className="hover-card quick-card">
                  <div className="quick-card-content">
                    <div className="quick-card-icon-header">
                      <a.icon size={24} />
                    </div>
                    <h3 className="homepage-quick-card-title">{a.title}</h3>
                    <p className="homepage-quick-card-desc">{a.desc}</p>
                  </div>
                  <Button variant="secondary" size="md" onClick={() => navigate(a.link)} className="quick-card-btn">
                    {a.actionText}
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