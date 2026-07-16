# CONTEXT.md — View Category List (UC31)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-30

## 1. PROBLEM STATEMENT

Hệ thống VMS có các danh mục (Category) để phân loại sự kiện — ví dụ: địa điểm tổ chức, thời gian tổ chức, loại hình sự kiện (giáo dục, môi trường, y tế...). Manager cần xem danh sách các danh mục này để quản lý và tham chiếu khi phân loại sự kiện. Nếu không có chức năng này, Manager không thể biết hệ thống đang có những danh mục nào.

## 2. DOMAIN KNOWLEDGE

- **Category (Danh mục):** Là các nhóm phân loại sự kiện. Ví dụ: "Giáo dục", "Môi trường", "Y tế", "Miền Bắc", "Miền Nam".
- **Phân quyền xem:** Manager có toàn quyền CRUD với Category. Admin cũng có thể xem.
  - **Guest**: Xem categories active (public, không cần auth) — phục vụ UC11 Filter Event
  - **Volunteer**: Xem categories active — phục vụ UC11 Filter Event
  - **Staff**: Xem categories active — tham chiếu khi tạo sự kiện
  - **Manager/Admin**: Xem tất cả (active + inactive)
- **Soft-delete:** Category cũng sử dụng soft-delete (is_active) như các master data khác.

## 3. STAKEHOLDERS

- **Manager:** Cần xem danh sách danh mục để quản lý và cập nhật.
- **Admin:** Có thể xem danh sách danh mục để kiểm tra.
- **Staff:** Cần xem danh mục active để phân loại sự kiện.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Phân quyền:** 
  - Guest: Xem categories active (public, không cần auth)
  - Volunteer: Xem categories active
  - Staff: Xem categories active
  - Manager/Admin: Xem tất cả (active + inactive)
- **API format:** Endpoint là `GET /api/v1/categories`. Có thể public cho Guest (không auth) hoặc có auth cho các role cao hơn.
- **Swagger:** Bắt buộc có Swagger JSDoc đầy đủ.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định bảng Category đã có trong schema với các trường: `category_id`, `name`, `description`, `type`, `is_active`, `created_at`, `updated_at`.
- Giả định trường `type` dùng để phân loại category (ví dụ: location, event_type, time_frame).

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Phân trang:** Danh sách category có cần phân trang không?
2. **Staff visibility:** Staff có thấy cả category inactive không?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Không cần phân trang ở v1 vì số lượng danh mục thường ít (dưới 50).
- **A2:** Staff chỉ thấy category active. Manager và Admin thấy tất cả.