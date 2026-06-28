# CONTEXT.md — Event Statistics (UC55)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-28

## 1. PROBLEM STATEMENT

Admin và Manager cần thống kê chi tiết về sự kiện: số lượng sự kiện theo thời gian, tỷ lệ hoàn thành, sự kiện phổ biến nhất. Dữ liệu này giúp đánh giá hiệu quả tổ chức sự kiện, xác định xu hướng và lập kế hoạch cho tương lai. Nếu không có thống kê sự kiện, các quyết định về sự kiện dựa trên cảm tính thay vì dữ liệu.

## 2. DOMAIN KNOWLEDGE

- **Event Statistics:** Dữ liệu aggregate từ bảng Event và Application.
- **Các chỉ số:**
  - Số lượng sự kiện theo tháng (trong khoảng thời gian chọn).
  - Tỷ lệ sự kiện hoàn thành (Completed / Total).
  - Top 5 sự kiện có nhiều người đăng ký nhất.
- **Filter theo thời gian:** Hỗ trợ chọn năm hoặc khoảng thời gian tùy chỉnh (start_date, end_date).
- **Read-only:** Chỉ GET.
- **Phân quyền:** Admin toàn hệ thống, Manager trong phạm vi tổ chức.

## 3. STAKEHOLDERS

- **Admin:** Cần thống kê để đánh giá hiệu quả sự kiện toàn hệ thống.
- **Manager:** Cần thống kê cho sự kiện thuộc tổ chức mình.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Read-only:** Endpoint `GET /api/v1/dashboard/event-stats`.
- **Performance:** Dùng database aggregation, tối ưu với index.
- **Cache:** TTL 5 phút (dùng chung cache với dashboard).
- **Phân quyền:** Chỉ Admin và Manager.
- **Swagger:** Bắt buộc.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định bảng Event có `created_at` và `status` để thống kê theo thời gian.
- Giả định bảng Application có `event_id` và `status` để đếm số lượng đăng ký.
- Giả định khoảng thời gian mặc định là năm hiện tại nếu không truyền tham số.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Top event:** Top 5 sự kiện có nhiều người đăng ký nhất — tính theo application approved hay tất cả application?
2. **Filter:** Ngoài thời gian, có cần filter theo organization không?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Tính theo application có status = Approved (đã duyệt thực sự tham gia).
- **A2:** Không cần filter theo organization trong UC55 — phân quyền Manager đã tự động filter. Admin thấy tất cả.
