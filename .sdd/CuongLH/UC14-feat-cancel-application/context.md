# CONTEXT.md — Feature: Cancel Application (UC14)

**Người viết:** CuongLH | **Ngày:** 21/07/2026 | **Phiên bản:** 1.1

## 1. PROBLEM STATEMENT

Tình nguyện viên có thể không còn tham gia được sự kiện sau khi đã đăng ký. Vì vậy, họ cần có quyền tự hủy đơn trước khi sự kiện bắt đầu.

**UC14** cho phép tình nguyện viên hủy đơn đang ở trạng thái `PENDING` hoặc `APPROVED` và chuyển đơn sang `CANCELLED`.

Tính năng này giúp:

- Trả lại chỗ trống cho người khác nếu đơn đã được duyệt.
- Hạn chế trường hợp đã giữ chỗ nhưng không tham gia.
- Giúp số lượng người tham gia phản ánh đúng thực tế.

## 2. DOMAIN KNOWLEDGE

### 2.1 APPLICATION STATUS

Các thay đổi trạng thái được phép:

```text
PENDING  → CANCELLED
PENDING  → APPROVED
PENDING  → REJECTED
APPROVED → CANCELLED
```

Các trạng thái kết thúc:

- `REJECTED`: Đơn đã bị từ chối và không thể hủy.
- `CANCELLED`: Đơn đã bị hủy và không thể chuyển lại trạng thái cũ.

Việc một đơn đã chuyển sang `CANCELLED` không có nghĩa là tình nguyện viên bị cấm đăng ký lại. Đơn cũ vẫn giữ trạng thái `CANCELLED`, còn lần đăng ký sau được ghi nhận riêng.

### 2.2 BUSINESS RULES

1. **Quyền hủy đơn**
   - Tình nguyện viên chỉ được hủy đơn của chính mình.
   - Tình nguyện viên chỉ được hủy khi tài khoản vẫn đang hoạt động.

2. **Thời điểm được hủy**
   - Chỉ được hủy trước khi sự kiện bắt đầu.
   - Không được hủy khi sự kiện đang diễn ra, đã kết thúc hoặc đã bị hủy.

3. **Trạng thái được hủy**
   - Được hủy đơn ở trạng thái `PENDING`.
   - Được hủy đơn ở trạng thái `APPROVED`.
   - Không được hủy đơn ở trạng thái `REJECTED` hoặc `CANCELLED`.

4. **Cách ghi nhận đơn đã hủy**
   - Đơn không bị xóa khỏi hệ thống.
   - Trạng thái của đơn được chuyển thành `CANCELLED`.

### 2.3 EVENT STATUS RULES

| Trạng thái sự kiện | Được hủy đơn? | Giải thích |
|---|---|---|
| `DRAFT` | Có | Sự kiện chưa bắt đầu. |
| `PENDING_APPROVAL` | Có | Sự kiện đang chờ duyệt và chưa bắt đầu. |
| `PUBLISHED` | Có | Sự kiện đã được công bố nhưng chưa bắt đầu. |
| `IN_PROGRESS` | Không | Sự kiện đang diễn ra. |
| `COMPLETED` | Không | Sự kiện đã kết thúc. |
| `CANCELLED` | Không | Sự kiện đã bị hủy. |

Ngoài trạng thái sự kiện, hệ thống vẫn phải kiểm tra thời gian bắt đầu. Tình nguyện viên không được hủy nếu sự kiện đã bắt đầu.

### 2.4 PARTICIPANT CAPACITY

Khi hủy đơn `APPROVED`:

- Số người đã được duyệt của sự kiện giảm đi 1.
- Chỗ trống được trả lại cho sự kiện.
- Số người đã được duyệt không được nhỏ hơn 0.

Khi hủy đơn `PENDING`:

- Số người đã được duyệt không thay đổi vì đơn chưa được chấp nhận.

## 3. STAKEHOLDERS

