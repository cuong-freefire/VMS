# CONTEXT.md — View Organization Detail (UC38)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-28

## 1. PROBLEM STATEMENT

Sau khi Admin/Manager xem danh sách tổ chức, họ cần xem đầy đủ thông tin chi tiết của một tổ chức cụ thể để đánh giá hoạt động, kiểm tra thông tin liên hệ, và xem các sự kiện đang/đã thuộc về tổ chức đó. Nếu không có trang chi tiết, Admin không thể hiểu rõ từng tổ chức và không thể ra quyết định quản lý chính xác.

## 2. DOMAIN KNOWLEDGE

- **Organization Detail:** Bao gồm toàn bộ thông tin định danh của tổ chức (tên, mô tả, địa chỉ, số điện thoại, email, website, logo) và danh sách sự kiện liên kết.
- **Quan hệ Organization – Event:** Một tổ chức có thể chủ quản nhiều sự kiện. Trang chi tiết tổ chức cần hiển thị tóm tắt danh sách sự kiện thuộc tổ chức đó (tên sự kiện, trạng thái, ngày tổ chức).
- **Phân quyền xem chi tiết:** Admin thấy cả tổ chức active lẫn inactive. Manager thấy chi tiết tổ chức active. Staff thấy chi tiết tổ chức active. Volunteer và Guest không có quyền.

## 3. STAKEHOLDERS

- **Admin:** Cần xem đầy đủ thông tin tổ chức, kể cả tổ chức đã inactive, để kiểm tra lịch sử.
- **Manager:** Cần xem chi tiết tổ chức active để hỗ trợ báo cáo theo đơn vị tổ chức.
- **Staff:** Cần xem chi tiết tổ chức active để nắm thông tin liên hệ khi cần phối hợp tổ chức sự kiện.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Phân quyền:** Volunteer và Guest bị từ chối HTTP 403/401.
- **404 cho Manager/Staff với tổ chức inactive:** Manager và Staff không được thấy tổ chức inactive — hệ thống trả về HTTP 404 thay vì 403 (để không lộ sự tồn tại của tổ chức inactive).
- **API format:** Endpoint bắt buộc `GET /api/v1/organizations/:id`.
- **Swagger:** Bắt buộc có Swagger JSDoc đầy đủ.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định bảng Organization và bảng Event đã có quan hệ foreign key trong schema.
- Giả định danh sách sự kiện trong trang chi tiết tổ chức chỉ hiển thị tóm tắt (tên, trạng thái, ngày), không hiển thị toàn bộ chi tiết sự kiện.
- Giả định logo tổ chức được lưu dưới dạng URL trỏ đến Cloudinary.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Danh sách sự kiện trong chi tiết tổ chức:** Hiển thị tất cả sự kiện (kể cả đã kết thúc) hay chỉ sự kiện đang active/sắp diễn ra?
2. **Số lượng sự kiện tối đa hiển thị:** Có giới hạn số sự kiện hiển thị trong trang chi tiết không?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Hiển thị tất cả sự kiện thuộc tổ chức (kể cả đã hoàn thành/hủy), có thể phân trang con nếu số lượng lớn.
- **A2:** Giới hạn tối đa 10 sự kiện gần nhất trong trang chi tiết. Nếu cần xem thêm, người dùng truy cập trang Event List với bộ lọc theo tổ chức.
