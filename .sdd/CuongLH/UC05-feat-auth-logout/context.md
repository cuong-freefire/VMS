# CONTEXT.md — Feature: Authentication - Logout (UC05)

# Người viết: CuongLH | Ngày: 27/06/2026

## 1. PROBLEM STATEMENT

Trong hệ thống VMS, việc đăng xuất không chỉ đơn thuần là chuyển hướng trang. Để đảm bảo an toàn bảo mật, hệ thống cần một cơ chế hủy phiên làm việc (Session Termination) hiệu quả. Yêu cầu cốt lõi là phải xóa bỏ hoàn toàn mã định danh (JWT Token) đang được lưu trữ trong trình duyệt, đồng thời xóa các trạng thái hiển thị của người dùng ở phía giao diện để ngăn chặn việc truy cập trái phép hoặc rò rỉ thông tin cá nhân trên các thiết bị dùng chung [1, Conversation].

## 2. DOMAIN KNOWLEDGE

- **JWT HttpOnly Cookie:** Hệ thống sử dụng cơ chế xác thực JWT được lưu trữ trong HttpOnly Cookie để chống lại các cuộc tấn công XSS. Việc đăng xuất yêu cầu Backend gửi chỉ thị `Clear-Cookie` cho trình duyệt.
- **Stateless Authentication:** Do JWT là phi trạng thái, việc đăng xuất thực chất là hành động xóa thông tin xác thực ở phía Client (trình duyệt) để các request tiếp theo không mang theo Token hợp lệ.
- **UI State Clearing:** Mặc dù không sử dụng Redux, Frontend (React) vẫn cần xóa các biến trạng thái nội bộ (Local State/Context) chứa thông tin người dùng ngay sau khi nhận phản hồi đăng xuất thành công để cập nhật giao diện (ẩn tên người dùng, hiện nút Đăng nhập).

## 3. STAKEHOLDERS

- **Người dùng đã đăng nhập (Volunteer, Staff, Manager, Admin):** Muốn thoát khỏi hệ thống một cách an toàn.
- **System Backend:** Xử lý logic xóa Cookie và trả về phản hồi chuẩn.
- **System Frontend:** Thực hiện lệnh gọi API đăng xuất, xóa bộ nhớ tạm của UI và điều hướng người dùng.

## 4. CONSTRAINTS (Ràng buộc không thể thay đổi)

- **Tech Stack:** Tuân thủ Backend NodeJS và Frontend React.
- **Protocol:** API đăng xuất phải sử dụng phương thức phù hợp (POST/DELETE) với prefix `/api/v1/auth/logout`.
- **Response Standard:** BẮT BUỘC sử dụng hàm tiện ích `backend\src\utils\response.util.js` cho kết quả trả về.
- **Security:** Mã Token phải được xóa sạch khỏi Cookie trình duyệt, không được để lại dấu vết xác thực.

## 5. ASSUMPTIONS (Giả định)

- Giả định rằng sau khi đăng xuất thành công, hệ thống sẽ luôn điều hướng người dùng về trang **Landing Page (UC01)**.
- Giả định rằng phía Frontend sẽ xóa toàn bộ dữ liệu cá nhân trong bộ nhớ tạm (React Context/Local State) ngay khi nhận mã thành công từ API.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Server-side Blacklist:** Hệ thống có cần lưu mã Token vừa đăng xuất vào danh sách đen (Blacklist trong Redis) để vô hiệu hóa nó ngay lập tức trước khi hết hạn tự nhiên không?
2. **Audit Logging:** Có cần ghi lại nhật ký (Audit log) thời điểm và đối tượng đăng xuất để phục vụ công tác quản lý không?.
3. **Global Logout:** Người dùng có cần tùy chọn "Đăng xuất khỏi tất cả các thiết bị" (hủy toàn bộ Refresh Tokens) không?

## 7. ANSWERS

1. **Server-side Blacklist:**
   - **QUYẾT ĐỊNH:** **KHÔNG SỬ DỤNG.**
   - **Thực hiện:** Hệ thống sẽ dựa hoàn toàn vào cơ chế Stateless của JWT và hành động xóa Cookie ở phía trình duyệt để kết thúc phiên làm việc. Không triển khai lưu trữ Token bị hủy vào Redis.

2. **Audit Logging:**
   - **QUYẾT ĐỊNH:** **KHÔNG THỰC HIỆN.**
   - **Thực hiện:** Hệ thống sẽ không ghi nhận nhật ký lịch sử đăng xuất vào cơ sở dữ liệu để tối ưu hóa hiệu năng và giảm độ phức tạp của bảng log.

3. **Global Logout:**
   - **QUYẾT ĐỊNH:** **KHÔNG CẦN THIẾT.**
   - **Thực hiện:** Hành động đăng xuất chỉ có tác dụng cục bộ trên thiết bị/trình duyệt hiện tại bằng cách xóa HttpOnly Cookie liên kết với domain đó.
