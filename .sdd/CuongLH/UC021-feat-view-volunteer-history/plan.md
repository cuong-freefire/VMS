# Kế Hoạch Triển Khai: Xem Lịch Sử Tình Nguyện (View Volunteer History)

**Branch**: `CuongLH` | **Ngày**: 2026-07-14 | **Spec**: [spec.md](./spec.md)

**Đầu Vào**: Đặc tả tính năng từ `.sdd/CuongLH/UC021-feat-view-volunteer-history/spec.md`

**Lưu Ý**: Command `/speckit-plan` bị chặn do branch `CuongLH` không khớp convention `NNN-feature-name`. Kế hoạch được tạo manual theo `.specify/templates/plan-template.md`.

---

## 1. Tổng Quan (Summary)

Triển khai UC21 - View Volunteer History (Xem Lịch Sử Tình Nguyện): cho phép Volunteer xem toàn bộ lịch sử tham gia sự kiện với tất cả trạng thái (Pending, Approved, Attended, Rejected, Cancelled), kèm bảng tóm tắt số liệu tích lũy (tổng giờ, tổng sự kiện, số sự kiện hoàn thành), phân trang (pagination) offset-based 10 bản ghi/trang, và bộ lọc (filter) theo trạng thái + năm tham gia.

**Hướng Tiếp Cận Kỹ Thuật (Technical Approach)**:

- Pattern **"Derived View"** từ DATABASE.md Section 10: Member 1 query (truy vấn) trực tiếp qua Prisma, join (kết nối) các bảng applications, events, organizations, attendances, certificates để aggregate (tổng hợp) dữ liệu lịch sử.
- Backend: thêm `GET /api/v1/user/me/history` trong `user.routes.js` với authMiddleware (middleware xác thực).
- Frontend: mở rộng `VolunteerHistoryPage.jsx` từ placeholder thành trang đầy đủ với Summary Card (bảng tóm tắt), History List (danh sách), Pagination (phân trang), Filters (bộ lọc).
- Read-only (chỉ đọc) — không tạo bảng mới, không mutate (sửa đổi) dữ liệu.
- Kiến trúc phân tầng: **Controller → Service → Repository**.

---

## 2. Bối Cảnh Kỹ Thuật (Technical Context)

**Ngôn Ngữ / Phiên Bản**: Node.js 18+ + JavaScript (ESM), React 19 + JSX

**Các Thư Viện Chính (Primary Dependencies)**:

| Thư Viện | Vai Trò | Trạng Thái |
|----------|--------|------------|
| Express 5.x | REST API framework (khung làm việc API) | Đã có |
| Prisma ORM | Database access (truy cập CSDL) | Đã có |
| MySQL | Database (cơ sở dữ liệu) | Đã có |
| Zod | Input validation (xác thực đầu vào) | Đã có |
| JWT HttpOnly Cookie | Authentication (xác thực) | Đã có |
| Axios | HTTP client (gọi API) | Đã có |
| Bootstrap 5 + CSS | UI framework (giao diện) | Đã có |
| Pino | Logging (ghi log) | Đã có |

**Lưu Trữ (Storage)**: MySQL — các bảng (tất cả read-only):

| Bảng | Chủ Sở Hữu | Vai Trò Trong UC21 |
|------|-----------|-------------------|
| `applications` | Member 3 (TienTD) | Nguồn chính — đơn đăng ký sự kiện |
| `events` | Member 3 (TienTD) | Join lấy title (tiêu đề), start_date |

**Pattern**: Derived View — KHÔNG tạo bảng mới. Schema V3.0 chỉ join 2 bảng.

**Kiểm Thử (Testing)**: Jest + Supertest (backend), Jest + React Testing Library (frontend)

**Nền Tảng (Target Platform)**: Web application, desktop first. Backend port 5000, Frontend port 3000.

**Loại Dự Án (Project Type)**: Web application — Option 2 trong template.

**Mục Tiêu Hiệu Năng (Performance Goals)**:

- API < 2s với 10 bản ghi (SC-001)
- API < 3s với 100+ bản ghi qua pagination (SC-003)

**Ràng Buộc (Constraints)**:

