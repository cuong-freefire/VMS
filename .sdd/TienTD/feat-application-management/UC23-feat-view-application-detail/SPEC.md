# Feature Specification: View Application Detail (UC23)
**Feature Branch**: `023-feat-view-application-detail`
**Created**: 2026-06-28
**Status**: DRAFT
**Input**: User description: "Là một Staff, tôi muốn xem thông tin chi tiết của một đơn đăng ký bao gồm hồ sơ cá nhân và câu trả lời của tình nguyện viên để tôi có thể đánh giá mức độ phù hợp của họ."

---

## User Scenarios & Testing
### User Story 1 - Xem hồ sơ đầy đủ của ứng viên (Priority: P1)
Là một **Staff**, tôi muốn xem các thông tin: Họ tên, Email, Số điện thoại, Kỹ năng, và Thư giới thiệu (Motivation Letter) của ứng viên.
**Why this priority**: Đây là thông tin nền tảng để đánh giá năng lực ứng viên.
**Independent Test**:
- Bước 1: Từ danh sách ứng viên (UC22), nhấn vào một ứng viên cụ thể.
- Bước 2: Kiểm tra các trường thông tin cá nhân hiển thị đầy đủ.
- Bước 3: Kiểm tra phần kỹ năng (Skills) có khớp với profile của Volunteer hay không.
**Acceptance Scenarios**:
1. **Given** Application ID hợp lệ, **When** Staff truy cập, **Then** hệ thống trả về HTTP 200 OK kèm object chứa đầy đủ Profile thông tin và Application thông tin.

---

### User Story 2 - Kiểm tra lịch sử hoạt động (Priority: P2)
Là một **Staff**, tôi muốn thấy số lượng sự kiện Volunteer đã hoàn thành để biết họ có đáng tin cậy hay không.
**Why this priority**: Giúp tăng độ chính xác trong việc chọn lọc ứng viên có trách nhiệm.
**Independent Test**:
- Bước 1: Mở trang chi tiết ứng viên.
- Bước 2: Tìm phần "Volunteer Statistics".
- Bước 3: Xác nhận các con số về "Events Joined", "Completion Rate" được hiển thị rõ ràng.
**Acceptance Scenarios**:
1. **Given** Volunteer đã từng tham gia sự kiện trước đó, **When** trang chi tiết tải, **Then** hệ thống tính toán và hiển thị đúng các chỉ số thống kê từ database lịch sử.

---

## Requirements
### Functional Requirements
- **FR-001**: **WHEN** Staff gửi yêu cầu xem chi tiết, **THE** system **SHALL** kiểm tra `organization_id` của sự kiện gắn với đơn đăng ký đó có khớp với tổ chức của Staff hay không.
- **FR-002**: **WHEN** trả về dữ liệu, **THE** system **SHALL** bao gồm: Tên, Ảnh đại diện, Email, SĐT, Danh sách kỹ năng, Motivation Letter, và Trạng thái đơn hiện tại.
- **FR-003**: **WHERE** ứng viên cung cấp link portfolio hoặc file đính kèm, **THE** system **SHALL** hiển thị link click được để Staff kiểm tra.
- **FR-004**: **WHEN** Staff xem đơn ở trạng thái `Submitted`, **THE** system **SHALL** tự động cập nhật trạng thái đơn thành `Reviewed` (nếu quy trình nghiệp vụ yêu cầu).
- **FR-005**: **WHERE** không tìm thấy Application ID, **THE** system **SHALL** trả về lỗi 404 Not Found.
- **FR-016**: **WHEN** hiển thị thông tin, **THE** system **MUST NOT** log số điện thoại hoặc email của Volunteer ra console của trình duyệt.

---

### Key Entities
- **Application**: Chứa thông tin đơn đăng ký cụ thể (Ngày gửi, Motivation Letter, Status).
- **Volunteer (User Profile)**: Chứa thông tin cá nhân và kỹ năng của người đăng ký.
- **Event**: Thông tin sự kiện để xác định ngữ cảnh và quyền sở hữu.

---

## Success Criteria
- **SC-001**: Toàn bộ trang chi tiết với đầy đủ ảnh đại diện phải tải xong dưới 1.5 giây.
- **SC-002**: Thông tin kỹ năng hiển thị phải luôn đồng bộ với những cập nhật mới nhất từ Profile của Volunteer.
- **SC-007**: Frontend phải hiển thị trạng thái "Loading" rõ ràng trong khi chờ API lấy dữ liệu chi tiết ứng viên.

---

## Assumptions
- **A-001**: Database đã thiết lập quan hệ (Relationship) giữa `Applications`, `Users` và `Events`.
- **A-006**: Chức năng lấy thông tin Profile (UC18) đã hoạt động ổn định để UC23 có thể tái sử dụng dữ liệu.
- **A-010**: Mọi đơn đăng ký đều phải gắn với một User ID hợp lệ.

---

## Out of Scope
Các tính năng sau KHÔNG nằm trong phạm vi của UC23:
- [Feature 1: Phê duyệt/Từ chối trực tiếp tại màn hình này (Đây là nhiệm vụ của UC24/25)].
- [Feature 2: Staff sửa thông tin cá nhân của Volunteer].
- [Feature 3: Gửi email phản hồi cho Volunteer ngay tại trang chi tiết].