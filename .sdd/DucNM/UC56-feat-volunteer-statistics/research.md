# Research: Volunteer Statistics (UC56)

**Phase**: 0 — Research & Resolve Unknowns

**Date**: 2026-07-08

---

## 1. Volunteer Statistics Data Sources

- **Decision**: Dữ liệu từ 4 bảng: User (volunteers), Attendance, Application, Event.
- **Rationale**:
  - `new_volunteers_by_month`: User.created_at với role = VOLUNTEER, group theo tháng.
  - `total_active_volunteers`: User.count với role = VOLUNTEER và is_active = true.
  - `participation_rate`: Số user có attendance / tổng active volunteers.
  - `top_5_volunteers_by_events`: Attendance.groupBy user_id, count, top 5.

## 2. Participation Rate Calculation

- **Decision**: `participation_rate = (volunteers_with_attendance / total_active_volunteers) × 100`.
- **Rationale**: Spec A1 — tính dựa trên attendance check-in.
- **Pattern**: Query distinct user_id từ Attendance table, count, chia cho total active volunteers.
- **Manager scope**: Chỉ đếm attendance của events thuộc org Manager.

## 3. Top 5 Volunteers by Events

- **Decision**: Dựa trên số attendance records (điểm danh thành công) — spec A2.
- **Pattern**: Attendance.groupBy user_id, _count, orderBy desc, take 5. Join với User để lấy full_name.
- **Manager scope**: Chỉ count attendance của events thuộc org Manager.

## 4. New Volunteers by Month

- **Decision**: Query User.created_at với role = VOLUNTEER trong năm, aggregate theo tháng.
- **Pattern**: Giống aggregateByMonth helper từ UC54.

## 5. Manager Organization Filter

- **Decision**: Khi user là Manager, filter attendance/application qua Event.organization_id.
- **Rationale**: Manager chỉ thấy volunteer đã tham gia sự kiện thuộc tổ chức mình.
- **Pattern**: `where: { event: { organization_id: currentUser.organization_id } }` cho Attendance queries.

## 6. Redis Cache

- **Decision**: Dùng Redis cache TTL 5 phút (kế thừa UC54). Cache key = `volunteer-stats:{year}:{orgId}`.

## 7. Zod Schema

- **Decision**: Validate year param (optional, positive integer, default current year).
- **Pattern**:
  ```js
  export const volunteerStatsQuerySchema = z.object({
    year: z.coerce.number().int().positive().optional()
  });
  ```

## Tổng hợp quyết định

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| Data sources | User, Attendance, Application, Event | Spec metrics |
| Participation rate | Attendance-based | Spec A1 |
| Top volunteer | Attendance count | Spec A2 |
| New volunteer | User.created_at by month | Spec FR-002 |
| Org filter | Through Event.organization_id | Manager scope |
| Cache | Redis TTL 5 phút (kế thừa UC54) | Spec FR-005 |
| Zod schema | year optional | Spec FR-001 |