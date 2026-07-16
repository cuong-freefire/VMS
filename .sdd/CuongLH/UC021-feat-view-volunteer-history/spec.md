# Feature Specification: View Volunteer History (UC21)

**Feature Branch**: `004-view-volunteer-history`

**Created**: 2026-06-28

**Status**: ACCEPTED

**Input**: User description: "UC021: View Volunteer History - Tình nguyện viên xem lịch sử tham gia sự kiện, trạng thái hồ sơ và tổng số giờ tình nguyện tích lũy"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xem Lịch Sử Tham Gia Cơ Bản (Priority: P1)

Là một tình nguyện viên, tôi muốn xem danh sách các hoạt động mà tôi đã đăng ký tham gia (bao gồm cả các đơn đã duyệt, bị từ chối, đã hủy và đã hoàn thành) để theo dõi quá trình đóng góp của mình trong hệ thống VMS.

**Why this priority**: Đây là chức năng cốt lõi của UC21, cung cấp khả năng hiển thị lịch sử tham gia - giá trị cơ bản nhất mà tính năng này phải mang lại. Không có story này thì toàn bộ feature không có ý nghĩa.

**Independent Test**: Có thể test độc lập bằng cách đăng nhập với tài khoản tình nguyện viên có ít nhất 3-5 hoạt động đã đăng ký với các trạng thái khác nhau (PENDING, APPROVED, REJECTED, CANCELLED), sau đó truy cập trang lịch sử và xác nhận danh sách hiển thị đầy đủ các bản ghi với thông tin chính xác (tên hoạt động, ngày tham gia, trạng thái).

**Acceptance Scenarios**:

1. **Given** tôi là tình nguyện viên đã đăng nhập và có ít nhất 5 hoạt động đã đăng ký, **When** tôi truy cập trang "Lịch sử tình nguyện", **Then** hệ thống hiển thị danh sách tất cả các hoạt động mà tôi đã đăng ký, sắp xếp theo `createdAt` giảm dần (đơn mới nhất trước).

2. **Given** tôi đang xem danh sách lịch sử, **When** tôi quan sát từng bản ghi, **Then** mỗi bản ghi hiển thị: tên sự kiện, địa điểm, ngày bắt đầu sự kiện, thời điểm đăng ký, và trạng thái xử lý đơn (PENDING/APPROVED/REJECTED/CANCELLED).

3. **Given** tôi chưa đăng ký hoạt động nào, **When** tôi truy cập trang lịch sử, **Then** hệ thống hiển thị thông báo "Bạn chưa tham gia sự kiện nào" với gợi ý link đến trang danh sách sự kiện để khuyến khích tham gia.

---

### User Story 2 - Xem Tổng Hợp Số Liệu (Priority: P1)

Là một tình nguyện viên, tôi muốn thấy tổng số đơn đăng ký ở đầu trang lịch sử để có cái nhìn tổng quan về số lượng hoạt động đã đăng ký.

**Why this priority**: Số liệu tổng hợp giúp tạo động lực cho người dùng. Ở Schema V3.0, summary chỉ hiển thị tổng số đơn (`total`).

**Independent Test**: Đăng nhập tài khoản có 5 đơn đăng ký. Xác nhận Summary Card hiển thị "Tổng số đơn: 5".

**Acceptance Scenarios**:

1. **Given** tôi có 5 đơn đăng ký, **When** tôi truy cập trang lịch sử, **Then** Summary Card hiển thị "Tổng số đơn: 5".

2. **Given** tôi chưa đăng ký hoạt động nào, **When** tôi xem Summary Card, **Then** hiển thị "Tổng số đơn: 0".



---

### User Story 3 - Phân Trang Danh Sách Lịch Sử (Priority: P2)

Là một tình nguyện viên lâu năm với hơn 50 hoạt động đã tham gia, tôi muốn hệ thống hỗ trợ phân trang để tôi có thể duyệt danh sách lịch sử dễ dàng mà không phải chờ tải toàn bộ dữ liệu.

