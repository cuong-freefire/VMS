# Feature Specification: Reject Application (UC25)
**Feature Branch**: `025-feat-reject-application`
**Created**: 2026-06-28
**Status**: DRAFT
**Input**: User description: "Là một Staff, tôi muốn từ chối đơn đăng ký của một tình nguyện viên không phù hợp để tôi có thể tập trung vào các ứng viên khác."

---

## User Scenarios & Testing
### User Story 1 - Từ chối đơn đăng ký đơn lẻ (Priority: P1)
Là một **Staff**, tôi muốn nhấn nút "Reject" tại trang chi tiết ứng viên và có thể nhập lý do từ chối.
**Why this priority**: Đây là chức năng cốt lõi để xử lý các ứng viên không đạt yêu cầu.
**Independent Test**:
- Bước 1: Mở chi tiết một đơn đăng ký đang ở trạng thái `Submitted`.
- Bước 2: Nhấn "Reject".
- Bước 3: Nhập lý do "Hồ sơ chưa đủ kinh nghiệm" vào pop-up và xác nhận.
- Bước 4: Kiểm tra trạng thái đơn chuyển sang "Rejected" và lý do được lưu đúng.
**Acceptance Scenarios**:
1. **Given** Đơn đăng ký hợp lệ, **When** Staff xác nhận từ chối, **Then** hệ thống trả về HTTP 200 OK và cập nhật trường `status` thành `Rejected`.

---

### User Story 2 - Từ chối hàng loạt (Priority: P2)
Là một **Staff**, tôi muốn chọn nhiều đơn đăng ký rác từ danh sách và từ chối chúng cùng một lúc mà không cần nhập lý do chi tiết cho từng người.
**Why this priority**: Tối ưu hóa thời gian khi có quá nhiều đơn đăng ký không đạt tiêu chuẩn.
**Independent Test**:
- Bước 1: Tại danh sách ứng viên (UC22), tích chọn 10 ứng viên.
- Bước 2: Nhấn "Bulk Reject".
- Bước 3: Xác nhận tại pop-up cảnh báo.
- Bước 4: Kiểm tra tất cả 10 ứng viên đã được cập nhật trạng thái "Rejected".
**Acceptance Scenarios**:
1. **Given** danh sách 10 đơn `Submitted`, **When** Staff thực hiện bulk reject, **Then** hệ thống xử lý hàng loạt và gửi thông báo lỗi nếu có bất kỳ đơn nào không đủ điều kiện (VD: đã được duyệt trước đó).

---

## Requirements
### Functional Requirements
- **FR-001**: **WHEN** Staff thực hiện Reject, **THE** system **SHALL** kiểm tra quyền truy cập dựa trên `organization_id`.
- **FR-002**: **WHEN** từ chối thành công, **THE** system **SHALL** tự động gửi thông báo cho Volunteer (email hoặc thông báo hệ thống).
- **FR-003**: **WHERE** Staff nhập lý do từ chối, **THE** system **SHALL** lưu lý do này vào trường `rejection_reason` trong database.
- **FR-004**: **WHERE** một đơn đã bị `Rejected`, **THE** system **SHALL** ẩn nút "Approve" và "Reject" để tránh thao tác trùng lặp.
- **FR-005**: **WHEN** thực hiện Bulk Reject, **THE** system **SHALL** sử dụng database transaction để đảm bảo dữ liệu nhất quán nếu có lỗi xảy ra giữa chừng.
- **FR-016**: **WHEN** ghi log hành động từ chối, **THE** system **MUST NOT** tiết lộ các thông tin nhạy cảm của Volunteer ra log file.
- **FR-018**: **WHEN** Staff nhấn nút Reject, **THE** system **SHALL** hiển thị trạng thái loading và disable nút để tránh double-submit.

---

### Key Entities
- **Application**: Thực thể được chuyển trạng thái sang `Rejected`. Thuộc tính bổ sung: `rejection_reason`, `processed_at`.
- **Staff**: Người thực hiện hành động từ chối.
- **Event**: Ngữ cảnh của đơn đăng ký.

---

## Success Criteria
- **SC-001**: Thao tác từ chối một đơn lẻ phải hoàn tất trong vòng dưới 1 giây.
- **SC-002**: 100% các đơn bị từ chối phải được ghi log đầy đủ thông tin Staff thực hiện.
- **SC-007**: Frontend không gửi yêu cầu từ chối nếu đơn đăng ký đã ở trạng thái `Rejected` hoặc `Approved`.

---

## Assumptions
- **A-001**: Hệ thống thông báo (Notification) đã có sẵn endpoint để nhận yêu cầu gửi tin nhắn cho Volunteer.
- **A-005**: Database hỗ trợ lưu trữ chuỗi ký tự dài cho trường lý do từ chối.
- **A-008**: Các đơn đăng ký bị từ chối sẽ không còn xuất hiện trong danh sách điểm danh sau này.

---

## Out of Scope
Các tính năng sau KHÔNG nằm trong phạm vi của UC25:
- [Feature 1: Đảo ngược trạng thái từ Rejected về Submitted].
- [Feature 2: Cho phép Volunteer khiếu nại về lý do bị từ chối trực tiếp trên hệ thống].
- [Feature 3: Tự động từ chối dựa trên các từ khóa (Blacklist keywords) trong hồ sơ].