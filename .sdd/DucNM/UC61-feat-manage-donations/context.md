# CONTEXT.md — Manage Donations (UC61)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-28

## 1. PROBLEM STATEMENT

Admin cần quản lý tất cả giao dịch quyên góp trong hệ thống — xem danh sách giao dịch, xem chi tiết giao dịch, xem tổng quan số liệu (tổng tiền, tổng giao dịch, tỷ lệ thành công). Nếu không có chức năng này, Admin không thể đối soát, theo dõi dòng tiền và báo cáo tài chính.

## 2. DOMAIN KNOWLEDGE

- **Admin-only:** Chức năng quản lý donation chỉ dành cho Admin.
- **Danh sách tất cả giao dịch:** Admin thấy tất cả donation, không giới hạn user.
- **Filter:** Hỗ trợ filter theo status, khoảng thời gian, payment_gateway.
- **Summary:** Endpoint riêng trả về tổng quan: total_donations, total_amount_success, total_transactions, success_rate (%).
- **Detail:** Xem chi tiết một giao dịch cụ thể (bao gồm gateway_response để đối soát).
- **Không thể sửa giao dịch:** Giao dịch Success là immutable — chỉ xem, không sửa/xóa.

## 3. STAKEHOLDERS

- **Admin:** Cần quản lý và đối soát giao dịch.
- **Finance (gián tiếp):** Nhận báo cáo từ Admin.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Admin-only:** Chỉ Admin. Manager, Staff, Volunteer → 403.
- **Read-only:** Không có endpoint write cho donation (không sửa/xóa).
- **API format:**
  - Danh sách: `GET /api/v1/donations` (Admin).
  - Summary: `GET /api/v1/donations/summary`.
  - Chi tiết: `GET /api/v1/donations/:id`.
- **Phân trang:** Có hỗ trợ.
- **Swagger:** Bắt buộc.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định Admin không cần sửa giao dịch (immutable theo business rules).
- Giả định `gateway_response` là JSON lưu phản hồi từ cổng thanh toán — chỉ Admin mới xem được.
- Giả định summary data được cache 5 phút (dùng chung cache với dashboard).

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Có cần endpoint export donation list cho Admin không?** Hay dùng UC57?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Export donation list dùng UC57 (type = "donations"). Không cần endpoint riêng.
