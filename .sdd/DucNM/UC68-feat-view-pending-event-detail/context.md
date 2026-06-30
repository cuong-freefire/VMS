# CONTEXT.md — View Pending Event Detail (UC68)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-30

## 1. PROBLEM STATEMENT

Khi Manager xem danh sách sự kiện PENDING (UC67), họ cần xem chi tiết từng sự kiện để có đủ thông tin trước khi đưa ra quyết định phê duyệt hoặc từ chối. Nếu không có chức năng xem chi tiết, Manager phải đoán hoặc mở nhiều màn hình để kiểm tra thông tin, gây chậm trễ trong quy trình xét duyệt.

## 2. DOMAIN KNOWLEDGE

- **Event Detail:** Thông tin chi tiết sự kiện bao gồm: tên, mô tả, tổ chức chủ quản, danh mục, ngày giờ, địa điểm, sức chứa, kỹ năng yêu cầu, trạng thái.
- **Phân quyền:** Chỉ Manager và Admin mới có quyền xem chi tiết sự kiện PENDING.
- **Quyết định:** Trang chi tiết là nơi Manager đưa ra quyết định APPROVE hoặc REJECT.

## 3. STAKEHOLDERS

- **Manager:** Cần xem chi tiết sự kiện để đánh giá và quyết định.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Phân quyền:** Chỉ Manager và Admin.
- **API format:** Endpoint là `GET /api/v1/events/:id` (có thể dùng chung với UC09).
- **Swagger:** Bắt buộc.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định endpoint GET /api/v1/events/:id đã tồn tại từ UC09 (View Event Detail), chỉ cần mở rộng phân quyền cho Manager xem cả event PENDING.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Endpoint riêng:** Có cần endpoint riêng cho event PENDING không?
2. **Thông tin bổ sung:** Có cần hiển thị thông tin Staff tạo event không?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Tái sử dụng endpoint `GET /api/v1/events/:id` từ UC09. Chỉ cần đảm bảo Manager có quyền xem event PENDING.
- **A2:** Có hiển thị thông tin người tạo (created_by) để Manager biết ai đã tạo sự kiện.