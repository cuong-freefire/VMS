# Feature Specification: View Application Detail (UC23)
**Feature Branch**: `023-feat-view-application-detail`
**Created**: 2026-06-28
**Updated**: 2026-07-28
**Status**: IMPLEMENTED

**Consistency Check**: Aligned with Prisma schema — ApplicationStatus: PENDING, APPROVED, REJECTED, CANCELLED.

---

## User Scenarios & Testing
### User Story 1 - Xem hồ sơ đầy đủ của ứng viên (Priority: P1)
Là một **Staff**, tôi muốn xem các thông tin: Họ tên, Email, Số điện thoại, Kỹ năng, và Thư giới thiệu của ứng viên.
**Acceptance Scenarios**:
1. **Given** Application ID hợp lệ và Staff sở hữu event, **When** Staff truy cập, **Then** hệ thống trả về HTTP 200 kèm object chứa đầy đủ thông tin.

### User Story 2 - Kiểm tra lịch sử hoạt động (Priority: P2)
1. **Given** Volunteer đã từng tham gia sự kiện trước đó, **When** trang chi tiết tải, **Then** hệ thống hiển thị số lượng sự kiện đã tham gia.

---

## Requirements
### Functional Requirements
- **FR-001**: **WHEN** Staff gửi yêu cầu xem chi tiết, **THE** system **SHALL** kiểm tra `created_by` của event gắn với application đó có khớp với Staff hay không.
- **FR-002**: **WHEN** trả về dữ liệu, **THE** system **SHALL** bao gồm: id, userId, eventId, status, message, processedBy, processedAt, createdAt, updatedAt, volunteer (id, fullName, email, phone, avatarUrl, skills), event (id, title, startDate, endDate).
- **FR-003**: **WHERE** không tìm thấy Application ID, **THE** system **SHALL** trả về lỗi 404.

---

### Key Entities
- **Application**: Chứa thông tin đơn đăng ký (userId, eventId, status, message, processedBy, processedAt, createdAt).

---

## Out of Scope
- Phê duyệt/Từ chối tại màn hình này (UC24/UC25).
- Staff sửa thông tin cá nhân của Volunteer.
- Volunteer statistics (events_joined, completion_rate) — not implemented.