# CONTEXT.md — Search Skill

# Người viết: DucNM (Member 5) | Ngày: 2026-06-30

## 1. PROBLEM STATEMENT

Khi danh sách kỹ năng trong hệ thống VMS trở nên lớn, Manager cần có khả năng tìm kiếm nhanh kỹ năng theo tên hoặc mô tả. Nếu không có chức năng tìm kiếm, Manager phải cuộn thủ công qua nhiều trang để tìm đúng kỹ năng, gây mất thời gian và hiệu quả thấp.

## 2. DOMAIN KNOWLEDGE

- **Search scope:** Tìm kiếm theo tên (name) và mô tả (description) của kỹ năng.
- **Case-insensitive:** Tìm kiếm không phân biệt chữ hoa/chữ thường.
- **Partial match:** Tìm kiếm theo từ khóa một phần (ví dụ: "Eng" sẽ tìm được "English", "Engineering").
- **Phân quyền:** Manager có quyền search trên tất cả skill (active + inactive). Volunteer/Staff chỉ search được trên skill active (phục vụ UC20 Edit Volunteer Skills).

## 3. STAKEHOLDERS

- **Manager:** Cần tìm kiếm nhanh kỹ năng để quản lý.
- **Volunteer:** Cần tìm kiếm skill active để gán cho profile (UC20).

## 4. CONSTRAINTS (Ràng buộc cứng)

- **Phân quyền theo role:** Manager thấy tất cả; Volunteer/Staff chỉ thấy active.
- **API format:** Endpoint là `GET /api/v1/skills?search=keyword` — gộp chung với UC34.
- **Swagger:** Bắt buộc có Swagger JSDoc đầy đủ.

## 5. ASSUMPTIONS (Các giả định hiện tại)

- Giả định search được implement dưới dạng query param `search` trên endpoint GET /api/v1/skills.
- Giả định search sử dụng SQL LIKE, không cần FULLTEXT index ở v1 do số lượng skill ít.

## 6. OPEN QUESTIONS (Cần chốt trước khi viết SPEC.md)

1. **Search độc lập:** Search Skill có nên là endpoint riêng không?
2. **Search field:** Chỉ search theo name, hay thêm description?

## 7. ANSWERS (Đã chốt nghiệp vụ)

- **A1:** Search là một phần của UC34 (GET /api/v1/skills) thông qua query param `search`. Không cần endpoint riêng.
- **A2:** Search theo name và description.