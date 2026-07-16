# Feature Specification: View Feedback List (UC49)
**Feature Branch**: `049-feat-view-feedback-list`
**Created**: 2026-06-28
**Status**: DRAFT
**Input**: User description: "Là một Staff, tôi muốn xem danh sách các phản hồi của tình nguyện viên sau sự kiện để đánh giá mức độ thành công và sự hài lòng của họ."

---

## User Scenarios & Testing
### User Story 1 - Xem danh sách phản hồi tổng quát (Priority: P1)
Là một **Staff**, tôi muốn xem danh sách các phản hồi bao gồm tên Volunteer, tên sự kiện, điểm đánh giá và ngày gửi.
**Why this priority**: Đây là thông tin cơ bản để Staff nắm bắt tình hình phản hồi chung của tổ chức.
**Independent Test**:
- Bước 1: Truy cập trang Feedback Management.
- Bước 2: Kiểm tra bảng danh sách hiển thị đầy đủ các cột: Volunteer, Event, Rating, Date.
- Bước 3: Xác nhận các phản hồi mới nhất hiển thị ở đầu danh sách.
**Acceptance Scenarios**:
1. **Given** Có các phản hồi đã được gửi cho các sự kiện của tổ chức, **When** Staff vào trang UC49, **Then** hệ thống trả về HTTP 200 OK và hiển thị danh sách phân trang.

---

### User Story 2 - Lọc phản hồi theo sự kiện (Priority: P1)
Là một **Staff**, tôi muốn lọc danh sách phản hồi theo một sự kiện cụ thể để xem chi tiết đánh giá cho hoạt động đó.
**Why this priority**: Giúp Staff tập trung phân tích từng sự kiện riêng biệt.
**Independent Test**:
- Bước 1: Chọn Filter "Event" và chọn một sự kiện cụ thể.
- Bước 2: Nhấn "Apply".
- Bước 3: Xác nhận danh sách chỉ hiển thị feedback của sự kiện đã chọn.
**Acceptance Scenarios**:
1. **Given** Staff chọn một Event ID hợp lệ, **When** gửi yêu cầu lọc, **Then** hệ thống trả về danh sách các feedback có `event_id` tương ứng.

---

### User Story 3 - Lọc theo điểm đánh giá (Priority: P2)
Là một **Staff**, tôi muốn lọc các phản hồi có điểm đánh giá thấp (1-2 sao) để ưu tiên xử lý các vấn đề tiêu cực.
**Why this priority**: Giúp Staff nhanh chóng nhận diện các sự cố hoặc khiếu nại nghiêm trọng.
**Independent Test**:
- Bước 1: Chọn Filter "Rating" và chọn giá trị "Below 3 stars".
- Bước 2: Nhấn lọc.
- Bước 3: Xác nhận danh sách chỉ còn các feedback có điểm 1 hoặc 2.
**Acceptance Scenarios**:
1. **Given** danh sách feedback đa dạng, **When** Staff chọn lọc theo rating, **Then** hệ thống trả về đúng các bản ghi thỏa mãn điều kiện.

---

## Requirements
### Functional Requirements
- **FR-001**: **WHEN** Staff yêu cầu xem danh sách, **THE** system **SHALL** kiểm tra quyền truy cập dựa trên `organization_id` của Staff và sự kiện.
- **FR-002**: **WHEN** trả về dữ liệu, **THE** system **SHALL** bao gồm các trường: FeedbackID, VolunteerName, EventTitle, Rating, CommentSnippet (đoạn ngắn), và CreatedAt.
- **FR-003**: **WHERE** danh sách có nhiều hơn 20 phản hồi, **THE** system **SHALL** thực hiện phân trang (Pagination).
- **FR-004**: **WHEN** Staff nhấn vào một dòng phản hồi, **THE** system **SHALL** điều hướng sang UC50 (View Feedback Detail).
- **FR-005**: **WHERE** không có phản hồi nào, **THE** system **SHALL** hiển thị thông báo "No feedback available for this criteria.".
- **FR-016**: **WHEN** hiển thị danh sách, **THE** system **MUST NOT** tiết lộ email hoặc số điện thoại của Volunteer trực tiếp trên bảng danh sách.
- **FR-018**: **WHEN** Staff nhấn nút lọc hoặc chuyển trang, **THE** system **SHALL** hiển thị trạng thái loading để tránh double-submit.

---

### Key Entities
- **Feedback**: Đại diện cho ý kiến của Volunteer. Thuộc tính: Rating (1-5), Comment, CreatedAt.
- **Event**: Sự kiện được đánh giá. Giúp xác định quyền sở hữu của Staff.
- **Volunteer**: Người thực hiện đánh giá.

---

## Success Criteria
- **SC-001**: Danh sách feedback đầu tiên phải tải xong trong vòng dưới 1.2 giây.
- **SC-002**: 100% dữ liệu rating hiển thị phải khớp chính xác với dữ liệu mà Volunteer đã nhập ở UC48.
- **SC-007**: Frontend không gửi request trùng lặp khi Staff click nút "Refresh" nhiều lần trong thời gian ngắn.

---

## Assumptions
- **A-001**: Database đã có bảng `Feedbacks` liên kết với `Events` và `Users`.
- **A-005**: Dữ liệu phản hồi từ UC48 đã được lưu đúng định dạng số cho Rating và chuỗi cho Comment.
- **A-006**: Chức năng Authentication của Member 1 đã cung cấp đủ thông tin Organization ID của Staff.

---

## Out of Scope
Các tính năng sau KHÔNG nằm trong phạm vi của UC49:
- [Feature 1: Chỉnh sửa nội dung feedback của Volunteer].
- [Feature 2: Phân tích cảm xúc tự động (Sentiment Analysis) từ comment].
- [Feature 3: Xuất báo cáo feedback ra PDF/Excel (đây là UC57)].