- **PHẢI** lấy userId từ JWT, KHÔNG từ request body (Lesson 3 — chống IDOR)
- **PHẢI** dùng `response.util.js` theo ADR-006
- **PHẢI** read-only
- **PHẢI** phân trang bắt buộc
- **KHÔNG** tạo logic PDF chứng nhận (Member 2 — UC51/52)

**Quy Mô (Scale/Scope)**: 1 endpoint, 4 file backend, 1 trang frontend. ~300 dòng BE, ~400 dòng FE.

---

## 3. Kiểm Tra Hiến Pháp (Constitution Check)

*CỔNG: Phải vượt qua trước Phase 0. Kiểm tra lại sau Phase 1.*

### Tuân Thủ Kiến Trúc

| Hạng Mục | Trạng Thái | Căn Cứ |
|----------|-----------|--------|
| Phân tầng Controller → Service → Repository | ✅ Đạt | AGENTS.md §6 |
| Module ownership: Member 1 (CuongLH) | ✅ Đạt | CLAUDE.md §1 |
| Cross-module: Derived View, không import Repo Member 3 | ✅ Đạt | DATABASE.md §10 |
| Response format: `response.util.js` | ✅ Đạt | ADR-006 |
| Auth: JWT HttpOnly Cookie | ✅ Đạt | ADR-002 |
| DB access: Prisma ORM | ✅ Đạt | ADR-001 |
| Validation: Zod cho query params | ✅ Đạt | ADR-003 |

### Tuân Thủ Bảo Mật

| Hạng Mục | Trạng Thái | Căn Cứ |
|----------|-----------|--------|
| userId từ JWT, không từ body | ✅ Đạt | Lesson 3 |
| Không hard-delete (read-only) | ✅ Đạt | ADR-005 |
| Không lộ dữ liệu nhạy cảm | ✅ Đạt | DATABASE.md §12 |

### Tuân Thủ Chất Lượng Code

| Hạng Mục | Trạng Thái | Căn Cứ |
|----------|-----------|--------|
| Max hàm 40 dòng | ✅ Đạt | AGENTS.md §7 |
| Max file 300 dòng | ✅ Đạt | AGENTS.md §7 |
| Test coverage ≥ 80% Service | ⚠️ Target | AGENTS.md §7 |

**Kết Luận**: ✅ GATE PASSED. Không vi phạm constitution.

---

## 4. Cấu Trúc Dự Án (Project Structure)

### Tài Liệu

```text
.sdd/CuongLH/UC021-feat-view-volunteer-history/
├── spec.md, context.md         # ĐÃ CÓ
├── plan.md                     # File này
├── research.md                 # SẼ TẠO (Phase 0)
├── data-model.md               # SẼ TẠO (Phase 1)
├── quickstart.md               # SẼ TẠO (Phase 1)
├── contracts/                  # SẼ TẠO (Phase 1)
│   ├── api-contract.md
│   └── service-contract.md
├── checklists/requirements.md  # ĐÃ CÓ — PASSED
└── tasks.md                    # SẼ TẠO (/speckit-tasks)
```

### Mã Nguồn

```text
backend/
├── prisma/schema.prisma                    # KHÔNG ĐỔI
├── src/
│   ├── routes/user.routes.js               # THÊM: GET /me/history + Swagger
│   ├── controllers/profile.controller.js   # THÊM: getMyHistory()
│   ├── services/profile.service.js         # THÊM: getVolunteerHistory()
│   ├── repositories/profile.repository.js  # THÊM: findVolunteerHistory, count, summary, findCerts
│   └── middlewares/validators/profile.validator.js  # THÊM: volunteerHistoryQuerySchema
└── tests/
    ├── unit/ (profile.service.test.js, profile.validator.test.js)  # THÊM
    └── integration/volunteer-history.test.js  # TẠO MỚI

frontend/
├── src/
│   ├── App.js                    # ĐÃ CÓ route /history → VolunteerHistoryPage
│   ├── services/user.service.js  # THÊM: getVolunteerHistory()
│   ├── hooks/useVolunteerHistory.js   # TẠO MỚI
│   ├── components/pages/profile/VolunteerHistoryPage.jsx  # SỬA
│   └── components/ui/            # DÙNG LẠI: Card, EmptyState, ErrorState, Button, Skeleton
└── tests/components/VolunteerHistoryPage.test.jsx  # TẠO MỚI
```

