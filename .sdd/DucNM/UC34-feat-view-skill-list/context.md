# CONTEXT.md — View Skill List (UC34)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-30

## 1. PROBLEM STATEMENT

Hệ thống VMS quản lý kỹ năng (Skill) của tình nguyện viên — ví dụ: giao tiếp, tiếng Anh, PowerPoint,... Manager cần xem danh sách kỹ năng để quản lý và tham chiếu khi gán kỹ năng cho tình nguyện viên. Nếu không có chức năng này, Manager không thể biết hệ thống đang có những kỹ năng nào.

## 2. DOMAIN KNOWLEDGE

- **Skill (Kỹ năng):** Là các kỹ năng mà tình nguyện viên có thể đăng ký. Ví dụ: "Giao tiếp", "Tiếng Anh", "PowerPoint", "Lập trình".
- **Phân quyền xem:** Manager có toàn quyền CRUD. Admin có thể xem. Staff có thể xem để tham chiếu. Volunteer có thể xem để gán kỹ năng cho profile.
- **Soft-delete:** Skill sử dụng soft-delete (is_active).

## 3. STAKEHOLDERS

- **Manager:** Cần xem danh sách kỹ năng để quản lý.
- **Staff:** Cần xem để tham chiếu.
- **Volunteer:** Cần xem để gán kỹ năng cho profile của mình.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Phân quyền:** Manager, Admin, Staff, Volunteer có quyền xem. Guest bị từ chối.
- **API format:** Endpoint là `GET /api/v1/skills`.
- **Swagger:** Bắt buộc.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định bảng Skill đã có trong schema với các trường: `skill_id`, `name`, `description`, `is_active`, `created_at`.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Phân trang:** Có cần phân trang không?
2. **Volunteer visibility:** Volunteer có thấy skill inactive không?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Không cần phân trang vì số lượng skill thường ít (dưới 50).
- **A2:** Volunteer và Staff chỉ thấy skill active. Manager và Admin thấy tất cả.