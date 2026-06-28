# CONTEXT.md — View Organization List (UC37)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-28

## 1. PROBLEM STATEMENT

Hệ thống VMS có nhiều tổ chức (Organization) khác nhau đứng ra chủ quản các sự kiện tình nguyện. Admin cần có một trang danh sách để nắm được tổng thể tất cả tổ chức đang hoạt động hoặc đã bị vô hiệu hóa. Manager và Staff khi tạo sự kiện cũng cần tra cứu danh sách tổ chức hợp lệ để gán vào sự kiện. Nếu không có chức năng xem danh sách này, Admin không thể giám sát, Manager không thể báo cáo theo đơn vị tổ chức, và Staff không biết tổ chức nào còn hoạt động.

## 2. DOMAIN KNOWLEDGE

- **Organization (Tổ chức):** Là đơn vị chủ quản của một hoặc nhiều sự kiện tình nguyện. Mỗi tổ chức có tên duy nhất, thông tin liên hệ và trạng thái hoạt động.
- **Soft-delete:** Tổ chức bị vô hiệu hóa (`is_active: false`) vẫn tồn tại trong hệ thống nhưng không được tạo sự kiện mới. Dữ liệu lịch sử được giữ nguyên.
- **Phân quyền xem:** Admin thấy toàn bộ tổ chức (bao gồm cả inactive). Manager và Staff chỉ thấy tổ chức đang active. Volunteer và Guest không có quyền truy cập.

## 3. STAKEHOLDERS

- **Admin:** Cần xem toàn bộ danh sách tổ chức (active + inactive) để giám sát và quản lý.
- **Manager:** Cần xem danh sách tổ chức active để hỗ trợ lọc báo cáo theo đơn vị tổ chức.
- **Staff (khi tạo sự kiện):** Cần chọn tổ chức chủ quản từ danh sách active khi tạo/sửa sự kiện.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Phân quyền:** Chỉ Admin, Manager, Staff mới có quyền truy cập. Volunteer và Guest bị từ chối HTTP 403.
- **Soft-delete visibility:** Admin thấy cả active lẫn inactive. Manager/Staff chỉ thấy active.
- **API format:** Endpoint bắt buộc là `GET /api/v1/organizations` với prefix chuẩn dự án.
- **Swagger:** Bắt buộc có Swagger JSDoc đầy đủ cho endpoint này.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định bảng Organization đã có trong schema với các trường: `organization_id`, `name`, `description`, `address`, `contact_phone`, `contact_email`, `website`, `logo_url`, `is_active`, `created_at`.
- Giả định middleware xác thực JWT và phân quyền đã hoạt động từ module Auth (UC03).
- Giả định danh sách tổ chức không quá lớn nên không cần phân trang bắt buộc ở v1, nhưng nên có để mở rộng.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Phân trang:** Danh sách tổ chức có cần phân trang (pagination) không? Hay trả về tất cả cùng lúc?
2. **Tìm kiếm:** Trang danh sách có cho phép tìm kiếm theo tên tổ chức không?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Có hỗ trợ phân trang (page, limit). Mặc định limit = 20. Trả toàn bộ nếu không truyền tham số cũng được chấp nhận ở v1.
- **A2:** Có hỗ trợ tìm kiếm theo tên tổ chức (query param `search`). Tìm kiếm không phân biệt hoa/thường.
