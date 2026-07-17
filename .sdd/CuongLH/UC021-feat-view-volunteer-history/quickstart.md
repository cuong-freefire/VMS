# Hướng Dẫn Nhanh: Xem Lịch Sử Tình Nguyện (UC21)

---

## 1. Yêu Cầu

- Node.js 18+
- MySQL 8+ đang chạy
- Backend + Frontend đã setup (xem README gốc)

---

## 2. Seed Dữ Liệu Mẫu

```sql
-- Chạy trong MySQL console hoặc Prisma Studio
-- Giả sử có user_id = 10 (VOLUNTEER), event_id = 1, 2, 3
INSERT INTO applications (user_id, event_id, status, created_at)
VALUES (10, 1, 'APPROVED', NOW()),
       (10, 2, 'PENDING', NOW()),
       (10, 3, 'REJECTED', NOW()),
       (10, 1, 'CANCELLED', NOW());
```

---

## 3. Chạy Backend

```bash
cd backend
npm start
# Server chạy tại http://localhost:5000
```

---

## 4. Test API Bằng curl

### Lấy lịch sử (mặc định)

```bash
curl -b "token=PASTE_JWT_TOKEN_HERE" "http://localhost:5000/api/v1/user/me/history"
```

### Lấy lịch sử với filter

```bash
# Lọc trạng thái
curl -b "token=..." "http://localhost:5000/api/v1/user/me/history?status=APPROVED"

# Lọc năm 2025
curl -b "token=..." "http://localhost:5000/api/v1/user/me/history?year=2025"

# Tìm kiếm theo tên
curl -b "token=..." "http://localhost:5000/api/v1/user/me/history?search=Dọn"

# Phân trang: trang 2, 5 bản ghi/trang
curl -b "token=..." "http://localhost:5000/api/v1/user/me/history?page=2&limit=5"
```

---

## 5. Chạy Tests

```bash
# Backend unit tests (nếu có)
cd backend
npx jest tests/unit/

# Backend integration tests (nếu có)
npx jest tests/integration/

# Frontend tests
cd frontend
npx jest tests/components/VolunteerHistoryPage.test.jsx
```

---

## 6. Tích Hợp Frontend

```javascript
// frontend/src/services/user.service.js
export const userService = {
  // ... existing methods ...
  async getVolunteerHistory(params = {}) {
    return axiosApi.get('/api/v1/user/me/history', { params });
  },
};
```

```jsx
// Sử dụng trong component
import { useState, useEffect } from 'react';
import { userService } from '../../services/user.service';

function VolunteerHistoryPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    userService.getVolunteerHistory({ page: 1, limit: 10 })
      .then(res => setData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Render Summary + History List + Pagination + Filters
}
```

---

## 7. Troubleshooting

| Vấn Đề | Giải Pháp |
|--------|----------|
| `401 UNAUTHORIZED` | Kiểm tra JWT token còn hạn, cookie `token` được gửi kèm |
| `403 ACCOUNT_DISABLED` | User `is_active = false` — cần admin kích hoạt lại |
| `404 USER_NOT_FOUND` | User ID trong JWT không khớp DB |
| `400 VALIDATION_ERROR` | Kiểm tra query params (page ≥ 1, limit 1-50, status đúng enum) |
| Không có dữ liệu | Chạy seed script (Section 2) hoặc ứng dụng chưa có hoạt động |
