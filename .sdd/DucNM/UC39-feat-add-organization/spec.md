# Feature Specification: Add Organization (UC39)

**Feature Branch**: `feat/uc39-add-organization`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "Admin cần thêm tổ chức mới vào hệ thống VMS để mở rộng danh sách đối tác."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin thêm tổ chức thành công (Priority: P1)

Admin muốn thêm một tổ chức mới với đầy đủ thông tin (tên, mô tả, địa chỉ, thông tin liên hệ, logo) để tổ chức đó có thể được gán cho các sự kiện trong tương lai.

**Why this priority**: Đây là chức năng tạo dữ liệu đầu vào cho toàn bộ module Organization. Không có chức năng này, không thể có tổ chức mới trong hệ thống.

**Independent Test**: Gọi `POST /api/v1/organizations` với body hợp lệ và token Admin, kiểm tra HTTP 201 và thông tin tổ chức vừa tạo trong response.

**Acceptance Scenarios**:

1. **Given** Admin đã đăng nhập, **When** Admin nhập tên tổ chức "Hội Chữ Thập Đỏ", mô tả, địa chỉ, email, số điện thoại, và submit, **Then** hệ thống tạo tổ chức mới với `is_active: true`, trả về HTTP 201 và thông tin tổ chức vừa tạo.
2. **Given** Admin muốn upload logo cho tổ chức, **When** Admin chọn file ảnh .jpg dung lượng 1MB, **Then** hệ thống upload logo lên Cloudinary, lưu URL vào database, và trả về thông tin tổ chức kèm URL logo.
3. **Given** Admin nhập tên tổ chức trùng với tổ chức đã tồn tại, **When** Admin submit form, **Then** hệ thống trả về HTTP 409 Conflict với message "Tên tổ chức đã tồn tại."

---

### User Story 2 - Chặn thêm tổ chức khi không có quyền (Priority: P1)

Staff và Volunteer không được phép thêm tổ chức mới vào hệ thống. Manager có quyền thêm tổ chức.

**Why this priority**: Phân quyền nghiêm ngặt bảo vệ dữ liệu tổ chức khỏi bị thao túng trái phép.

**Independent Test**: Gọi `POST /api/v1/organizations` với token Staff, kiểm tra HTTP 403.

**Acceptance Scenarios**:

1. **Given** Staff đã đăng nhập, **When** Staff gửi request tạo tổ chức, **Then** hệ thống trả về HTTP 403 Forbidden.
2. **Given** Volunteer đã đăng nhập, **When** Volunteer gửi request, **Then** hệ thống trả về HTTP 403 Forbidden.
3. **Given** Guest chưa đăng nhập, **When** Guest gửi request, **Then** hệ thống trả về HTTP 401 Unauthorized.

---

### Edge Cases

- Điều gì xảy ra khi Admin upload logo dung lượng > 2MB? → HTTP 400 với message "Kích thước file tối đa 2MB."
- Điều gì xảy ra khi Admin upload file không phải ảnh (ví dụ: .pdf)? → HTTP 400 với message "Chỉ chấp nhận định dạng .jpg, .png, .webp."
- Điều gì xảy ra khi Admin không nhập tên tổ chức? → HTTP 400 với message "Tên tổ chức là bắt buộc."
- Điều gì xảy ra khi Admin nhập email sai định dạng? → HTTP 400 với message "Email không hợp lệ."

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST cho phép Manager/Admin tạo tổ chức mới qua `POST /api/v1/organizations`.
- **FR-002**: System MUST yêu cầu trường `name` là bắt buộc, không được rỗng.
- **FR-003**: System MUST kiểm tra tính duy nhất của `name` — nếu trùng, trả về HTTP 409.
- **FR-004**: System MUST validate `contact_email` (nếu có) đúng định dạng email.
- **FR-005**: System MUST hỗ trợ upload logo qua Cloudinary, giới hạn 2MB, định dạng .jpg/.png/.webp.
- **FR-006**: System MUST tự động set `is_active: true` khi tạo tổ chức mới.
- **FR-007**: System MUST trả về HTTP 201 khi tạo thành công.
- **FR-008**: System MUST ghi audit log sau khi tạo tổ chức thành công.
- **FR-009**: System MUST từ chối Staff/Volunteer với HTTP 403 và Guest với HTTP 401.

### Key Entities *(Business Level Only)*

- **Organization (Tổ chức)**: Entity chính được tạo. Thuộc tính: name (required, unique), description, address, contact_phone, contact_email, website, logo_url, is_active (mặc định true).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin tạo tổ chức mới hoàn tất trong vòng 30 giây (từ lúc mở form đến khi nhận kết quả).
- **SC-002**: 100% request tạo tổ chức có Zod validation pass trước khi ghi database.
- **SC-003**: 100% tạo tổ chức thành công có audit log.

## Assumptions

- Cloudinary service đã được cấu hình trong project.
- Middleware xác thực và phân quyền đã hoạt động.
- Admin không cần xét duyệt khi tạo tổ chức — thao tác trực tiếp.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC39 và KHÔNG được implement:

- **Gửi email xác nhận khi tạo tổ chức**: Không cần thiết cho thao tác nội bộ.
- **Tạo tổ chức từ Staff**: Chỉ Admin và Manager mới có quyền.
- **Import tổ chức từ file**: Thuộc UC57 (Export Reports).
- **Tự động tạo organization cho Staff khi đăng ký**: Không có trong scope v1.
