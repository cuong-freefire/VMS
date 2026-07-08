import React from "react";
import { Link } from "react-router-dom";
import { Heart, Target, Shield, HandHelping, Users, Eye, ArrowRight } from "lucide-react";
import Button from "../ui/Button";
import { useAuth } from "../../contexts/authContext.context";
import "./AboutPage.css";

export default function AboutPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="about-page-container">
      {/* HERO */}
      <section className="about-hero">
        <div className="about-hero-bg" style={{ backgroundImage: "url(/images/volunteer-team.jpg)" }} />
        <div className="about-hero-content">
          <h1 className="about-hero-title">Về Chúng Tôi</h1>
          <p className="about-hero-subtitle">
            Sứ mệnh của chúng tôi là kết nối những trái tim thiện nguyện, xây dựng một cộng đồng đoàn kết và lan tỏa giá trị tốt đẹp đến mọi miền đất nước.
          </p>
        </div>
      </section>

      {/* SỨ MỆNH & TẦM NHÌN */}
      <section className="about-mission-section">
        <div className="about-mission-container">
          <div className="row g-4 m-0">
            <div className="col-md-6">
              <div className="about-mission-card">
                <div className="about-mission-icon-wrapper">
                  <Target size={32} className="about-mission-icon" />
                </div>
                <h2 className="about-mission-title">Sứ Mệnh</h2>
                <p className="about-mission-desc">
                  Xây dựng nền tảng kết nối tình nguyện viên với các tổ chức và sự kiện cộng đồng trên toàn quốc.
                  Chúng tôi tin rằng mỗi hành động nhỏ, khi được nhân lên bởi hàng ngàn trái tim, sẽ tạo nên sức mạnh thay đổi xã hội.
                </p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="about-mission-card">
                <div className="about-mission-icon-wrapper">
                  <Eye size={32} className="about-mission-icon" />
                </div>
                <h2 className="about-mission-title">Tầm Nhìn</h2>
                <p className="about-mission-desc">
                  Trở thành hệ thống quản lý tình nguyện viên hàng đầu Việt Nam, nơi mọi người dễ dàng tìm thấy cơ hội cống hiến
                  và mọi tổ chức đều có thể kết nối với nguồn lực tình nguyện chất lượng, minh bạch và hiệu quả.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GIÁ TRỊ CỐT LÕI */}
      <section className="about-values-section">
        <div className="about-values-container">
          <h2 className="about-values-section-title">Giá Trị Cốt Lõi</h2>
          <p className="about-values-section-subtitle">Những nguyên tắc định hướng mọi hoạt động của chúng tôi</p>
          <div className="row g-4 m-0">
            {[
              { icon: Heart, title: "Yêu Thương", desc: "Lòng nhân ái là nguồn cảm hứng cho mọi hoạt động tình nguyện. Chúng tôi đặt tình yêu thương con người làm trung tâm." },
              { icon: Shield, title: "Minh Bạch", desc: "Mọi hoạt động, từ đăng ký đến điểm danh và cấp chứng nhận, đều được ghi nhận công khai và có thể xác thực." },
              { icon: HandHelping, title: "Cống Hiến", desc: "Khuyến khích tinh thần sẵn sàng chia sẻ thời gian, kỹ năng và tâm huyết vì cộng đồng, không vụ lợi." },
              { icon: Users, title: "Đoàn Kết", desc: "Sức mạnh tập thể tạo nên những thay đổi lớn lao. Chúng tôi kết nối mọi người vì mục tiêu chung." },
            ].map((v, i) => (
              <div className="col-lg-3 col-sm-6" key={i}>
                <div className="about-value-card">
                  <div className="about-value-icon-wrapper">
                    <v.icon size={28} className="about-value-icon" />
                  </div>
                  <h3 className="about-value-card-title">{v.title}</h3>
                  <p className="about-value-card-desc">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HÀNH TRÌNH CỦA CHÚNG TÔI */}
      <section className="about-story-section">
        <div className="about-story-container">
          <div className="about-story-image" style={{ backgroundImage: "url(/images/volunteer-event.jpg)" }} />
          <div className="about-story-content">
            <h2 className="about-story-title">Hành Trình<br />Của Chúng Tôi</h2>
            <p className="about-story-desc">
              Bắt đầu từ một nhóm nhỏ những người trẻ đam mê hoạt động cộng đồng, VMS đã phát triển thành một nền tảng
              kết nối hàng ngàn tình nguyện viên với hơn 200 sự kiện mỗi năm trên khắp cả nước.
            </p>
            <p className="about-story-desc">
              Từ những chương trình thiện nguyện nhỏ tại địa phương đến các chiến dịch quy mô quốc gia, chúng tôi luôn
              nỗ lực mang đến trải nghiệm tình nguyện chuyên nghiệp, ý nghĩa và đầy cảm hứng cho mọi người.
            </p>
            {!isAuthenticated && (
              <div>
                <Link to="/register">
                  <Button variant="primary">Tham gia cùng chúng tôi</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ĐỘI NGŨ */}
      <section className="about-team-section">
        <div className="about-team-container">
          <h2 className="about-team-section-title">Đội Ngũ Của Chúng Tôi</h2>
          <p className="about-team-section-subtitle">Những con người đầy nhiệt huyết đứng sau VMS</p>
          <div className="about-team-image-wrapper">
            <div className="about-team-image" style={{ backgroundImage: "url(/images/volunteer-team2.jpg)" }} />
          </div>
          <p className="about-team-desc">
            Chúng tôi là tập thể những kỹ sư, nhà thiết kế và những người yêu thích hoạt động xã hội,
            cùng chung một niềm tin rằng công nghệ có thể tạo ra tác động tích cực cho cộng đồng.
            Mỗi thành viên trong đội ngũ đều mang trong mình ngọn lửa đam mê và cam kết
            xây dựng một nền tảng tốt nhất cho cộng đồng tình nguyện Việt Nam.
          </p>
        </div>
      </section>

      {/* THỐNG KÊ */}
      <section className="about-stats-section">
        <div className="about-stats-container">
          {[
            { value: "5,000+", label: "Tình Nguyện Viên" },
            { value: "200+", label: "Sự Kiện Đã Tổ Chức" },
            { value: "50,000+", label: "Giờ Tình Nguyện" },
            { value: "63", label: "Tỉnh Thành" },
          ].map((s, i) => (
            <div key={i} className="about-stat-item">
              <div className="about-stat-value">{s.value}</div>
              <div className="about-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta-section">
        <h2 className="about-cta-title">Sẵn Sàng Tạo Nên Khác Biệt?</h2>
        <p className="about-cta-desc">
          Hãy tham gia cùng chúng tôi ngay hôm nay. Mỗi đóng góp của bạn đều có ý nghĩa.
        </p>
        <div className="d-flex gap-3 justify-content-center flex-wrap">
          {isAuthenticated ? (
            <Link to="/home">
              <Button variant="primary" size="lg">Đi đến bảng điều khiển <ArrowRight size={18} /></Button>
            </Link>
          ) : (
            <>
              <Link to="/register">
                <Button variant="primary" size="lg">Đăng Ký Ngay</Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg">Đăng Nhập</Button>
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
