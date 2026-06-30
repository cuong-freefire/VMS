# CONTEXT.md — Approve Event (UC69)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-30

## 1. PROBLEM STATEMENT

Sau khi Staff tạo sự kiện mới, sự kiện ở trạng thái PENDING và cần được Manager phê duyệt để chuyển sang APPROVED, cho phép Volunteer nhìn thấy và đăng ký. Nếu không có chức năng phê duyệt, mọi sự kiện sẽ mãi mãi ở trạng thái PENDING và không thể triển khai.

## 2. DOMAIN KNOWLEDGE

- **Event Status Workflow:** PENDING → APPROVED → ONGOING → COMPLETED.
- **Approval action:** Manager phê duyệt sự kiện, chuyển status từ PENDING sang APPROVED.
- **Visibility:** Chỉ sự kiện APPROVED mới hiển thị trên trang Event List cho Volunteer.
- **Bất biến trạng thái:** Không thể phê duyệt sự kiện đã ở trạng thái khác PENDING.
- **Audit log:** Ghi nhận thông tin Manager đã phê duyệt (who, when) để truy vết.

## 3. STAKEHOLDERS

- **Manager:** Cần phê duyệt sự kiện để cho phép triển khai.
- **Staff:** Cần biết sự kiện của mình đã được duyệt để tiếp tục quản lý.
- **Volunteer:** Gián tiếp — chỉ thấy sự kiện sau khi được duyệt.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Phân quyền:** Chỉ Manager mới có quyền phê duyệt.
- **Status check:** Chỉ được phê duyệt event có status = PENDING.
- **API format:** Endpoint là `PATCH /api/v1/events/:id/approve`.
- **Validation:** Kiểm tra event tồn tại và status hiện tại là PENDING.
- **Swagger:** Bắt buộc.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định bảng Event đã có trường status, approved_by, approved_at.
- Giả định middleware xác thực JWT và phân quyền đã hoạt động.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Gửi email thông báo:** Sau khi phê duyệt, có gửi email cho Staff tạo event không?
2. **Required note:** Có cần Manager nhập lý do phê duyệt không?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Ở v1 chưa gửi email. Sẽ tích hợp khi có module Email Services.
- **A2:** Không cần. Chỉ cần ghi nhận approved_by và approved_at.