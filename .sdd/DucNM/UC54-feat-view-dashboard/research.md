# Research: View Dashboard (UC54)

**Phase**: 0 — Research & Resolve Unknowns

**Date**: 2026-07-06

---

## 1. Dashboard Data Sources

- **Decision**: Dashboard aggregate data từ 5 bảng: Event, User, Application (VolunteerApplication), Donation, Attendance.
- **Rationale**:
  - Spec FR-002 yêu cầu KPI metrics từ các entity này.
  - Dùng Prisma aggregate queries (`count`, `sum`, `avg`, `groupBy`) thay vì raw SQL.
- **KPI metrics**:
  - `total_events`: `prisma.event.count()` + `groupBy` theo status
  - `total_users`: `prisma.user.count()` + `groupBy` theo role
  - `total_applications`: `prisma.volunteerApplication.count()` + `groupBy` theo status
  - `total_donations_current_month`: `prisma.donation.aggregate({ sum: amount })` với where created_at trong tháng hiện tại
  - `avg_attendance_rate`: `prisma.attendance.count()` / `prisma.volunteerApplication.count({ where: { status: 'APPROVED' } })` * 100

## 2. Chart Data Queries

- **Decision**: Dùng Prisma `groupBy` với `created_at` để nhóm theo tháng.
- **Rationale**:
  - `events_by_month` (12 tháng): `groupBy` event theo tháng, count mỗi tháng.
  - `new_users_by_month` (12 tháng): `groupBy` user theo tháng, count mỗi tháng.
  - `application_distribution`: `groupBy` application theo status, count mỗi status.
- **Pattern**: Query 12 tháng gần nhất, fill tháng không có dữ liệu với 0.

## 3. Redis Cache

- **Decision**: Dùng Redis cache với TTL 5 phút. Cache key = `dashboard:summary:{role}`.
- **Rationale**:
  - Spec FR-004: cache TTL 5 phút.
  - Query param `force=true` bỏ qua cache (FR-005).
  - Redis không khả dụng → fallback query database, ghi log warning.
- **Pattern**:
  ```js
  const cacheKey = `dashboard:summary`;
  if (query.force !== 'true') {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  }
  const data = await getDashboardData(currentUser);
  await redis.setEx(cacheKey, 300, JSON.stringify(data)); // 5 phút
  return data;
  ```

## 4. Role-Based Access: Admin & Manager

- **Decision**: Cả Admin và Manager đều thấy dữ liệu toàn hệ thống. Dùng `authorize('ADMIN', 'MANAGER')`.
- **Rationale**: Manager là role hệ thống, không gắn với tổ chức.

## 5. Response Format

- **Decision**: Trả về KPI metrics + chart data trong `data` field theo chuẩn ADR-006.
- **Pattern**:
  ```json
  {
    "success": true,
    "data": {
      "kpi": { "total_events": {...}, "total_users": {...}, ... },
      "charts": { "events_by_month": [...], "new_users_by_month": [...], "application_distribution": [...] }
    }
  }
  ```

## Tổng hợp quyết định

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| Data sources | 5 bảng: Event, User, Application, Donation, Attendance | Spec FR-002 |
| Queries | Prisma aggregate + groupBy | Type-safe, performance |
| Cache | Redis TTL 5 phút, force=true bypass | Spec FR-004/005 |
| Cache fallback | Query DB nếu Redis unavailable | Resilience |
| Authorization | authorize('ADMIN', 'MANAGER') | Manager hệ thống |
| Response format | ADR-006 với kpi + charts | Chuẩn VMS |