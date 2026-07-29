# Feature Specification: Nộp Đơn Đăng Ký Sự Kiện (UC15)

**Feature Branch**: `feat/submit-application`  
**Created**: 2026-07-28  
**Status**: ACCEPTED 
**Input**: Là Volunteer của hệ thống VMS, tôi muốn nộp đơn đăng ký tham gia một sự kiện tình nguyện đang mở đăng ký để được xét duyệt tham gia.

---

## User Scenarios & Testing

### User Story 1 - Gửi đơn đăng ký thành công (Priority: P1)

Volunteer đã đăng nhập, truy cập trang chi tiết sự kiện, nhấn nút "Đăng ký ngay" và gửi đơn thành công.

**Acceptance Scenarios**:

1. **Given** Volunteer có `is_active = true`, event có `status = PUBLISHED`, `is_active = true`, chưa đến `start_date`, chưa hết `application_deadline`, `approved_participants < max_capacity`, và Volunteer chưa có đơn nào ở trạng thái `PENDING`/`APPROVED`/`WAITING_PAYMENT` cho event này, **When** Volunteer gửi đơn, **Then** hệ thống tạo đơn mới với `status = PENDING`, trả HTTP 201 kèm thông tin đơn.

2. **Given** đơn được tạo thành công, **When** API trả kết quả, **Then** response chứa `id`, `event_id`, `volunteer_id`, `status: "PENDING"`, `created_at`.

---

### User Story 2 - Từ chối gửi đơn khi không đủ điều kiện (Priority: P1)

Hệ thống phải từ chối yêu cầu gửi đơn trong các trường hợp không hợp lệ.

**Acceptance Scenarios**:

1. **Given** event không tồn tại, **When** gửi đơn, **Then** HTTP 404 "Không tìm thấy sự kiện".

2. **Given** event có `is_active = false` (đã xóa mềm), **When** gửi đơn, **Then** HTTP 404 "Không tìm thấy sự kiện".

3. **Given** event có `status != PUBLISHED` (DRAFT, PENDING_APPROVAL, REJECTED, CANCELLED, IN_PROGRESS, COMPLETED), **When** gửi đơn, **Then** HTTP 409 "Sự kiện không trong trạng thái nhận đơn".

4. **Given** event `PUBLISHED` nhưng `application_deadline` đã qua, **When** gửi đơn, **Then** HTTP 409 "Đã hết hạn đăng ký".

5. **Given** event `PUBLISHED` nhưng `start_date` đã đến (event đã bắt đầu), **When** gửi đơn, **Then** HTTP 409 "Sự kiện đã bắt đầu, không thể đăng ký".

6. **Given** event `PUBLISHED` nhưng `approved_participants >= max_capacity` (đã đầy), **When** gửi đơn, **Then** HTTP 409 "Sự kiện đã đủ số lượng".

7. **Given** Volunteer đã có đơn `PENDING`, `APPROVED`, hoặc `WAITING_PAYMENT` cho event này, **When** gửi thêm đơn mới, **Then** HTTP 409 "Bạn đã đăng ký sự kiện này".

8. **Given** người dùng không có role `VOLUNTEER`, **When** gửi đơn, **Then** HTTP 403 "Chỉ tình nguyện viên mới được đăng ký".

9. **Given** Volunteer có `is_active = false` (tài khoản bị khóa), **When** gửi đơn, **Then** HTTP 403 "Tài khoản không hoạt động".

---

### User Story 3 - Frontend UX: Nút Apply, xác nhận và phản hồi (Priority: P2)

Giao diện Event Detail hiển thị nút "Đăng ký ngay" đúng lúc, yêu cầu xác nhận trước khi gửi, và hiển thị kết quả rõ ràng.

**Acceptance Scenarios**:

1. **Given** Volunteer đủ điều kiện gửi đơn, **When** xem Event Detail, **Then** hiển thị nút "Đăng ký ngay" (Apply Now).

2. **Given** Volunteer không đủ điều kiện (event không PUBLIC, hết hạn, đầy, đã apply), **When** xem Event Detail, **Then** ẩn hoặc disable nút Apply kèm lý do.

3. **Given** Volunteer nhấn "Đăng ký ngay", **When** thao tác được thực hiện, **Then** hiển thị hộp thoại xác nhận trước khi gửi.

4. **Given** đang gửi đơn, **When** API đang xử lý, **Then** nút chuyển sang trạng thái loading, không thể nhấn nhiều lần.

5. **Given** API trả thành công, **When** nhận phản hồi, **Then** hiển thị thông báo "Đăng ký thành công" và cập nhật badge trạng thái đơn trên giao diện.

