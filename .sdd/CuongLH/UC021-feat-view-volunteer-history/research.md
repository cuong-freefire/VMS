# Nghiên Cứu Kỹ Thuật: Xem Lịch Sử Tình Nguyện (UC21)

**Phase**: 0 — Research & Verification | **Ngày**: 2026-07-14

---

## 1. Xác Minh Prisma Schema Relations

**Mục Tiêu**: Kiểm tra `backend/prisma/schema.prisma` có đủ relations (quan hệ) cho query lịch sử.

**Kết Quả**:

| Relation | Schema | Trạng Thái |
|----------|--------|-----------|
| User → Application (1-n) | `User.applicationsSubmitted` → `Application` | ✅ Đã có |
| Application → Event (n-1) | `Application.event` → `Event` | ✅ Đã có |
| Event → Organization (n-1) | `Event.organization` → `Organization` | ✅ Đã có |
| Application → Attendance (1-1) | `Application.attendance` → `Attendance` | ✅ Đã có |
| Certificate (userId, eventId) | `Certificate.@@unique([userId, eventId])` | ✅ Đã có |

**Kết Luận**: Schema hỗ trợ đầy đủ query join 4 bảng cho Derived View pattern.

---

## 2. Xác Minh Prisma Pagination API

**Mục Tiêu**: Xác nhận Prisma hỗ trợ offset-based pagination (phân trang).

**Kết Quả**:

- `skip` + `take`: Hỗ trợ offset pagination ✅
- `count()`: Đếm tổng bản ghi ✅
- `aggregate()` với `_sum`: Tính tổng volunteer_hours ✅
- Transaction không cần (read-only) ✅

**Kết Luận**: Prisma đáp ứng đầy đủ yêu cầu pagination của UC21.

---

## 3. Xác Minh Auth Middleware

**Mục Tiêu**: Xác nhận `req.user` chứa `user_id` từ JWT.

**File**: `backend/src/middlewares/auth.middleware.js`

**Kết Quả**:

- `req.user` được set bởi `verifyAccessToken(token)` → chứa `{ user_id, email, jti, role, ... }`
- Middleware từ chối request không có token → HTTP 401 với code `UNAUTHORIZED`
- Middleware kiểm tra session (jti) và trạng thái user (is_active, email_verified)

**Kết Luận**: Auth middleware đã hoạt động đầy đủ. UC21 chỉ cần thêm `authMiddleware` cho route `/me/history`.

---

## 4. Xác Minh Dữ Liệu Có Sẵn

**Mục Tiêu**: Kiểm tra dữ liệu test trong các bảng.

**Kết Quả**:

- `applications`: Cần seed dữ liệu mẫu (chưa có dữ liệu thực tế cho development)
- `attendances`: Cần seed (phụ thuộc applications)
- `certificates`: Cần seed (phụ thuộc applications + attendances)

**Kết Luận**: Cần tạo seed script trong Phase 2 (Task T028 trong tasks.md).

---

## 5. Xác Minh Frontend Route

**Mục Tiêu**: Kiểm tra route `/history` trong App.js.

**File**: `frontend/src/App.js`

**Kết Quả**:

```jsx
<Route element={<ProtectedRoute />}>
  <Route element={<RoleRoute allowedRoles={[ROLES.VOLUNTEER]} />}>
    <Route path="/history" element={<VolunteerHistoryPage />} />
  </Route>
</Route>
```

- Route `/history` → `VolunteerHistoryPage` đã có
- Bảo vệ bởi `ProtectedRoute` (yêu cầu đăng nhập) + `RoleRoute` (chỉ VOLUNTEER)

**Kết Luận**: Frontend route đã sẵn sàng. Chỉ cần sửa `VolunteerHistoryPage.jsx` từ placeholder thành trang đầy đủ.

---

## 6. Quyết Định Kiến Trúc

| Quyết Định | Lựa Chọn | Lý Do |
|-----------|---------|-------|
| Pattern truy vấn | Derived View (Prisma trực tiếp) | DATABASE.md §10, read-only, không block bởi Member 3 |
| Endpoint path | `/api/v1/user/me/history` | Nhất quán pattern `/me` hiện tại, sub-resource của user |
| Phân trang | Offset-based (skip + take) | Đơn giản, Prisma hỗ trợ tốt, phù hợp v1 |
| Status hiển thị | Raw `app.status` (Schema V3.0, không derived) |
| Certificate | Enrich sau query chính (1 query phụ) | Tránh join phức tạp, certificate link bởi (userId, eventId) |
| UI components | Dùng lại Card, EmptyState, ErrorState, Button, Skeleton | Không tạo component mới, tuân thủ DRY |
