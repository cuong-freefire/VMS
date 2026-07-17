# Hợp Đồng Service: Xem Lịch Sử Tình Nguyện (UC21)

---

## 1. Service Interface

### `getVolunteerHistory(userId, filters)`

**File**: `backend/src/services/profile.service.js`

```javascript
/**
 * Lấy lịch sử đăng ký của volunteer (Derived View Pattern, Schema V3.0).
 *
 * Flow:
 * 1. Xác minh user tồn tại + is_active = true (findUserWithSkills)
 * 2. Query danh sách applications (phân trang + lọc status)
 * 3. Đếm tổng bản ghi (pagination)
 * 4. Đếm tổng tất cả đơn (summary)
 * 5. Map sang response shape: id, status, applied_at, event: { id, title, start_date, location }
 *
 * @param {number} userId — Trích xuất từ JWT (req.user.user_id)
 * @param {Object} filters — { status?, year?, search?, page?, limit? }
 * @returns {Promise<{summary: {total}, history: Array, pagination: Object}>}
 *
 * @throws {ServiceError} 404 — User không tồn tại (USER_NOT_FOUND)
 * @throws {ServiceError} 403 — Tài khoản bị vô hiệu hóa (ACCOUNT_DISABLED)
 * @throws {ServiceError} 500 — Lỗi không mong đợi (INTERNAL_SERVER_ERROR)
 */
export const getVolunteerHistory = async (userId, filters) => { ... }
```

---

## 2. Internal Helpers

Không có helper đặc biệt. Status dùng trực tiếp `app.status` (raw). History item format inline trong `.map()`.

---

## 3. Repository Dependencies

| Repository Function | File | Mô Tả |
|-------------------|------|-------|
| `findUserWithSkills(userId)` | `profile.repository.js` | Kiểm tra user tồn tại + is_active (có sẵn từ UC18) |
| `findVolunteerHistory(userId, filters)` | `profile.repository.js` | Query chính — danh sách applications + event |
| `countHistoryApplications(userId, filters)` | `profile.repository.js` | Đếm tổng bản ghi cho pagination |

---

## 4. Error Contract

| Mã Lỗi | HTTP Status | Điều Kiện |
|--------|------------|----------|
| `USER_NOT_FOUND` | 404 | `findUserWithSkills(userId)` trả về null |
| `ACCOUNT_DISABLED` | 403 | `user.isActive === false` |
| `INTERNAL_SERVER_ERROR` | 500 | Lỗi không mong đợi (DB fail, ...) |
