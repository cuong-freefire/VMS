export default function Footer() {
    return (
        <footer className="bg-dark text-light mt-auto" >
            <div className="container py-5">
                <div className="row g-4">

                    <div className="col-lg-4">
                        <h4 className="fw-bold">VMS</h4>
                        <p className="text-secondary mb-0">
                            Kết nối tình nguyện viên với các chương trình cộng đồng,
                            giúp lan tỏa giá trị nhân văn và tạo ra những tác động tích cực
                            cho xã hội.
                        </p>
                    </div>

                    <div className="col-6 col-lg-2">
                        <h6 className="fw-semibold mb-3">Hệ thống</h6>
                        <ul className="list-unstyled">
                            <li><a href="#" className="text-secondary text-decoration-none">Trang chủ</a></li>
                            <li><a href="#" className="text-secondary text-decoration-none">Sản phẩm</a></li>
                            <li><a href="#" className="text-secondary text-decoration-none">Bảng giá</a></li>
                        </ul>
                    </div>

                    <div className="col-6 col-lg-2">
                        <h6 className="fw-semibold mb-3">Hỗ trợ</h6>
                        <ul className="list-unstyled">
                            <li><a href="#" className="text-secondary text-decoration-none">Liên hệ</a></li>
                            <li><a href="#" className="text-secondary text-decoration-none">FAQ</a></li>
                            <li><a href="#" className="text-secondary text-decoration-none">Điều khoản</a></li>
                        </ul>
                    </div>

                    <div className="col-lg-4">
                        <h6 className="fw-semibold mb-3">Liên hệ</h6>
                        <p className="text-secondary mb-2">
                            📍 Hà Nội, Việt Nam
                        </p>
                        <p className="text-secondary mb-2">
                            📧 support@example.com
                        </p>
                        <p className="text-secondary mb-0">
                            📞 0123 456 789
                        </p>
                    </div>

                </div>

                <hr className="border-secondary my-4" />

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
                    <p className="text-secondary mb-2 mb-md-0">
                        © 2026 Beer Manager. All rights reserved.
                    </p>

                    <div>
                        <a href="#" className="text-secondary me-3 text-decoration-none">Facebook</a>
                        <a href="#" className="text-secondary me-3 text-decoration-none">Instagram</a>
                        <a href="#" className="text-secondary text-decoration-none">GitHub</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}