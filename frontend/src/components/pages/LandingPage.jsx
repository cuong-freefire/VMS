import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Award, Users, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/authContext.context';
import './LandingPage.css';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing-page-container">
      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-bg" style={{ backgroundImage: 'url(/images/volunteer-team.jpg)' }} />
        <div className="landing-hero-content">
          <h1 className="landing-hero-title">
            Kết nối đam mê<br />Lan tỏa yêu thương
          </h1>
          <p className="landing-hero-subtitle">
            Tham gia cùng hàng ngàn tình nguyện viên trên khắp cả nước. Mỗi hành động nhỏ đều tạo nên thay đổi lớn.
          </p>
          <div className="d-flex gap-3 flex-wrap">
            {isAuthenticated ? (
              <Link to="/home">
                <Button variant="primary" size="lg">Bảng điều khiển <ArrowRight size={18} /></Button>
              </Link>
            ) : (
              <>
                <Link to="/register"><Button variant="primary" size="lg">Tham gia ngay</Button></Link>
                <Link to="/login"><Button variant="dark" size="lg">Tìm hiểu thêm</Button></Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="landing-stats-section">
        <div className="landing-stats-container">
          {[{ v:'5,000+', l:'Tình nguyện viên' }, { v:'200+', l:'Sự kiện' }, { v:'50,000+', l:'Giờ tình nguyện' }].map((s,i) => (
            <div key={i} className="landing-stat-item">
              <div className="landing-stat-value">{s.v}</div>
              <div className="landing-stat-label">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="landing-benefits-section">
        <div className="landing-benefits-container">
          <h2 className="landing-benefits-title">Tại sao chọn VMS?</h2>
          <div className="row g-4 m-0">
            {[{ i:Heart, t:'Kết nối cộng đồng', d:'Tìm kiếm và tham gia các sự kiện tình nguyện phù hợp với kỹ năng và sở thích của bạn.' }, { i:Award, t:'Chứng nhận minh bạch', d:'Nhận chứng nhận điện tử sau mỗi sự kiện hoàn thành, dễ dàng chia sẻ và xác thực.' }, { i:Users, t:'Phát triển kỹ năng', d:'Học hỏi kỹ năng mới, mở rộng mạng lưới quan hệ qua các hoạt động cộng đồng.' }].map((b,i) => (
              <div className="col-md-4" key={i}>
                <div className="landing-benefit-card">
                  <div className="landing-benefit-icon-wrapper">
                    <b.i size={28} className="landing-benefit-icon" />
                  </div>
                  <h3 className="landing-benefit-card-title">{b.t}</h3>
                  <p className="landing-benefit-card-desc">{b.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="landing-impact-section">
        <div className="landing-impact-container">
          <div className="landing-impact-image" style={{ backgroundImage: 'url(/images/happy-childs.jpg)' }} />
          <div className="landing-impact-content">
            <h2 className="landing-impact-title">Mỗi hành động nhỏ<br />tạo nên thay đổi lớn</h2>
            <p className="landing-impact-desc">Từ những bữa ăn ấm áp đến những lớp học tình thương, mỗi đóng góp của bạn đều góp phần xây dựng một xã hội tốt đẹp hơn. Hãy cùng chúng tôi lan tỏa yêu thương đến mọi miền đất nước.</p>
            {!isAuthenticated && <div><Link to="/register"><Button variant="primary">Bắt đầu ngay</Button></Link></div>}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta-section">
        <h2 className="landing-cta-title">Sẵn sàng tham gia?</h2>
        <p className="landing-cta-desc">Đăng ký ngay hôm nay để trở thành một phần của cộng đồng tình nguyện viên năng động và nhiệt huyết.</p>
        <div className="d-flex gap-3 justify-content-center flex-wrap">
          {isAuthenticated ? <Link to="/home"><Button variant="primary" size="lg">Đi đến bảng điều khiển</Button></Link>
            : <><Link to="/register"><Button variant="primary" size="lg">Đăng ký</Button></Link><Link to="/login"><Button variant="secondary" size="lg">Đăng nhập</Button></Link></>}
        </div>
      </section>
    </div>
  );
}