**Why this priority**: Đây là yêu cầu bắt buộc về hiệu năng từ CONTEXT.md mục 4 "Performance" và mục 7 câu trả lời số 3. Phân trang đảm bảo hệ thống hoạt động tốt với tình nguyện viên lâu năm. Tuy nhiên, priority thấp hơn P1 vì MVP có thể hoạt động với limit mặc định trước khi triển khai phân trang đầy đủ.

**Independent Test**: Có thể test độc lập bằng cách tạo tài khoản test với 30 hoạt động, sau đó xác nhận: phần đầu tiên hiển thị 10 hoạt động đầu tiên, có điều hướng "Trang tiếp theo", khi kích hoạt chuyển sang phần tiếp theo hiển thị 10 hoạt động tiếp theo, có điều hướng "Trang trước" và "Trang tiếp theo".

**Acceptance Scenarios**:

1. **Given** tôi có 25 hoạt động đã đăng ký và hệ thống phân trang 10 bản ghi mỗi phần, **When** tôi truy cập trang lịch sử lần đầu, **Then** hệ thống hiển thị 10 hoạt động gần nhất (phần 1) với điều hướng "Trang 1 / 3" và nút "Tiếp theo".

2. **Given** tôi đang ở phần 2, **When** tôi kích hoạt "Tiếp theo", **Then** hệ thống chuyển sang phần 3 hiển thị 5 hoạt động còn lại, và nút "Tiếp theo" bị vô hiệu hóa (hoặc ẩn đi).

3. **Given** tôi đang ở phần 3, **When** tôi kích hoạt "Trang trước", **Then** hệ thống quay lại phần 2 và hiển thị 10 hoạt động tương ứng.

---

### User Story 4 - Lọc Lịch Sử Theo Trạng Thái, Năm và Tìm Kiếm (Priority: P3)

Là một tình nguyện viên đã tham gia nhiều hoạt động qua nhiều năm, tôi muốn lọc danh sách lịch sử theo trạng thái (PENDING/APPROVED/REJECTED/CANCELLED), theo năm tham gia, và tìm kiếm theo tên sự kiện/địa điểm để dễ dàng tìm kiếm thông tin cụ thể.

**Why this priority**: Đây là yêu cầu từ CONTEXT.md mục 7 câu trả lời số 5, giúp cải thiện trải nghiệm người dùng khi dữ liệu lớn. Tuy nhiên, đây là tính năng nâng cao (nice-to-have), không phải yêu cầu bắt buộc cho MVP, do đó được xếp priority P3.

**Independent Test**: Tạo tài khoản test với events năm 2024 (2 events), 2025 (3 events). (1) Chọn bộ lọc "Trạng thái: APPROVED" → chỉ hiển thị events APPROVED. (2) Chọn bộ lọc "Năm: 2025" → chỉ hiển thị events năm 2025. (3) Nhập search → chỉ hiển thị events khớp từ khóa. (4) Xóa bộ lọc → hiển thị lại toàn bộ.

**Acceptance Scenarios**:

1. **Given** tôi có hoạt động từ năm 2024, 2025, 2026, **When** tôi chọn bộ lọc "Năm: 2025", **Then** hệ thống chỉ hiển thị các hoạt động diễn ra trong năm 2025.

2. **Given** tôi có 10 hoạt động với các trạng thái khác nhau, **When** tôi chọn bộ lọc "Trạng thái: APPROVED", **Then** hệ thống chỉ hiển thị các hoạt động có trạng thái APPROVED.

3. **Given** tôi đã áp dụng bộ lọc, **When** tôi yêu cầu xóa bộ lọc, **Then** hệ thống hiển thị lại toàn bộ danh sách lịch sử không bị lọc.

4. **Given** tôi có hoạt động với tên cụ thể, **When** tôi nhập từ khóa vào ô tìm kiếm, **Then** hệ thống lọc theo tên sự kiện và địa điểm khớp với từ khóa.

