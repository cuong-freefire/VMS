# Feature Specification: View Feedback Detail (UC50)
**Feature Branch**: `050-feat-view-feedback-detail`
**Created**: 2026-06-28
**Status**: DRAFT
**Input**: User description: "Là một Staff, tôi muốn xem nội dung đầy đủ của một phản hồi từ tình nguyện viên để tôi có thể hiểu rõ hơn về những đóng góp và kiến nghị của họ."

---

## User Scenarios & Testing
### User Story 1 - Xem chi tiết phản hồi (Priority: P1)
Là một **Staff**, tôi muốn xem toàn bộ nội dung nhận xét, điểm số và các ảnh đính kèm của một Volunteer.
**Why this priority**: Đây là giá trị cốt lõi của tính năng để Staff nắm bắt thông tin đầy đủ.
**Independent Test**:
- Bước 1: Từ trang danh sách (UC49), nhấn vào một bản ghi phản hồi.
- Bước 2: Kiểm tra trang chi tiết hiển thị đầy đủ Rating, Full Comment và thông tin Volunteer.
- Bước 3: Xác nhận các ảnh đính kèm (nếu có) được hiển thị rõ ràng.
**Acceptance Scenarios**:
1. **Given** Feedback ID hợp lệ, **When** Staff truy cập, **Then** hệ thống trả về HTTP 200 OK và hiển thị giao diện chi tiết với đầy đủ các trường thông tin theo thiết kế.

---

### User Story 2 - Quay lại danh sách (Priority: P1)
Là một **Staff**, tôi muốn có nút "Back" để quay lại trang danh sách phản hồi mà không làm mất trạng thái lọc trước đó.
**Why this priority**: Đảm bảo trải nghiệm duyệt nhiều feedback diễn ra mượt mà.
**Independent Test**:
- Bước 1: Đang ở trang chi tiết UC50.
- Bước 2: Nhấn nút "Back to List".
- Bước 3: Xác nhận trình duyệt quay lại trang UC49.
**Acceptance Scenarios**:
1. **Given** Staff đang xem chi tiết, **When** nhấn nút Back, **Then** hệ thống thực hiện điều hướng về trang danh sách.

---

## Requirements
### Functional Requirements
- **FR-001**: **WHEN** Staff gửi yêu cầu xem chi tiết, **THE** system **SHALL** kiểm tra quyền truy cập dựa trên `organization_id`.
- **FR-002**: **WHEN** hiển thị dữ liệu, **THE** system **SHALL** trình bày đầy đủ nội dung Comment với định dạng xuống dòng (line breaks).
- **FR-003**: **WHERE** có ảnh đính kèm, **THE** system **SHALL** hiển thị ảnh dưới dạng Thumbnail và cho phép nhấn vào để xem ảnh phóng to.
- **FR-004**: **WHEN** xem chi tiết, **THE** system **SHALL** hiển thị thông tin sự kiện liên quan (Tên, Ngày diễn ra) để Staff có ngữ cảnh.
- **FR-005**: **WHERE** phản hồi bị ẩn danh, **THE** system **SHALL** hiển thị tên Volunteer là "Anonymous".
- **FR-016**: **WHEN** hiển thị chi tiết, **THE** system **MUST NOT** cho phép bất kỳ hành động chỉnh sửa văn bản nào (Input fields phải được set là disabled/readonly).
- **FR-018**: **WHEN** API chưa trả về kết quả, **THE** system **SHALL** hiển thị Skeleton Loading cho các vùng nội dung chính.

---

### Key Entities
- **Feedback**: Thực thể chứa nội dung đánh giá chi tiết, hình ảnh đính kèm và trạng thái Flag.
- **Volunteer**: Thông tin người gửi phản hồi (hoặc trạng thái ẩn danh).
- **Event**: Thông tin sự kiện mà phản hồi này hướng tới.

---

## Success Criteria
- **SC-001**: Nội dung chi tiết (bao gồm cả văn bản dài) phải hiển thị trong vòng dưới 1 giây sau khi click.
- **SC-002**: 100% nội dung hiển thị phải khớp tuyệt đối với những gì Volunteer đã gửi tại UC48.
- **SC-007**: Hệ thống không được để xảy ra lỗi giao diện (UI breaking) khi nội dung nhận xét quá dài.

---

## Assumptions
- **A-001**: Dữ liệu hình ảnh (nếu có) được lưu trữ trên Cloud Storage và API trả về link URL trực tiếp.
- **A-005**: Staff đã được xác thực qua hệ thống trước khi thực hiện request xem chi tiết.
- **A-009**: Chức năng "Flag" phản hồi sẽ được lưu vào cơ sở dữ liệu và có thể được dùng cho các bộ lọc ở UC49 sau này.

---

## Out of Scope
Các tính năng sau KHÔNG nằm trong phạm vi của UC50:
- [Feature 1: Trả lời hoặc phản biện lại nhận xét của Volunteer].
- [Feature 2: Xóa bỏ các nhận xét tiêu cực].
- [Feature 3: Chia sẻ nhận xét trực tiếp lên các mạng xã hội].