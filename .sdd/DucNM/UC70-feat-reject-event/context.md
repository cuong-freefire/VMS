# CONTEXT.md — Reject Event (UC70)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-30

## 1. PROBLEM STATEMENT

Khi Manager đánh giá một sự kiện PENDING và thấy không đủ điều kiện (ví dụ: thông tin không đầy đủ, không phù hợp với mục tiêu tổ chức), Manager cần có khả năng từ chối sự kiện đó. Nếu không có chức năng từ chối, Manager không có cách nào ngăn chặn sự kiện không phù hợp hiển thị cho Volunteer.

## 2. DOMAIN KNOWLEDGE

- **Event Status Workflow:** PENDING → REJECTED (kết thúc — không thể quay lại PENDING hoặc APPROVED).
- **Rejection action:** Manager từ chối sự kiện, chuyển status từ PENDING sang REJECTED.
- **Lý do từ chối:** Manager cần nhập lý do từ chối để Staff biết và có thể chỉnh sửa, tạo lại.
- **Bất biến trạng thái:** Một khi đã REJECTED, không thể phê duyệt lại. Staff phải tạo sự kiện mới.
- **Audit log:** Ghi nhận thông tin Manager đã từ chối (who, when, reason).

## 3. STAKEHOLDERS

- **Manager:** Cần từ chối sự kiện không đủ điều kiện.
- **Staff:** Cần biết lý do từ chối để cải thiện và tạo lại sự kiện.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Phân quyền:** Chỉ Manager mới có quyền từ chối.
- **Status check:** Chỉ được từ chối event có status = PENDING.
- **Reason required:** Bắt buộc nhập lý do từ chối (rejection_reason).
- **API format:** Endpoint là `PATCH /api/v1/events/:id/reject`.
- **Validation:** Validate bằng Zod.
- **Swagger:** Bắt buộc.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định bảng Event đã có trường status, rejection_reason, rejected_by, rejected_at.
- Giả định middleware xác thực JWT và phân quyền đã hoạt động.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Lý do từ chối:** Có bắt buộc nhập lý do không?
2. **Gửi email:** Có gửi email thông báo từ chối cho Staff không?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Có. Lý do từ chối là bắt buộc để Staff biết và cải thiện.
- **A2:** Ở v1 chưa gửi email. Sẽ tích hợp sau với module Email Services.