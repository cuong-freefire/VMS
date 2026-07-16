# Thiết Kế Dữ Liệu: Xem Lịch Sử Tình Nguyện (UC21)

**Phase**: 1 — Design | **Schema**: V3.0 Reduced | **Ngày**: 2026-07-16

---

## 1. Nguồn Dữ Liệu (Data Sources)

UC21 là **Derived View** — không tạo bảng mới. Schema V3.0 chỉ join 2 bảng:

| Bảng | Chủ Sở Hữu | Cách Dùng | Query Pattern |
|------|-----------|----------|--------------|
| `applications` | Member 3 | Nguồn chính | `findMany({ where: { userId }, include: { event } })` |
| `events` | Member 3 | Join qua application | `include: { event: { select: { id, title, startDate, endDate, location, status } } }` |

**Chưa join** (Schema V3.0):
- `organizations` — chưa join (sẽ bổ sung sau)
- `attendances` — chưa join (sẽ bổ sung sau)
- `certificates` — chưa join (sẽ bổ sung sau)

---

## 2. Status Mapping (Ánh Xạ Trạng Thái)

Status dùng trực tiếp `applications.status` (raw), không derived:

| Display Status | Nguồn | Ý Nghĩa |
|---------------|-------|---------|
| `PENDING` | `applications.status = 'PENDING'` | Chờ duyệt |
| `APPROVED` | `applications.status = 'APPROVED'` | Đã duyệt |
| `REJECTED` | `applications.status = 'REJECTED'` | Bị từ chối |
| `CANCELLED` | `applications.status = 'CANCELLED'` | Đã hủy |

---

## 3. Response Shape (Hình Dạng Phản Hồi)

```json
{
  "success": true,
  "message": "Lấy lịch sử tình nguyện thành công",
  "data": {
    "summary": {
      "total": 5
    },
    "history": [
      {
        "id": 1,
        "status": "APPROVED",
        "applied_at": "2025-06-15T08:00:00.000Z",
        "event": {
          "id": 10,
          "title": "Dọn rác bãi biển",
          "start_date": "2025-07-01T08:00:00.000Z",
          "location": "Bãi biển Đà Nẵng"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "total_pages": 3
    }
  }
}
```

---

## 4. Query Logic

### 4.1 Query Chính — Lịch Sử

```javascript
// profile.repository.js — findVolunteerHistory(userId, filters)
const where = { userId };
if (filters.status) where.status = filters.status;

return prisma.application.findMany({
  where: { ...where },
  include: {
    event: {
      select: { id: true, title: true, startDate: true, endDate: true, location: true, status: true },
    },
  },
  orderBy: { createdAt: "desc" },
  skip,
  take,
});
```

Year filter thực hiện bằng JavaScript sau query (manual filter theo `new Date(event.startDate).getFullYear()`).

Search thực hiện client-side: filter theo `event.title` và `event.location` (case-insensitive).

### 4.2 Query Phụ — Tổng Số Bản Ghi

```javascript
// profile.repository.js — countHistoryApplications(userId, filters)
return prisma.application.count({ where: { userId, status: filters.status } });
```

### 4.3 Query Phụ — Summary

```javascript
// Dùng countHistoryApplications(userId, {}) để đếm tổng số đơn
// Service: summary = { total: summaryTotal }
```

---

## 5. Null Handling (Xử Lý Giá Trị Rỗng)

| Trường | Khi Nào Null | Giá Trị Trả Về |
|--------|-------------|---------------|
| `event` | Event bị xóa hoặc không join được | `null` (frontend hiển thị "N/A") |
| `event.title` | Event null | Frontend hiển thị "—" (dash) |
| `event.location` | Event null hoặc không có location | Frontend hiển thị "—" (dash) |
| `event.start_date` | Event null | Frontend hiển thị "—" (dash) |
