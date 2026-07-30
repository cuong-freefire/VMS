# CONTEXT.md — Feature: Submit Application (UC15)

**Người viết:** CuongLH | **Ngày:** 28/07/2026 | **Phiên bản:** 1.0

## 1. PROBLEM STATEMENT

Tình nguyện viên sau khi tìm được sự kiện phù hợp cần có khả năng gửi đơn đăng ký tham gia. Hiện tại, chưa có cơ chế để tình nguyện viên thể hiện mong muốn tham gia một sự kiện cụ thể.

**UC15** cho phép tình nguyện viên gửi đơn đăng ký tham gia sự kiện. Đơn được tạo ở trạng thái `PENDING` và chờ Nhân viên/Quản lý xét duyệt.

Tính năng này giúp:

- Số hóa quy trình đăng ký sự kiện tình nguyện.
- Tạo đầu mối để Nhân viên/Quản lý xét duyệt và quản lý người tham gia.
- Là bước khởi đầu cho toàn bộ pipeline: Xét duyệt → Điểm danh → Cấp chứng nhận.

## 2. DOMAIN KNOWLEDGE

### 2.1 APPLICATION STATUS

Trạng thái khởi tạo của đơn đăng ký:

```text
[Volunteer gửi đơn] → PENDING
```

Luồng trạng thái sau khi gửi đơn (phụ thuộc vào loại sự kiện):

**Event miễn phí:**

```text
PENDING → APPROVED
PENDING → REJECTED
```

**Event có phí:**

```text
PENDING → WAITING_PAYMENT → (thanh toán thành công) → APPROVED
                            → (quá hạn) → PAYMENT_EXPIRED
```

Tại thời điểm gửi đơn (UC15), đơn luôn được tạo với trạng thái `PENDING`. Việc chuyển sang `WAITING_PAYMENT` chỉ xảy ra sau khi Nhân viên/Quản lý duyệt đơn (không thuộc phạm vi UC15).

### 2.2 BUSINESS RULES

1. **FR-001 — Quyền đăng ký**
   - Chỉ người dùng có vai trò `VOLUNTEER` mới được gửi đơn.
   - Tài khoản phải đang hoạt động (`is_active: true` — được enforce bởi auth middleware).

2. **FR-002 — Điều kiện sự kiện**
   - Sự kiện phải ở trạng thái `PUBLISHED`.
   - Sự kiện chưa bắt đầu (`startDate > now`).

3. **FR-003 — Sức chứa**
   - Số người đã được duyệt hiện tại phải nhỏ hơn sức chứa tối đa (`approvedParticipants < maxCapacity`).
   - KHÔNG kiểm tra số đơn `PENDING` — chỉ kiểm tra số đã duyệt.

4. **FR-004 — Giới hạn đơn trên mỗi sự kiện**
   - Mỗi tình nguyện viên chỉ có **1 đơn active** cho mỗi sự kiện.
   - "Active" = trạng thái KHÔNG nằm trong danh sách `[CANCELLED, PAYMENT_EXPIRED]`.
   - Các trạng thái cho phép đăng ký lại: `CANCELLED` (tự hủy), `PAYMENT_EXPIRED` (hết hạn thanh toán).
   - Các trạng thái chặn đăng ký lại: `PENDING`, `APPROVED`, `REJECTED`, `WAITING_PAYMENT`.

5. **FR-005 — Trạng thái khởi tạo**
   - Đơn luôn được tạo với trạng thái `PENDING`.
   - `WAITING_PAYMENT` chỉ được gán sau khi Staff/Manager duyệt đơn cho event có phí.

6. **FR-006 — Nguyên tử (Atomicity)**
   - Toàn bộ thao tác kiểm tra và tạo đơn được thực hiện trong một Prisma transaction.
   - Đảm bảo không có race condition giữa kiểm tra sức chứa và tạo đơn.

### 2.3 EVENT STATUS RULES

| Trạng thái sự kiện | Được đăng ký? | Giải thích |
|---|---|---|
| `DRAFT` | Không | Sự kiện chưa sẵn sàng. |
| `PENDING_APPROVAL` | Không | Sự kiện đang chờ duyệt. |
| `PUBLISHED` | Có | Sự kiện đã được công bố và đang nhận đơn. |
| `IN_PROGRESS` | Không | Sự kiện đang diễn ra. |
| `COMPLETED` | Không | Sự kiện đã kết thúc. |
| `CANCELLED` | Không | Sự kiện đã bị hủy. |

Ngoài trạng thái sự kiện, hệ thống vẫn phải kiểm tra thời gian bắt đầu. Tình nguyện viên không được đăng ký nếu sự kiện đã bắt đầu.

### 2.4 DUPLICATE CHECK

Bảng trạng thái và khả năng đăng ký lại:

