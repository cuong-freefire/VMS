# CONTEXT.md — View Dashboard (UC54)

# Người viết: DucNM (Member 5) | Ngày: 2026-06-28

## 1. PROBLEM STATEMENT

Hệ thống VMS sinh ra nhiều dữ liệu nghiệp vụ hàng ngày: sự kiện, người dùng, đơn đăng ký, quyên góp, điểm danh. Admin và Manager cần một dashboard tổng quan để theo dõi nhanh tình trạng hệ thống qua các chỉ số KPI và biểu đồ trực quan. Nếu không có dashboard, dữ liệu giá trị bị chôn vùi trong database và không thể khai thác để ra quyết định kịp thời.

## 2. DOMAIN KNOWLEDGE

- **Dashboard:** Trang tổng quan hiển thị KPI cards và biểu đồ.
- **KPI cards:** Tổng sự kiện (phân bố theo trạng thái), tổng user (phân bố theo role), tổng đơn đăng ký (tỷ lệ duyệt/từ chối), tổng quyên góp trong tháng, tỷ lệ điểm danh trung bình.
- **Biểu đồ:**
  - Bar chart: Số sự kiện theo tháng (12 tháng gần nhất).
  - Line chart: User mới theo tháng (12 tháng gần nhất).
  - Pie chart: Phân bố đơn đăng ký (Approved/Rejected/Pending).
- **Phân quyền:** Admin và Manager đều thấy dữ liệu toàn hệ thống. Manager là role hệ thống, không gắn với tổ chức cụ thể — dashboard hiển thị giống Admin.
- **Read-only:** Dashboard chỉ đọc dữ liệu. Không có thao tác write.
- **Cache:** Dữ liệu dashboard được cache 5 phút (Redis). User có thể force refresh.

## 3. STAKEHOLDERS

- **Admin:** Cần dashboard tổng quan toàn hệ thống để ra quyết định chiến lược.
- **Manager:** Cần dashboard tổng quan toàn hệ thống để quản lý vận hành.

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Read-only:** Endpoint `GET /api/v1/dashboard/summary` — chỉ GET, không POST/PUT/PATCH.
- **Performance:** Aggregate queries tối ưu, dùng database aggregation. Cache TTL 5 phút.
- **Phân quyền:** Chỉ Admin và Manager. Staff → 403, Guest → 401.
- **Swagger:** Bắt buộc.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định các module Event, User, Application, Donation, Attendance đã có dữ liệu.
- Giả định Redis cache đã sẵn sàng.
- Giả định Frontend dùng thư viện chart (Chart.js/Recharts) để vẽ biểu đồ từ dữ liệu aggregate backend trả về.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Phạm vi Manager:** Manager có tổ chức không? Dashboard Manager có khác Admin không?
2. **Refresh:** Khi user nhấn Refresh, có force xóa cache không?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Manager là role hệ thống, không gắn với tổ chức cụ thể. Dashboard của Manager giống Admin — thấy toàn bộ dữ liệu hệ thống.
- **A2:** Khi user nhấn Refresh, system bỏ qua cache (gửi query param `force=true` hoặc `cache=false`) và query từ database. Kết quả được lưu cache lại.