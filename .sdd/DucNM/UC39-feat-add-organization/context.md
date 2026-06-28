# CONTEXT.md — Add Organization (UC39)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-28

## 1. PROBLEM STATEMENT

Khi có một tổ chức mới muốn tham gia hợp tác với VMS để tổ chức sự kiện tình nguyện, Admin cần có chức năng thêm tổ chức đó vào hệ thống. Nếu không có chức năng này, Staff không thể gán sự kiện mới cho tổ chức và hệ thống không thể mở rộng danh sách đối tác.

## 2. DOMAIN KNOWLEDGE

- **Organization creation:** Tổ chức mới được tạo với trạng thái `is_active: true` mặc định.
- **Tên tổ chức phải duy nhất:** Không được tồn tại hai tổ chức có cùng tên trong hệ thống để tránh nhầm lẫn.
- **Logo upload:** Tổ chức có thể có hoặc không có logo. Nếu có, logo được upload và lưu trên Cloudinary.
- **Admin-only:** Chỉ Admin mới có quyền thêm tổ chức. Manager, Staff, Volunteer không được phép.
- **Audit log:** Mọi thao tác thêm tổ chức phải được ghi lại để truy vết.

## 3. STAKEHOLDERS

- **Admin:** Người duy nhất có quyền thêm tổ chức mới vào hệ thống.
- **Staff (gián tiếp):** Sau khi Admin thêm tổ chức, Staff mới có thể gán tổ chức đó cho sự kiện mới.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Admin-only:** Chỉ Admin. Mọi role khác bị từ chối HTTP 403.
- **Tên duy nhất:** Trùng tên → HTTP 409 Conflict.
- **Logo:** Nếu có upload logo, file tối đa 2MB, chỉ chấp nhận định dạng `.jpg`, `.png`, `.webp`.
- **Validation:** Bắt buộc validate đầu vào (tên không rỗng, email đúng format nếu có) trước khi ghi database.
- **API format:** Endpoint bắt buộc `POST /api/v1/organizations`.
- **Audit log:** Ghi log sau khi tạo thành công.
- **Swagger:** Bắt buộc có Swagger JSDoc đầy đủ.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định Cloudinary đã được cấu hình trong project để upload ảnh.
- Giả định trường `name` là bắt buộc (required). Các trường còn lại (description, address, contact_phone, contact_email, website, logo) là optional.
- Giả định tổ chức được tạo mặc định với `is_active: true`.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Email tổ chức có cần xác thực không?** Có gửi email xác nhận đến địa chỉ contact_email khi tổ chức được tạo?
2. **Trường nào là bắt buộc?** Ngoài `name`, trường nào khác bắt buộc phải điền?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Không gửi email xác nhận khi tạo tổ chức. Đây là thao tác nội bộ của Admin.
- **A2:** Chỉ `name` là trường bắt buộc. Các trường còn lại là optional: description, address, contact_phone, contact_email (nếu có phải đúng format email), website, logo.