---

### Edge Cases

- **Không có dữ liệu attendance**: Schema V3.0 chưa có bảng `attendances`. Mỗi bản ghi chỉ hiển thị từ `applications` và `events`.

- **Sự kiện không khả dụng**: Nếu event bị null, frontend hiển thị "N/A" cho tên sự kiện và địa điểm.

- **Phân trang với dữ liệu thay đổi**: Nếu có hoạt động mới được thêm vào trong khi người dùng đang duyệt danh sách, hệ thống KHÔNG tự động cập nhật danh sách hiện tại (người dùng phải làm mới trang để thấy dữ liệu mới nhất).

- **Người dùng không có quyền truy cập**: Nếu thông tin xác thực không hợp lệ hoặc đã hết hạn, hệ thống từ chối truy cập và chuyển hướng về trang đăng nhập.

- **Tìm kiếm không có kết quả**: Khi người dùng nhập từ khóa tìm kiếm không khớp với bất kỳ sự kiện hoặc địa điểm nào, danh sách hiển thị rỗng.

## Requirements *(mandatory)*

### Functional Requirements

#### FR-001: Xác Thực và Phân Quyền (Security - CRITICAL)

**WHEN** người dùng truy cập trang lịch sử tình nguyện, **THE system SHALL** xác thực danh tính người dùng dựa trên thông tin đăng nhập đã được lưu trữ an toàn (KHÔNG tin tưởng bất kỳ thông tin danh tính nào từ yêu cầu của người dùng).

**WHEN** hệ thống xác thực danh tính thành công, **THE system SHALL** chỉ trả về dữ liệu lịch sử thuộc về chính người dùng đó (không được phép xem lịch sử của người dùng khác).

**WHEN** thông tin xác thực không hợp lệ hoặc đã hết hạn, **THE system SHALL** từ chối truy cập với thông báo lỗi "Không có quyền truy cập" và chuyển hướng người dùng về trang đăng nhập.

**Rationale**: Tuân thủ ràng buộc Security tại CONTEXT.md mục 4 và ADR-002 tại CLAUDE.md. Việc lấy danh tính từ cơ chế xác thực an toàn là bắt buộc để ngăn chặn tấn công giả mạo danh tính.

---

#### FR-002: Truy Xuất Dữ Liệu Lịch Sử Tham Gia

**WHEN** người dùng đã được xác thực, **THE system SHALL** truy xuất toàn bộ dữ liệu tham gia sự kiện và kết quả ghi nhận dựa trên danh tính người dùng đã được xác thực.

**WHERE** dữ liệu được truy xuất, **THE system SHALL** chỉ bao gồm các bản ghi còn hiệu lực (loại trừ các bản ghi đã bị gỡ bỏ khỏi hệ thống) để đảm bảo tính toàn vẹn dữ liệu.

**WHEN** truy xuất hoàn tất, **THE system SHALL** sắp xếp danh sách theo thứ tự thời gian đăng ký giảm dần (hoạt động gần nhất hiển thị trước).

**Rationale**: Tuân thủ ràng buộc Data Integrity tại CONTEXT.md mục 4 và giả định sắp xếp tại CONTEXT.md mục 5.

---

#### FR-003: Hiển Thị Bảng Tóm Tắt (Summary Card)

**WHEN** trang lịch sử được tải, **THE system SHALL** hiển thị bảng tóm tắt ở đầu trang: **Tổng số đơn đăng ký** (tất cả trạng thái)..

**Rationale**: Schema V3.0 chỉ join application → event. Summary nâng cao (tổng giờ, số hoàn thành) sẽ bổ sung khi có attendances.

---

#### FR-004: Hiển Thị Danh Sách Lịch Sử

**WHEN** danh sách lịch sử được hiển thị, **THE system SHALL** bao gồm tất cả các trạng thái đơn đăng ký: Đã duyệt, Đã hoàn thành, Bị từ chối, Đã hủy.