**Quyết Định**: Web Application (Option 2). Mở rộng module profile. Dùng lại UI components.

---

## 5. Theo Dõi Độ Phức Tạp (Complexity Tracking)

> Chỉ điền nếu Constitution Check có vi phạm.

| Vi Phạm | Lý Do | Phương Án Đơn Giản Hơn Bị Từ Chối |
|----------|--------|----------------------------------|
| Không có | — | — |

---

## 6. Các Giai Đoạn Triển Khai (Implementation Phases)

### Phase 0: Nghiên Cứu & Xác Minh — CHỈ ĐỌC

**Mục Tiêu**: Khảo sát codebase, xác minh Prisma, auth, dữ liệu.

**Tác Vụ**:

1. Verify Prisma schema relations (đã có User→Application, Application→Event, Application→Event)
2. Verify Prisma pagination: `skip` + `take` + `count()` + `aggregate()`
3. Verify auth middleware: `req.user.user_id` từ JWT
4. Kiểm tra dữ liệu applications (cần seed?)
5. Verify frontend route `/history` (đã có, VOLUNTEER only)

**Đầu Ra**: `research.md`

---

### Phase 1: Thiết Kế & Hợp Đồng — CHỈ ĐỌC

**Mục Tiêu**: Thiết kế data model, API contract, service interface.

**1.1 Data Model** — Status Mapping (Derived):

| Hiển Thị | Điều Kiện DB | Ý Nghĩa |
|----------|-------------|---------|
| PENDING | app.status = PENDING | Chờ duyệt |
| APPROVED | app.status = APPROVED | Đã duyệt |`n| REJECTED | app.status = REJECTED | Bị từ chối |
| CANCELLED | app.status = CANCELLED | Đã hủy |

**1.2 API Contract** — `GET /api/v1/user/me/history`

| Param | Kiểu | Mặc Định | Mô Tả |
|-------|------|---------|-------|
| page | int ≥ 1 | 1 | Số trang |
| limit | int 1-50 | 10 | Bản ghi/trang |
| status | enum | — | PENDING/APPROVED/REJECTED/CANCELLED |
| year | string | — | Năm (regex YYYY, lọc manual JS) |
| search | string | — | Tìm kiếm client-side (tên/địa điểm) |

Response codes: 200, 400, 401, 403, 404, 500.

**1.3 Service Contract**:

```javascript
// profile.service.js
/**
 * @param {number} userId — từ JWT
 * @param {{status?, year?}} filters
 * @param {{page, limit}} pagination
 * @returns {Promise<{summary, history[], pagination}>}
 * @throws ServiceError 404/403
 */
