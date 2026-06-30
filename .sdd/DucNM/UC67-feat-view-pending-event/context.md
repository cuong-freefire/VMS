# CONTEXT.md — View Pending Event (UC67)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-30

## 1. PROBLEM STATEMENT

Khi Staff tạo sự kiện mới, sự kiện đó ở trạng thái PENDING và cần được Manager xét duyệt trước khi hiển thị cho Volunteer đăng ký. Manager cần xem danh sách các sự kiện đang chờ duyệt để tiến hành phê duyệt hoặc từ chối. Nếu không có chức năng này, Manager không thể biết có sự kiện nào đang chờ xử lý.

## 2. DOMAIN KNOWLEDGE

- **Event Status Workflow:** PENDING → APPROVED/REJECTED → ONGOING → COMPLETED.
- **Event Approval:** Sự kiện mới tạo mặc định ở trạng thái PENDING. Chỉ Manager mới có quyền phê duyệt hoặc từ chối.
- **Visibility:** Chỉ sự kiện APPROVED mới hiển thị cho Volunteer đăng ký.
- **Phân quyền:** Chỉ Manager mới có quyền xem danh sách sự kiện PENDING.

## 3. STAKEHOLDERS

- **Manager:** Cần xem danh sách sự kiện chờ duyệt để xử lý.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Phân quyền:** Chỉ Manager mới có quyền truy cập. Admin cũng có thể xem. Staff, Volunteer, Guest bị từ chối.
- **API format:** Endpoint là `GET /api/v1/events/pending` hoặc `GET /api/v1/events?status=pending`.
- **Swagger:** Bắt buộc.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định bảng Event đã có trường `status` với các giá trị: PENDING, APPROVED, REJECTED, ONGOING, COMPLETED.
- Giả định middleware xác thực JWT và phân quyền đã hoạt động.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Endpoint:** Nên dùng endpoint riêng hay query param?
2. **Phân trang:** Có cần phân trang không?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Dùng query param `status=pending` trên endpoint `GET /api/v1/events` để tái sử dụng.
- **A2:** Có phân trang (page, limit) mặc định limit = 20.