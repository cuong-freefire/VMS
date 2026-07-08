# Research: Event Statistics (UC55)

**Phase**: 0 — Research & Resolve Unknowns

**Date**: 2026-07-08

---

## 1. Event Statistics Data Sources

- **Decision**: Dữ liệu từ 2 bảng: Event (events_by_month, completion_rate) và Application (top_5_events).
- **Rationale**:
  - Spec FR-003 yêu cầu events_by_month, completion_rate, top_5_events.
  - `events_by_month`: từ Event.created_at, group theo tháng.
  - `completion_rate`: Event.count({ where: status: 'COMPLETED' }) / Event.count().
  - `top_5_events`: Application.groupBy event_id với status = 'APPROVED', count, lấy top 5.

## 2. Time Range Filter

- **Decision**: Hỗ trợ 2 modes:
  - `year` param (VD: `?year=2026`) — thống kê 12 tháng của năm đó.
  - `start_date` + `end_date` (VD: `?start_date=2026-01-01&end_date=2026-06-30`) — thống kê theo khoảng.
  - Mặc định: năm hiện tại.
- **Rationale**: Spec FR-002 yêu cầu cả 2 modes.
- **Validation**: Nếu `start_date > end_date` → HTTP 400.

## 3. Role-Based Filter: Admin vs Manager

- **Decision**: 
  - Admin: không filter theo organization_id — thấy tất cả events.
  - Manager: filter `where: { organization_id: currentUser.organization_id }` — chỉ thấy events thuộc tổ chức của mình.
- **Rationale**: Spec FR-005 yêu cầu Manager chỉ thấy dữ liệu tổ chức mình.

## 4. Top 5 Events Query

- **Decision**: Dùng Prisma `groupBy` trên Application với `event_id`, `_count`, filter `status: 'APPROVED'`, order by count desc, take 5.
- **Rationale**: Spec A1: tính theo application Approved.
- **Pattern**: Kết hợp với Event.title để hiển thị tên sự kiện.

## 5. Completion Rate

- **Decision**: Tính bằng Prisma count: `completed / total * 100`.
- **Pattern**:
  ```js
  const total = await prisma.event.count({ where });
  const completed = await prisma.event.count({ where: { ...where, status: 'COMPLETED' } });
  return total > 0 ? Math.round((completed / total) * 100 * 10) / 10 : 0;
  ```

## 6. Events By Month

- **Decision**: Query events trong khoảng thời gian, aggregate theo tháng, fill tháng không có dữ liệu với 0.
- **Pattern**: Giống `aggregateByMonth` helper từ UC54.

## 7. Redis Cache

- **Decision**: Dùng Redis cache TTL 5 phút (tái sử dụng từ UC54). Cache key = `event-stats:{year}:{orgId}`.
- **Rationale**: Tái sử dụng Redis infrastructure từ UC54.

## 8. Zod Schema

- **Decision**: Validate query params: year (number, optional), start_date (date format), end_date (date format). Nếu có start_date thì phải có end_date và ngược lại.
- **Pattern**:
  ```js
  export const eventStatsQuerySchema = z.object({
    year: z.coerce.number().int().positive().optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
  }).refine(data => {
    if (data.start_date && data.end_date) {
      return new Date(data.start_date) <= new Date(data.end_date);
    }
    return true;
  }, { message: 'start_date must be before or equal to end_date' });
  ```

## Tổng hợp quyết định

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| Data sources | Event + Application | Spec FR-003 |
| Time filter | year hoặc start_date/end_date | Spec FR-002 |
| Role filter | Admin: all; Manager: org filter | Spec FR-005 |
| Top 5 | Application Approved, groupBy event_id, top 5 | Spec A1 |
| Completion rate | Completed / Total * 100 | Spec FR-003 |
| Cache | Redis TTL 5 phút (tái sử dụng UC54) | Kế thừa |
| Zod schema | year hoặc date range + date validation | Spec |