export const getVolunteerHistory = async (userId, filters, pagination) => { ... }
```

**1.4 Quick Start** — Cách seed data, curl test, chạy tests.

**Đầu Ra**: `data-model.md`, `contracts/api-contract.md`, `contracts/service-contract.md`, `quickstart.md`

---

### Phase 2: Lập Kế Hoạch Triển Khai — SẴN SÀNG PHÊ DUYỆT

**Ghi Chú**: Chạy `/speckit-tasks` sau khi approve.

**Nhóm Tác Vụ Dự Kiến**:

| # | Tầng | File(s) | Phụ Thuộc |
|---|------|---------|-----------|
| T1 | Repository | profile.repository.js: findVolunteerHistory, count, summary, findCerts | — |
| T2 | Validator | profile.validator.js: volunteerHistoryQuerySchema | — |
| T3 | Service | profile.service.js: getVolunteerHistory + status map | T1 |
| T4 | Controller | profile.controller.js: getMyHistory | T3 |
| T5 | Route+Swagger | user.routes.js: GET /me/history + JSDoc | T2,T4 |
| T6 | BE Tests | Unit (service,validator) + Integration | T5 |
| T7 | FE Service | user.service.js: getVolunteerHistory() | T5 |
| T8 | FE Hook | useVolunteerHistory.js (TẠO MỚI) | T7 |
| T9 | FE Page | VolunteerHistoryPage.jsx (SỬA) | T8 |
| T10 | FE Tests | Component tests | T9 |
| T11 | Seed Data | Script tạo dữ liệu mẫu | — |

**Chuỗi Phụ Thuộc**:

```
T1 ─┬─→ T3 → T4 ─┬─→ T5 → T6
T2 ─┘              └─→ T7 → T8 → T9 → T10
T11 (độc lập)
```

---

## 7. Đánh Giá Rủi Ro (Risk Assessment)

| Rủi Ro | Tác Động | Xác Suất | Biện Pháp |
|--------|---------|---------|----------|
| **Cross-Module Data** — Đọc bảng Member 3, schema đổi → hiển thị sai | CAO | Trung Bình | Derived View, read-only, document dependency |
| **Data Volume** — 100+ applications, query chậm | Trung Bình | Trung Bình | Pagination 10/page, Prisma select, index có sẵn |
| **Status Mapping** — Derived từ 2 bảng | Thấp | Thấp | Unit test mọi tổ hợp |

### Rủi Ro Thấp

- **Empty State**: Volunteer mới → EmptyState + CTA event list
- **- **Year Filter**: Year regex YYYY, lọc manual trong JS

---

## 8. Tiêu Chí Thành Công (Success Criteria Review)

| SC | Tiêu Chí | Kiểm Chứng |
|----|---------|-----------|
| SC-001 | < 2s load 10 records | Performance test |
| SC-002 | 100% chính xác summary | Unit test + Integration test |
| SC-003 | < 3s với 100+ records | Pagination test |
| SC-004 | Tìm < 30s với filter | Integration test |
| SC-005 | 100% bảo mật (IDOR) | Auth integration test |
| SC-006 | 100% edge cases | Edge case tests |

---

## 9. Triển Khai (Deployment Checklist)

- [ ] Unit tests pass (>80% coverage)
- [ ] Integration tests pass
- [ ] Swagger JSDoc đầy đủ
- [ ] API tuân thủ ADR-006
- [ ] Không linting errors
- [ ] Security: không xem được history user khác
- [ ] Pagination + Filters hoạt động đúng
- [ ] Empty state + edge cases
- [ ] Seed data sẵn sàng
- [ ] Cập nhật share_context.md

---

## 10. Các Bước Tiếp Theo (Next Steps)

1. Phê duyệt plan → Phase 0
2. Phase 0: Nghiên cứu (verify codebase)
3. Phase 1: Thiết kế (data-model, contracts, quickstart)
4. Chạy `/speckit-tasks` → tasks.md
5. Phase 2: Triển khai theo tasks.md
6. Test & Verify

---

## 11. Câu Hỏi Cho Stakeholder (Questions)

### 1. Query Pattern

DATABASE.md §10 dùng query Prisma trực tiếp. Cần gọi Service Member 3 không?

- **(A) Query trực tiếp Prisma** (khuyến nghị) — đúng pattern, read-only, không block
- **(B) Đợi Member 3 implement Service**

### 2. Endpoint Path

`/api/v1/user/me/history` hay `/api/v1/volunteer/history`?

- **(A) /me/history** — nhất quán pattern hiện tại

### 3. Summary Card UI

Card.jsx có sẵn hay component mới?

- **(A) Card.jsx** (khuyến nghị) — dùng lại component

---

## 12. Ước Lượng (Estimated Effort)

**Tổng**: 14–20 giờ

| Giai Đoạn | Thời Gian |
|-----------|----------|
| Phase 0: Nghiên cứu | 1–2h |
| Phase 1: Thiết kế | 2–3h |
| Backend (Repo+Val+Service+Ctrl+Route) | 3–4h |
| Backend Tests | 2–3h |
| Frontend (Service+Hook+Page) | 3–4h |
| Frontend Tests | 1–2h |
| Review | 1–2h |

---

## 13. Mức Ưu Tiên (Priority)

**P1 — Tính Năng Cốt Lõi**. Spec có 2 P1 user stories. Hiển thị thành tích, tạo động lực. Read-only, ít rủi ro.

---

**Trạng Thái**: ACCEPTED
**Người Phụ Trách**: Member 1 — CuongLH
**Module**: Profile Management