6. **Given** API trả lỗi, **When** nhận phản hồi, **Then** hiển thị thông báo lỗi tương ứng.

---

### Edge Cases

- **Race condition - nhiều request cùng lúc**: Nếu Volunteer gửi nhiều request đồng thời (double click, network retry), chỉ 1 đơn được tạo, các request sau bị từ chối do trùng đơn.

- **Sát deadline**: Nếu `application_deadline` đã qua trong lúc Volunteer đang xem trang, request sẽ bị từ chối với HTTP 409.

- **Vừa đầy chỗ**: Nếu `approved_participants` vừa đạt `max_capacity` trước khi Volunteer gửi đơn, request bị từ chối với HTTP 409 "Sự kiện đã đủ số lượng".

- **Event đổi status giữa chừng**: Nếu event chuyển từ `PUBLISHED` sang `IN_PROGRESS`/`CANCELLED` trong lúc Volunteer đang xem trang, request bị từ chối.

---

## Requirements

### Functional Requirements

- **FR-001**: Hệ thống cung cấp endpoint `POST /api/v1/applications` cho phép Volunteer đã xác thực gửi đơn đăng ký.

- **FR-002**: Chỉ Volunteer có `is_active = true` mới được gửi đơn. Tài khoản bị khóa hoặc không phải role VOLUNTEER bị từ chối với HTTP 403.

- **FR-003**: Event phải thỏa mãn TẤT CẢ điều kiện: `is_active = true`, `status = PUBLISHED`, `start_date` chưa đến, `application_deadline` chưa qua. Thiếu bất kỳ điều kiện nào → từ chối với HTTP 409.

- **FR-004**: `approved_participants < max_capacity`. Nếu đã đầy → từ chối với HTTP 409.

- **FR-005**: Mỗi Volunteer chỉ được có 1 đơn active (`PENDING`, `APPROVED`, `WAITING_PAYMENT`) cho mỗi event. Nếu đã tồn tại → từ chối với HTTP 409.

- **FR-006**: Đơn mới được tạo với `status = PENDING`. `approved_participants` của event không thay đổi (chỉ tăng khi Staff/Manager duyệt đơn ở UC24).

- **FR-007**: Giao diện hiển thị nút "Đăng ký ngay" khi Volunteer đủ điều kiện. Ẩn/disable nút kèm lý do khi không đủ điều kiện.

- **FR-008**: Giao diện yêu cầu xác nhận trước khi gửi, hiển thị loading state khi đang xử lý, và thông báo kết quả sau khi hoàn tất.

---

### Key Entities

- **Application**: Đơn đăng ký, gồm `id`, `volunteer_id` (FK → User), `event_id` (FK → Event), `status` (PENDING | APPROVED | REJECTED | CANCELLED | WAITING_PAYMENT | PAYMENT_EXPIRED), `created_at`, `updated_at`.

- **Event**: Sự kiện, gồm `id`, `status`, `start_date`, `application_deadline`, `max_capacity`, `approved_participants`, `is_active`.

- **User**: Volunteer, gồm `id`, `role`, `is_active`.

---

## Success Criteria

- **SC-001**: 100% đơn gửi hợp lệ được tạo với `status = PENDING` và trả HTTP 201.

- **SC-002**: 100% trường hợp không đủ điều kiện bị từ chối với HTTP status code phù hợp (403, 404, 409) kèm thông báo rõ ràng.

- **SC-003**: Không có trường hợp trùng đơn (1 Volunteer có >1 đơn active cho cùng 1 event).

- **SC-004**: `approved_participants` không thay đổi sau khi gửi đơn (chỉ thay đổi khi duyệt đơn).

- **SC-005**: Thời gian phản hồi API dưới 1 giây trong điều kiện bình thường.

---

## Assumptions

- **A-001**: Xác thực JWT đã hoạt động, API đọc được `userId` và `role` từ token.

- **A-002**: Trang Event Detail (UC09) đã hiển thị đầy đủ thông tin event và nút Apply.

- **A-003**: Event có `application_deadline` và `start_date` được lưu ở UTC, backend so sánh với thời gian hiện tại của server.

- **A-004**: Đối với event có phí, UC15 KHÔNG xử lý thanh toán. Đơn vẫn được tạo với `status = PENDING`. Logic thanh toán sẽ do UC riêng xử lý.

---

## Out of Scope

- Xử lý thanh toán phí sự kiện (VNPay).
- Duyệt/từ chối đơn (thuộc UC24).
- Gửi email/thông báo sau khi nộp đơn.
- Cho phép Guest gửi đơn (phải đăng nhập).
- Tự động chuyển đơn từ PENDING sang trạng thái khác.
- Waitlist (danh sách chờ) khi sự kiện đầy.