**WHERE** mỗi bản ghi trong danh sách, **THE system SHALL** hiển thị các thông tin sau:

- Tên hoạt động
- Tổ chức chủ trì
- Ngày bắt đầu hoạt động (hiển thị theo ngữ cảnh thời gian của người dùng)
- Trạng thái xử lý đơn đăng ký
- Số giờ đóng góp (CHỈ hiển thị khi hoạt động đã hoàn thành và có kết quả ghi nhận tham gia hợp lệ)
- Trạng thái chứng nhận (CHỈ hiển thị khi hoạt động đã hoàn thành)

**WHEN** hoạt động đã hoàn thành nhưng chưa có kết quả ghi nhận tham gia, **THE system SHALL** hiển thị "Chưa có kết quả ghi nhận" thay vì số giờ.

**Rationale**: Đáp ứng quyết định tại CONTEXT.md mục 7 câu trả lời số 1 về phạm vi hiển thị.

---

#### FR-005: Phân Trang (Pagination)

**WHEN** người dùng có nhiều hơn 10 bản ghi lịch sử, **THE system SHALL** hỗ trợ phân trang danh sách với số lượng bản ghi có thể cấu hình.

**WHERE** phân trang được áp dụng, **THE system SHALL** cung cấp các thông tin và điều khiển sau:

- Hiển thị chỉ báo vị trí hiện tại trong toàn bộ danh sách (ví dụ: "Trang 2 / 5")
- Điều khiển điều hướng trang trước (vô hiệu hóa khi ở đầu danh sách)
- Điều khiển điều hướng trang tiếp theo (vô hiệu hóa khi ở cuối danh sách)

**WHEN** người dùng kích hoạt điều hướng trang, **THE system SHALL** cập nhật danh sách hiển thị với dữ liệu tương ứng.

**Rationale**: Đáp ứng yêu cầu Performance tại CONTEXT.md mục 4 và quyết định tại mục 7 câu trả lời số 3.

---

#### FR-006: Bộ Lọc (Filtering)

**WHEN** người dùng muốn lọc danh sách, **THE system SHALL** cung cấp 2 bộ lọc:

1. **Lọc theo Trạng thái**: Danh sách tùy chọn với các giá trị Tất cả (mặc định), Đã duyệt, Đã hoàn thành, Bị từ chối, Đã hủy.
2. **Lọc theo Năm**: Danh sách tùy chọn với các giá trị Tất cả (mặc định), và danh sách các năm có dữ liệu (ví dụ: 2024, 2025, 2026).

**WHERE** bộ lọc được áp dụng, **THE system SHALL** chỉ hiển thị các bản ghi thỏa mãn tiêu chí lọc đã chọn.

**WHEN** người dùng yêu cầu xóa bộ lọc, **THE system SHALL** reset về trạng thái mặc định (hiển thị tất cả bản ghi không lọc).

**Rationale**: Đáp ứng quyết định tại CONTEXT.md mục 7 câu trả lời số 5 để cải thiện trải nghiệm người dùng với dữ liệu lớn.

---

#### FR-007: Tích Hợp Chứng Nhận (Certificate Integration)

**WHEN** sự kiện đã hoàn thành và có chứng nhận được cấp, **THE system SHALL** hiển thị nhãn "Đã cấp chứng nhận" kèm link điều hướng sang trang quản lý chứng nhận của Member 2 (UC51).

**WHERE** chứng nhận chưa được cấp, **THE system SHALL** hiển thị "Chứng nhận đang được xử lý" hoặc không hiển thị gì (tùy thiết kế UX).

**THE system SHALL NOT** tạo, tải xuống, hoặc xử lý logic PDF chứng nhận (đây là trách nhiệm của Module 2 - UC51/UC52).

**Rationale**: Tuân thủ ranh giới module (Module Boundaries) theo quyết định tại CONTEXT.md mục 7 câu trả lời số 4. UC21 chỉ đóng vai trò tổng hợp trạng thái, không xử lý logic chứng nhận.

