# CONTEXT.md — Organization Management (UC37–UC40)

# Người viết: [Member Name] | Ngày: 2026-06-26

## 1. PROBLEM STATEMENT

Hệ thống VMS có nhiều tổ chức (organization) khác nhau tổ chức các sự kiện tình nguyện. Để quản lý và phân biệt các sự kiện theo đơn vị chủ quản, hệ thống cần một module quản lý tổ chức cho phép Admin thao tác CRUD cơ bản (xem danh sách, xem chi tiết, thêm mới, chỉnh sửa). Nếu không có module này, thông tin tổ chức sẽ bị phân tán, thiếu nhất quán, và không thể gán sự kiện với tổ chức cụ thể, gây khó khăn trong việc báo cáo theo đơn vị tổ chức.

## 2. DOMAIN KNOWLEDGE

- **Organization (Tổ chức):** Là đơn vị chủ quản của một hoặc nhiều sự kiện tình nguyện. Mỗi tổ chức có thông tin định danh như tên, mô tả, địa chỉ, thông tin liên hệ.
- **Soft-delete:** Tổ chức bị vô hiệu hóa (xóa mềm — `is_active: false`) sẽ không được phép tạo sự kiện mới nhưng dữ liệu lịch sử vẫn được giữ nguyên.
- **Admin-only scope:** Chức năng quản lý tổ chức chỉ dành riêng cho Admin. Admin có toàn quyền CRUD; Manager có thể xem danh sách và chi tiết.

## 3. STAKEHOLDERS

- **Admin:** Cần quản lý toàn bộ tổ chức (thêm, sửa, xem danh sách, xem chi tiết).
- **Manager:** Cần xem danh sách và chi tiết tổ chức để hỗ trợ báo cáo.
- **Staff (khi tạo sự kiện):** Cần chọn tổ chức chủ quản cho sự kiện — do đó cần danh sách tổ chức active để tham chiếu.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Soft-delete:** Bắt buộc dùng xóa mềm qua cờ `is_active: false`. Không hard-delete vật lý bản ghi Organization.
- **Ràng buộc tham chiếu:** Không thể vô hiệu hóa (soft-delete) tổ chức nếu tổ chức đó vẫn còn sự kiện đang hoạt động (status chưa phải Completed/Cancelled). Hệ thống phải kiểm tra và báo lỗi 409 Conflict.
- **API format:** Bắt buộc dùng prefix `/api/v1/organizations` và áp dụng Zod validation cho mọi write operation.
- **Logging:** Mọi thao tác thêm/sửa/vô hiệu hóa tổ chức bắt buộc ghi audit log.
- **Swagger:** Bắt buộc có comment Swagger JSDoc đầy đủ cho tất cả endpoint CRUD.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định bảng Organization đã có sẵn trong Prisma schema với các trường cơ bản: `name`, `description`, `address`, `contact_phone`, `contact_email`, `website`, `logo_url`, `is_active`.
- Giả định chỉ Admin mới có quyền thêm/sửa/vô hiệu hóa; Manager và Staff chỉ có quyền xem.
- Giả định không có quy tắc nghiệp vụ phức tạp nào khác ngoài soft-delete và ràng buộc tham chiếu sự kiện.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Organization identifier:** Tổ chức có mã định danh duyệt (organization code) để hiển thị cho người dùng dễ nhận biết không? Hay chỉ dùng ID số tự tăng?
2. **Logo upload:** Cho phép upload logo tổ chức qua Cloudinary? Nếu có, có cần validate kích thước/loại file không?
3. **Phân quyền Manager:** Manager có được thêm/sửa tổ chức không hay chỉ Admin?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Sử dụng ID số tự tăng (organization_id) làm định danh. Không cần mã tổ chức riêng.
- **A2:** Có hỗ trợ upload logo qua Cloudinary. File ảnh tối đa 2MB, định dạng .jpg/.png/.webp.
- **A3:** Admin mới có quyền thêm/sửa/vô hiệu hóa tổ chức. Manager và Staff chỉ có quyền xem danh sách và chi tiết.