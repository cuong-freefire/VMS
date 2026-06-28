# CONTEXT.md — View Donation History (UC60)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-28

## 1. PROBLEM STATEMENT

Người dùng đã quyên góp cho các sự kiện cần xem lịch sử các giao dịch đã thực hiện để theo dõi các khoản đóng góp, kiểm tra trạng thái, và xem chi tiết từng giao dịch. Nếu không có chức năng này, người dùng không biết mình đã quyên góp bao nhiêu và cho sự kiện nào.

## 2. DOMAIN KNOWLEDGE

- **My Donations:** Mỗi user chỉ thấy giao dịch quyên góp của chính mình.
- **Danh sách giao dịch:** Sắp xếp mới nhất lên đầu, hiển thị số tiền, sự kiện, cổng thanh toán, trạng thái, ngày tạo.
- **Filter:** Hỗ trợ lọc theo trạng thái (success, failed, pending, cancelled).
- **Phân trang:** Hỗ trợ page/limit.
- **Phân quyền:** User đã đăng nhập mới được xem. Guest → 401.

## 3. STAKEHOLDERS

- **Volunteer/Người dùng:** Cần theo dõi lịch sử quyên góp cá nhân.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **API format:** `GET /api/v1/donations/my-donations`.
- **Phân quyền:** Chỉ user sở hữu. Không xem được của người khác.
- **Phân trang:** Mặc định limit = 20.
- **Filter:** Hỗ trợ query param `status`.
- **Guest:** HTTP 401.
- **Swagger:** Bắt buộc.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định user chỉ xem được donation của mình — không có quyền xem của user khác.
- Giả định Admin có endpoint riêng để xem tất cả donation (UC61).

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Không có câu hỏi mở — nghiệp vụ đã rõ ràng.**

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Không có câu hỏi mở.