---

#### FR-008: Format Phản Hồi Chuẩn

**WHEN** hệ thống trả về phản hồi, **THE system SHALL** tuân thủ format chuẩn của dự án với cấu trúc bao gồm:

**Phản hồi thành công** chứa:

- Cờ trạng thái thành công
- Dữ liệu bao gồm:
  - Số liệu tổng hợp (tổng giờ tích lũy, tổng số hoạt động, số hoạt động hoàn thành)
  - Danh sách lịch sử với các thuộc tính: định danh đơn đăng ký, định danh sự kiện, tên sự kiện, tên tổ chức, ngày bắt đầu sự kiện, trạng thái xử lý đơn, số giờ đóng góp, trạng thái chứng nhận
  - Thông tin phân trang: vị trí hiện tại, tổng số phần, tổng số bản ghi, giới hạn bản ghi

**Phản hồi lỗi** chứa:

- Cờ trạng thái thất bại
- Thông báo lỗi mô tả chi tiết

**Rationale**: Tuân thủ ADR-006 tại CLAUDE.md Section 3 và ràng buộc Response Standard tại CONTEXT.md mục 4.

---

#### FR-009: Xử Lý Trường Hợp Không Có Dữ Liệu

**WHEN** người dùng chưa đăng ký hoạt động nào, **THE system SHALL** hiển thị thông báo: "Bạn chưa tham gia sự kiện nào. Hãy khám phá các sự kiện tình nguyện hấp dẫn!" kèm điều hướng đến trang danh sách sự kiện.

**WHEN** bộ lọc được áp dụng nhưng không có kết quả, **THE system SHALL** hiển thị: "Không tìm thấy sự kiện phù hợp với bộ lọc. Vui lòng thử lại với bộ lọc khác." kèm điều khiển xóa bộ lọc.

**Rationale**: Cải thiện trải nghiệm người dùng và khuyến khích tham gia sự kiện.

---

### Key Entities *(Business Level Only)*

- **Volunteer History Record**: Đại diện cho một bản ghi lịch sử đăng ký sự kiện của tình nguyện viên. Bao gồm: định danh đơn đăng ký, thông tin sự kiện (tên, địa điểm, ngày bắt đầu), trạng thái xử lý đơn, thời gian đăng ký.

- **Summary**: Số liệu tổng hợp đơn giản: tổng số đơn đăng ký.

- **Pagination Context**: Thông tin phân trang bao gồm: vị trí hiện tại, tổng số phần, tổng số bản ghi, và số lượng bản ghi mỗi phần.

- **Filter Criteria**: Các tiêu chí lọc do người dùng chọn, bao gồm: trạng thái đơn, năm tham gia, từ khóa tìm kiếm (tên sự kiện/địa điểm).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Tình nguyện viên có thể xem đầy đủ lịch sử tham gia của mình (bao gồm tất cả trạng thái) trong vòng 2 giây kể từ khi truy cập trang.

- **SC-002**: Hệ thống hiển thị chính xác 100% số liệu tổng hợp (tổng số đơn) so với dữ liệu thực tế trong hệ thống.

- **SC-003**: Với tình nguyện viên có hơn 100 hoạt động, hệ thống vẫn phản hồi trong vòng 3 giây nhờ cơ chế phân trang.

- **SC-004**: 95% tình nguyện viên có thể tìm thấy hoạt động cụ thể trong lịch sử của họ trong vòng 30 giây bằng cách sử dụng bộ lọc hoặc phân trang.

- **SC-005**: Không có trường hợp nào tình nguyện viên có thể xem được lịch sử của người dùng khác (bảo mật 100%).

- **SC-006**: Hệ thống xử lý chính xác 100% các trường hợp edge case (không có dữ liệu, không có kết quả ghi nhận, chứng nhận chưa cấp) mà không gây lỗi hoặc crash.