| Đối tượng | Vai trò | Mối quan tâm |
|---|---|---|
| **Tình nguyện viên** | Người hủy đơn | Có thể chủ động hủy khi không tham gia được và nhận được thông báo kết quả rõ ràng. |
| **Nhân viên / Quản lý** | Người quản lý sự kiện | Theo dõi đúng số lượng người đã được duyệt và số chỗ còn lại. |
| **Quản trị viên** | Người vận hành hệ thống | Đảm bảo dữ liệu đơn đăng ký và số người tham gia luôn chính xác. |
| **Tình nguyện viên khác** | Người có nhu cầu tham gia | Có thêm cơ hội đăng ký hoặc được duyệt khi có chỗ trống. |

## 4. CONSTRAINTS

### 4.1 BUSINESS CONSTRAINTS

- Tình nguyện viên chỉ được hủy đơn của chính mình.
- Đơn phải ở trạng thái `PENDING` hoặc `APPROVED`.
- Sự kiện phải chưa bắt đầu.
- Đơn đã chuyển sang `CANCELLED` thì không thể khôi phục.
- Khi hủy đơn `APPROVED`, số người đã được duyệt phải giảm tương ứng.
- Đơn `REJECTED` không được phép hủy.

### 4.2 SCOPE CONSTRAINTS

- Không gửi thư điện tử khi tình nguyện viên hủy đơn.
- Không lưu lịch sử kiểm tra riêng cho thao tác hủy.
- Không lưu lý do hủy.
- Không tự động duyệt đơn `PENDING` khác khi có chỗ trống.
- Việc duyệt đơn khác vẫn do Nhân viên hoặc Quản lý thực hiện.

## 5. ASSUMPTIONS

1. Hệ thống xác định được người đang thực hiện yêu cầu hủy.
2. Hệ thống xác định được đơn đăng ký và sự kiện liên quan.
3. Hệ thống có thể cập nhật trạng thái đơn và số người đã được duyệt.
4. Tài khoản của tình nguyện viên phải đang hoạt động.
5. Khi một đơn `APPROVED` bị hủy, chỗ trống được trả lại nhưng không có đơn khác được tự động duyệt.
6. Tình nguyện viên có thể đăng ký lại nếu sự kiện vẫn còn nhận đăng ký và họ vẫn đáp ứng các điều kiện tham gia.

## 6. OPEN QUESTIONS

Không còn câu hỏi nào chưa được quyết định. Các nội dung đã được chốt được ghi tại phần **ANSWERS**.

## 7. ANSWERS

| # | Quyết định | Giải thích | Người chốt | Ngày |
|---|---|---|---|---|
| Q1 | Cho phép hủy đơn `PENDING` và `APPROVED`. | Việc được hủy phụ thuộc vào thời gian bắt đầu của sự kiện, không chỉ phụ thuộc vào trạng thái đơn. | Nhóm | 2026-07-21 |
| Q2 | Khi hủy đơn `APPROVED`, số người đã được duyệt giảm đi 1. Không gửi thư điện tử và không lưu lịch sử kiểm tra riêng. | Thư điện tử và lịch sử kiểm tra không nằm trong phạm vi hiện tại. | Nhóm | 2026-07-21 |
| Q3 | Cho phép đăng ký lại sau khi đã hủy. | Đơn cũ vẫn giữ trạng thái `CANCELLED`. Người dùng có thể đăng ký lại nếu sự kiện vẫn nhận đăng ký và họ đủ điều kiện. | Nhóm | 2026-07-21 |
| Q4 | Không hiển thị nút Hủy cho đơn `REJECTED`. | Đơn đã bị từ chối nên không còn thao tác hủy. | Nhóm | 2026-07-21 |
| Q5 | Không lưu lý do hủy. | Nội dung này chưa cần thiết trong phạm vi hiện tại và có thể bổ sung sau. | Nhóm | 2026-07-21 |