| Trạng thái đơn cũ | Được đăng ký lại? | Giải thích |
|---|---|---|
| `CANCELLED` | Có | Tình nguyện viên đã tự hủy → được phép đăng ký lại. |
| `PAYMENT_EXPIRED` | Có | Hết hạn thanh toán → được phép đăng ký lại. |
| `PENDING` | Không | Đơn đang chờ xét duyệt. |
| `APPROVED` | Không | Đơn đã được duyệt. |
| `REJECTED` | Không | Đơn đã bị từ chối — trạng thái kết thúc. |
| `WAITING_PAYMENT` | Không | Đơn đang chờ thanh toán. |

## 3. STAKEHOLDERS

| Đối tượng | Vai trò | Mối quan tâm |
|---|---|---|
| **Tình nguyện viên** | Người gửi đơn | Có thể đăng ký tham gia sự kiện một cách dễ dàng và nhận được phản hồi rõ ràng (thành công / lỗi gì). |
| **Nhân viên / Quản lý** | Người xét duyệt đơn | Nhận được đơn đăng ký hợp lệ để xét duyệt; không bị quá tải bởi đơn trùng lặp hoặc đơn vượt sức chứa. |
| **Quản trị viên** | Người vận hành hệ thống | Đảm bảo dữ liệu đơn đăng ký nhất quán, không có race condition. |
| **Tình nguyện viên khác** | Người cùng muốn tham gia | Cạnh tranh công bằng — không ai bị chiếm chỗ bởi đơn không hợp lệ. |

## 4. CONSTRAINTS

### 4.1 BUSINESS CONSTRAINTS

- Chỉ VOLUNTEER có tài khoản active mới được gửi đơn.
- Sự kiện phải ở trạng thái `PUBLISHED` và chưa bắt đầu.
- Sự kiện chưa đạt sức chứa tối đa (`approvedParticipants < maxCapacity`).
- Mỗi tình nguyện viên chỉ có 1 đơn active cho mỗi sự kiện.
- Đơn luôn khởi tạo ở trạng thái `PENDING`.
- Toàn bộ thao tác là atomic (Prisma transaction).

### 4.2 SCOPE CONSTRAINTS

- Không gửi email xác nhận khi tình nguyện viên gửi đơn.
- Không tự động duyệt đơn (phải có Staff/Manager xét duyệt).
- Không hỗ trợ hàng đợi (waitlist) — nếu đủ người, từ chối luôn.
- Không xử lý thanh toán tại thời điểm gửi đơn (kể cả event có phí).
- Không lưu lịch sử thay đổi trạng thái riêng cho thao tác gửi đơn.
- `message` là trường tùy chọn, tối đa 500 ký tự.

## 5. ASSUMPTIONS

1. Hệ thống xác định được người đang thực hiện yêu cầu (qua JWT HttpOnly Cookie).
2. Auth middleware đã xác thực `is_active: true` trước khi request đến controller.
3. Hệ thống có thể tra cứu thông tin sự kiện (status, startDate, maxCapacity, approvedParticipants, isPaid) trong transaction.
4. Prisma transaction đảm bảo atomicity giữa các thao tác kiểm tra và tạo đơn.
5. `approvedParticipants` được duy trì chính xác bởi các chức năng xét duyệt và hủy đơn.
6. Tình nguyện viên đã xem thông tin chi tiết sự kiện trước khi quyết định đăng ký.

## 6. OPEN QUESTIONS

Không còn câu hỏi nào chưa được quyết định. Các nội dung đã được chốt được ghi tại phần **ANSWERS**.

## 7. ANSWERS

| # | Quyết định | Giải thích | Người chốt | Ngày |
|---|---|---|---|---|
| Q1 | Chỉ kiểm tra `approvedParticipants`, không kiểm tra số đơn `PENDING`. | `PENDING` chưa chiếm chỗ — chỉ `APPROVED` mới tính vào sức chứa. Điều này cho phép nhiều người cùng nộp đơn và Staff/Manager sẽ chọn duyệt trong giới hạn sức chứa. | Nhóm | 2026-07-20 |
| Q2 | Cho phép đăng ký lại nếu đơn cũ ở trạng thái `CANCELLED` hoặc `PAYMENT_EXPIRED`. | Đây là các trạng thái không còn hiệu lực — tình nguyện viên có quyền đăng ký lại. | Nhóm | 2026-07-20 |
| Q3 | Không cho phép đăng ký lại nếu đơn cũ ở trạng thái `REJECTED`. | `REJECTED` là trạng thái kết thúc — tình nguyện viên đã bị từ chối và không được đăng ký lại cho cùng sự kiện. | Nhóm | 2026-07-20 |
| Q4 | Không gửi email xác nhận khi gửi đơn thành công. | Email không nằm trong phạm vi hiện tại. Có thể bổ sung sau khi module Email Service (MD15) hoàn thiện. | Nhóm | 2026-07-20 |
| Q5 | Không hỗ trợ hàng đợi (waitlist). | Khi sự kiện đủ người, từ chối luôn đơn mới. Hàng đợi là tính năng phức tạp, có thể cân nhắc trong tương lai. | Nhóm | 2026-07-20 |