## Assumptions

- **Giả định về dữ liệu ghi nhận tham gia**: Dữ liệu kết quả ghi nhận tham gia đã được các module quản lý sự kiện (Member 3 - UC43) cập nhật đầy đủ và chính xác vào hệ thống. UC21 chỉ đọc và hiển thị dữ liệu, không chịu trách nhiệm cập nhật trạng thái ghi nhận.

- **Giả định về hiển thị thời gian**: Hệ thống SHALL đảm bảo thời gian sự kiện (ngày bắt đầu/kết thúc, thời điểm ghi nhận) được hiển thị theo ngữ cảnh thời gian địa phương của người dùng một cách tự động và chính xác.

- **Giả định về trạng thái sự kiện**: Hệ thống giả định rằng các sự kiện trong lịch sử đã trải qua đầy đủ quy trình xét duyệt và quản lý trạng thái theo quy tắc nghiệp vụ VMS tại AGENTS.md Section 3.

- **Giả định về chứng nhận**: Việc tạo và quản lý chứng nhận thuộc trách nhiệm của Member 2 (UC51/UC52). UC21 chỉ hiển thị trạng thái và link điều hướng, không xử lý logic tạo hoặc tải xuống chứng nhận.

- **Giả định về kết nối mạng**: Người dùng có kết nối internet ổn định để tải danh sách lịch sử và tương tác với các bộ lọc/phân trang.

---

## Out of Scope

Các tính năng sau KHÔNG nằm trong phạm vi của UC21 và KHÔNG được implement:

- **Thông tin Tổ chức (Organization)**: Schema V3.0 không join bảng `organizations`. Tên tổ chức sẽ được bổ sung khi schema mở rộng.

- **Xuất báo cáo**: Chức năng xuất lịch sử tham gia dưới dạng file định dạng văn bản hoặc bảng tính KHÔNG được triển khai trong v1 (theo giả định tại CONTEXT.md mục 5). Đây là tính năng nâng cao có thể được bổ sung trong v2 nếu có nhu cầu.

- **Chỉnh sửa hoặc xóa lịch sử**: Tình nguyện viên KHÔNG thể chỉnh sửa, xóa, hoặc ẩn các bản ghi lịch sử. Dữ liệu lịch sử là chỉ đọc và phản ánh chính xác trạng thái trong hệ thống.

- **Số giờ đóng góp (Volunteer Hours)**: Schema V3.0 chưa có bảng `attendances`. Số giờ sẽ được bổ sung khi có attendance data. **Trạng thái ATTENDED (derived)**: Chưa có attendance data nên chưa ánh xạ được APPROVED + PRESENT → ATTENDED. **Chứng nhận (Certificate)**: Schema V3.0 chưa có bảng `certificates`. Logic thuộc Member 2 (UC51/UC52).

- **Thông báo cập nhật tự động**: Hệ thống KHÔNG tự động cập nhật danh sách lịch sử khi có hoạt động mới hoặc trạng thái thay đổi. Người dùng phải làm mới trang để xem dữ liệu cập nhật (theo edge case đã định nghĩa).

- **Biểu đồ hoặc dashboard phân tích**: UC21 chỉ hiển thị Summary Card với 3 số liệu cơ bản. Các biểu đồ phân tích nâng cao về xu hướng tham gia hoặc so sánh với tình nguyện viên khác KHÔNG thuộc phạm vi này.

- **Chuyển đổi ngữ cảnh thời gian thủ công**: Người dùng KHÔNG thể chọn ngữ cảnh thời gian hiển thị khác. Hệ thống tự động hiển thị theo ngữ cảnh thời gian địa phương của người dùng.

- **Export API endpoint**: KHÔNG cung cấp endpoint riêng cho việc export dữ liệu dưới dạng file hoặc định dạng khác cho mục đích tích hợp với hệ thống bên ngoài. Tính năng chỉ phục vụ mục đích hiển thị trên giao diện web.
