# Feature Specification: View Application List (UC22)
**Feature Branch**: `022-feat-view-application-list`
**Created**: 2026-06-28
**Updated**: 2026-07-28
**Status**: IMPLEMENTED

**Consistency Check**: Aligned with Prisma schema — ApplicationStatus: PENDING, APPROVED, REJECTED, CANCELLED.

---

## User Scenarios & Testing
### User Story 1 - Xem danh sách đăng ký theo sự kiện (Priority: P1)
Là một **Staff**, tôi muốn chọn một sự kiện cụ thể và xem tất cả các đơn đăng ký của sự kiện đó.
**Acceptance Scenarios**:
1. **Given** Staff đã chọn một Event ID hợp lệ (event do Staff tạo), **When** trang tải, **Then** hệ thống trả về danh sách ứng viên được sắp xếp theo thời gian đăng ký mới nhất.

### User Story 2 - Lọc đơn đăng ký theo trạng thái (Priority: P1)
1. **Given** danh sách đang hiển thị nhiều trạng thái, **When** Staff chọn lọc theo status, **Then** API gửi request kèm params `status=pending` và trả về đúng dữ liệu lọc.

---

## Requirements
### Functional Requirements
- **FR-001**: **WHEN** Staff truy cập danh sách, **THE** system **SHALL** kiểm tra quyền truy cập: Staff chỉ xem được application của event do mình tạo (`created_by`).
- **FR-002**: **WHEN** dữ liệu trả về, **THE** system **SHALL** bao gồm các trường: id, userId, eventId, status, message, processedBy, processedAt, createdAt, updatedAt, và volunteer (id, fullName, avatarUrl).
- **FR-003**: **WHERE** danh sách có nhiều hơn 20 bản ghi, **THE** system **SHALL** thực hiện phân trang.
- **FR-004**: **WHEN** Staff nhấn vào tên một Volunteer, **THE** system **SHALL** điều hướng sang UC23 (View Application Detail).
- **FR-005**: **WHERE** không có đơn đăng ký nào, **THE** system **SHALL** hiển thị thông báo "Không có đơn đăng ký nào."

---

### Key Entities
- **Application**: Trạng thái: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.

---

## Out of Scope
- Phê duyệt hoặc Từ chối ngay tại trang danh sách (UC24/UC25).
- Sửa đổi thông tin trong đơn đăng ký của Volunteer.