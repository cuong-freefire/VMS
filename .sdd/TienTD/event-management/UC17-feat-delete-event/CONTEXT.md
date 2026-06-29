# CONTEXT.md — Feature: Staff Module - Delete Event (UC17)
# Người viết: TienTD | Ngày: 28/06/2026

## 1. PROBLEM STATEMENT
- **Current Pain Point**: Hiện tại, các sự kiện bị hủy hoặc tạo sai thông tin nghiêm trọng vẫn tồn tại trên hệ thống, làm loãng danh sách sự kiện và gây nhầm lẫn cho Volunteer.
- **Impact on Staff Workflow**: Staff gặp khó khăn trong việc quản lý danh sách sự kiện "sạch". Việc tồn tại các sự kiện rác làm tăng khối lượng công việc khi phải lọc dữ liệu để báo cáo.
- **Impact on Volunteers/Events**: Volunteer có thể đăng ký nhầm vào các sự kiện không còn khả năng tổ chức, dẫn đến trải nghiệm tệ và mất lòng tin vào tổ chức.
- **Business Value**: Giúp hệ thống luôn duy trì dữ liệu chính xác, giảm thiểu sai sót trong điều phối và đảm bảo Volunteer chỉ tiếp cận được các sự kiện hợp lệ.

## 2. DOMAIN KNOWLEDGE
- **Staff Role & Permissions**: Staff có quyền xóa các sự kiện do tổ chức mình quản lý, nhưng phải tuân thủ các ràng buộc về trạng thái đơn đăng ký.
- **Event Lifecycle**: 
    - Sự kiện `Draft`: Có thể xóa dễ dàng.
    - Sự kiện `Published`: Chỉ có thể xóa nếu chưa có Volunteer nào ứng tuyển (Application).
- **Business Rules**: 
    - **Không được phép xóa** sự kiện đã có ít nhất một đơn đăng ký (ngay cả khi đơn đó đang ở trạng thái Pending). Trong trường hợp này, Staff phải dùng chức năng `Cancel Event` (Out of scope của UC này).
    - Staff chỉ được xóa sự kiện thuộc Organization của mình.
- **Cross-Module Dependencies**: UC17 ảnh hưởng trực tiếp đến UC08 (View Event List) và UC22 (View Application List).

## 3. STAKEHOLDERS
- **Staff (Actor chính)**: Muốn loại bỏ các sự kiện không cần thiết một cách nhanh chóng và an toàn.
- **Volunteer**: Không còn nhìn thấy các sự kiện đã bị xóa trong danh sách tìm kiếm.
- **System Admin**: Quan tâm đến việc lưu vết (Audit Log) để biết lý do tại sao một sự kiện bị gỡ bỏ.
- **System/Infrastructure**: Đảm bảo tính toàn vẹn dữ liệu (Data Integrity) khi xóa sự kiện (xóa các bản ghi liên quan nếu cần hoặc sử dụng Soft Delete).

## 4. CONSTRAINTS (Ràng buộc không thể thay đổi)
- **Authorization Constraint**: Staff CHỈ được phép xóa sự kiện thuộc Organization ID mà họ quản lý.
- **Business Rule Constraint**: Tuyệt đối KHÔNG được xóa sự kiện đã có Volunteer đăng ký tham gia.
- **Audit Trail Constraint**: Mọi hành động xóa phải được ghi lại trong hệ thống kèm theo ID của Staff thực hiện và thời gian xóa.
- **State Transition Constraint**: Không thể xóa các sự kiện đã ở trạng thái `Ongoing` hoặc `Completed`.

## 5. ASSUMPTIONS (Giả định)
- **Giả định về Staff behavior**: Staff đã kiểm tra kỹ trước khi xóa vì hành động này có thể không hoàn tác được trên giao diện.
- **Giả định về dữ liệu**: Giả định hệ thống đã có cơ chế kiểm tra quan hệ giữa Event và Application trước khi thực hiện lệnh xóa.
- **Giả định về permission**: Staff đã được phân quyền quản lý sự kiện.

## 6. OPEN QUESTIONS
1. Chúng ta nên sử dụng **Hard Delete** (xóa vĩnh viễn khỏi DB) hay **Soft Delete** (đánh dấu là đã xóa)?
2. Có cần yêu cầu Staff nhập "Lý do xóa" trước khi thực hiện không?

## 7. DECISIONS
**Quyết định cho câu hỏi 1 - Data Integrity Strategy:**
- **Lựa chọn**: Cách 2 - Sử dụng **Soft Delete** (thêm trường `deleted_at`).
- **Lý do**: Để phục vụ mục đích audit và có thể khôi phục dữ liệu trong trường hợp Staff xóa nhầm.
- **Impact**: Các câu lệnh Query ở các UC khác (như View List) cần bổ sung điều kiện `deleted_at IS NULL`.

**Quyết định cho câu hỏi 2 - Validation Strategy:**
- **Lựa chọn**: Option B - Hiển thị Pop-up xác nhận "Bạn có chắc chắn muốn xóa?" thay vì bắt nhập lý do.
- **Lý do**: Giảm thiểu thao tác cho Staff đối với các sự kiện Draft/Rác.