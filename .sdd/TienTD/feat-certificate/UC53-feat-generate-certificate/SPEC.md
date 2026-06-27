# Feature Specification: Generate Certificate (UC53)
**Feature Branch**: `053-feat-generate-certificate`
**Created**: 2026-06-28
**Status**: DRAFT
**Input**: User description: "Là một Staff, tôi muốn hệ thống tự động tạo chứng nhận cho các tình nguyện viên đã tham gia sự kiện để chính thức ghi nhận sự đóng góp của họ."

---

## User Scenarios & Testing
### User Story 1 - Cấp chứng nhận hàng loạt cho sự kiện (Priority: P1)
Là một **Staff**, tôi muốn nhấn nút "Generate Certificates" cho một sự kiện đã kết thúc để cấp chứng nhận cho toàn bộ tình nguyện viên đã có mặt.
**Why this priority**: Đây là chức năng cốt lõi giúp tiết kiệm thời gian quản lý nhân sự sau sự kiện.
**Independent Test**:
- Bước 1: Truy cập trang quản lý sự kiện và chọn một sự kiện trạng thái "Completed".
- Bước 2: Kiểm tra danh sách những người "Present".
- Bước 3: Nhấn nút "Generate & Issue All".
- Bước 4: Kiểm tra cột trạng thái của các Volunteer chuyển thành "Certificate Issued".
**Acceptance Scenarios**:
1. **Given** Sự kiện đã Completed và có 10 Volunteer đạt điều kiện điểm danh, **When** Staff nhấn phát hành, **Then** hệ thống tạo 10 file PDF, lưu vào storage và trả về thông báo thành công.

---

### User Story 2 - Xem trước chứng nhận trước khi phát hành (Priority: P2)
Là một **Staff**, tôi muốn xem trước (Preview) một mẫu chứng nhận của một Volunteer cụ thể để đảm bảo hiển thị đúng trước khi gửi hàng loạt.
**Why this priority**: Tránh lỗi định dạng hoặc tràn chữ trên chứng nhận.
**Independent Test**:
- Bước 1: Tại danh sách điểm danh, nhấn vào biểu tượng "Preview Certificate" của một Volunteer.
- Bước 2: Kiểm tra file PDF mẫu hiển thị trên trình duyệt với đúng thông tin của Volunteer đó.
**Acceptance Scenarios**:
1. **Given** dữ liệu Volunteer hợp lệ, **When** nhấn Preview, **Then** hệ thống hiển thị modal chứa file PDF tạm thời mà chưa lưu vào DB hay gửi email.

---

## Requirements
### Functional Requirements
- **FR-001**: **WHEN** Staff nhấn Generate, **THE** system **SHALL** kiểm tra trạng thái sự kiện phải là `Completed`.
- **FR-002**: **WHEN** tạo chứng nhận, **THE** system **SHALL** chỉ chọn những Volunteer có `attendance_status = 'Present'`.
- **FR-003**: **WHERE** một Volunteer đã được cấp chứng nhận trước đó, **THE** system **SHALL** không cho phép tạo trùng lặp (trừ khi có lệnh Re-issue).
- **FR-004**: **WHEN** tạo thành công file PDF, **THE** system **SHALL** tạo một mã định danh duy nhất (Unique Certificate ID) và mã QR để xác thực thông tin.
- **FR-005**: **WHEN** quy trình tạo file hoàn tất, **THE** system **SHALL** trigger UC66 để gửi email đính kèm link tải chứng nhận cho Volunteer.
- **FR-016**: **WHEN** thực hiện xử lý hàng loạt, **THE** system **MUST NOT** làm lộ thông tin cá nhân của các Volunteer khác trong quá trình tạo file.
- **FR-018**: **WHEN** Staff nhấn nút phát hành, **THE** system **SHALL** disable nút và hiển thị progress bar để tránh double-submit cho đến khi tiến trình hoàn tất.

---

### Key Entities
- **Certificate**: Thực thể lưu trữ thông tin chứng nhận. Thuộc tính: CertificateID, EventID, VolunteerID, FileURL, IssuedDate, VerifyCode.
- **Event**: Dùng để lấy thông tin Tên sự kiện, Ngày tổ chức và Logo tổ chức.
- **Attendance**: Nguồn dữ liệu để xác định đối tượng được cấp.

---

## Success Criteria
- **SC-001**: Hệ thống có thể tạo 100 chứng nhận PDF trong vòng dưới 60 giây.
- **SC-002**: 100% chứng nhận được tạo phải có mã QR dẫn về trang xác thực thông tin hợp lệ.
- **SC-007**: Giao diện Staff không bị đóng băng (non-blocking) trong suốt quá trình hệ thống tạo file ở background.

---

## Assumptions
- **A-001**: Database đã có bảng `Certificates` và hệ thống đã tích hợp sẵn thư viện PDF (như PDFKit hoặc tương đương).
- **A-005**: Logo và chữ ký của đại diện tổ chức đã được Admin upload trong phần cài đặt Organization.
- **A-006**: Chức năng Email Service (Member 1) đã sẵn sàng nhận tham số để gửi link chứng nhận.

---

## Out of Scope
Các tính năng sau KHÔNG nằm trong phạm vi của UC53:
- [Feature 1: Thiết kế kéo thả phôi chứng nhận (đây là nhiệm vụ của Admin)].
- [Feature 2: Tự động đăng tải chứng nhận lên mạng xã hội của Volunteer].
- [Feature 3: Chỉnh sửa nội dung văn bản trên từng chứng nhận riêng lẻ sau khi đã tạo].