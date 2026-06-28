# CONTEXT.md — Feature: Profile Management - Edit Volunteer Skills (UC20)

# Người viết: CuongLH | Ngày: 25/06/2026

## 1. PROBLEM STATEMENT

Để tăng cơ hội được phê duyệt tham gia các sự kiện tình nguyện phù hợp với năng lực, tình nguyện viên cần một chức năng để cập nhật danh sách kỹ năng (skills) của bản thân. Chức năng này cần đảm bảo người dùng chỉ được phép chọn hoặc bỏ chọn các kỹ năng chuẩn hóa đã được Ban quản trị (Manager) tạo sẵn, giúp hệ thống duy trì tính nhất quán của dữ liệu.

## 2. DOMAIN KNOWLEDGE

- **Master Data (Dữ liệu chuẩn):** Danh mục kỹ năng là dữ liệu tập trung do Manager quản lý. Tình nguyện viên TUYỆT ĐỐI KHÔNG được phép tự nhập tay (free-text) kỹ năng mới [2, 3].
- **Data Synchronization (Đồng bộ N-N):** Hành vi "thêm" hoặc "bớt" kỹ năng thực chất là việc đồng bộ lại bảng trung gian (ví dụ: `user_skills`) kết nối giữa tài khoản người dùng và danh mục kỹ năng.

## 3. STAKEHOLDERS

- **Volunteer:** Người dùng muốn làm nổi bật hồ sơ cá nhân bằng các kỹ năng phù hợp.
- **System / Database:** Đảm bảo toàn vẹn dữ liệu (Data Integrity) khi map các `skill_id`.

## 4. CONSTRAINTS (Ràng buộc không thể thay đổi)

- **Bảo mật truy cập (Anti-IDOR):** Bắt buộc sử dụng JWT token hợp lệ. THE system SHALL lấy `user_id` từ payload của token để thực hiện cập nhật. KHÔNG nhận `user_id` từ request body hay params để tránh việc sửa kỹ năng của người khác.
- **Toàn vẹn tham chiếu (Referential Integrity):** Bất kỳ `skill_id` nào được gửi lên BẮT BUỘC phải tồn tại trong bảng danh mục `skills` gốc.

## 5. ASSUMPTIONS (Giả định)

- Giả định Backend và Frontend đã thống nhất cơ chế gửi nhận: Frontend sẽ gửi một **mảng (array) chứa toàn bộ danh sách `skill_id` cuối cùng** mà người dùng đã chọn (thay vì gửi từng request "add" hoặc "remove" lẻ tẻ).

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Cơ chế đồng bộ (Sync Strategy):** Khi nhận được mảng `skill_ids` mới từ Frontend, bạn muốn Backend xử lý theo cách nào?
   - *Cách 1 (Xóa & Thêm mới - Replace All):* Backend xóa toàn bộ kỹ năng cũ của user trong bảng trung gian, sau đó insert hàng loạt mảng `skill_ids` mới vào (Dễ code Backend, phổ biến, code chạy gọn trong 1 transaction).
   - *Cách 2 (So sánh & Cập nhật - Diffing):* Backend lấy list cũ lên so sánh, chỉ xóa những ID bị untick và insert những ID mới tick (Tối ưu query DB hơn, nhưng code phức tạp).
2. **Xử lý ID không hợp lệ:** Nếu Frontend vô tình gửi lên một mảng (trong đó 999 là ID đã bị xóa hoặc không tồn tại trong DB), Backend nên làm gì?
   - *Cách 1 (Strict):* Báo lỗi 400 Bad Request và hủy bỏ toàn bộ thao tác lưu.
   - *Cách 2 (Lenient):* Bỏ qua ID 999, vẫn lưu thành công ID 1 và 2.
3. **Giới hạn số lượng:** Có giới hạn số lượng kỹ năng tối đa mà một tình nguyện viên được chọn không (ví dụ: tối đa 10 kỹ năng) để tránh việc họ tick chọn "tất cả mọi kỹ năng"?
