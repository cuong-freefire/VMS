/**
 * UC021 — VolunteerHistoryPage Component Tests
 *
 * Kiểm thử giao diện trang Lịch sử tình nguyện:
 *  - Loading state (Skeleton placeholder)
 *  - Data state (Summary cards + table + pagination)
 *  - Empty state (EmptyState component)
 *  - Error state (ErrorState component)
 *  - Filter interactions (apply + reset)
 *  - Pagination navigation
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import VolunteerHistoryPage from "../VolunteerHistoryPage";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockApplyFilters = jest.fn();
const mockGoToPage = jest.fn();
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  MemoryRouter: ({ children }) => children,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

jest.mock("../../../../hooks/useVolunteerHistory", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const useVolunteerHistory =
  require("../../../../hooks/useVolunteerHistory").default;

const BASE_HOOK_RETURN = {
  history: [],
  pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
  summary: { total_events: 0, completed_events: 0, total_hours: 0 },
  loading: false,
  error: null,
  applyFilters: mockApplyFilters,
  goToPage: mockGoToPage,
};

function renderPage() {
  return render(
    <MemoryRouter>
      <VolunteerHistoryPage />
    </MemoryRouter>,
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Find a button by its visible text */
function getButtonByText(text) {
  return screen.getByRole("button", { name: text });
}

/** Find all buttons */
function getAllButtons() {
  return screen.getAllByRole("button");
}

// ── Reset mocks trước mỗi test ───────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  useVolunteerHistory.mockReturnValue({ ...BASE_HOOK_RETURN });
});

// ── Test Suite ───────────────────────────────────────────────────────────────

describe("VolunteerHistoryPage", () => {
  /* ------------------------------------------------------------------
   * 1. Loading State
   * ------------------------------------------------------------------ */
  describe("Loading State", () => {
    it("renders skeleton placeholder while fetching data", () => {
      useVolunteerHistory.mockReturnValue({
        ...BASE_HOOK_RETURN,
        loading: true,
      });

      renderPage();

      expect(screen.getByText("Lịch sử tình nguyện")).toBeInTheDocument();
      // Skeleton component renders Card placeholders
      // eslint-disable-next-line testing-library/no-node-access
      expect(document.querySelectorAll(".card-vms").length).toBeGreaterThan(0);
    });
  });

  /* ------------------------------------------------------------------
   * 2. Data State — Happy Path
   * ------------------------------------------------------------------ */
  describe("Data State", () => {
    const sampleSummary = {
      total_events: 12,
      completed_events: 8,
      total_hours: 45,
    };

    const sampleItems = [
      {
        application_id: 1,
        event_id: 101,
        event_title: "Dọn rác bãi biển",
        organization_name: "GreenOrg",
        event_start_date: "2026-06-15T00:00:00.000Z",
        status: "ATTENDED",
        volunteer_hours: 6,
        certificate_status: "ISSUED",
      },
      {
        application_id: 2,
        event_id: 102,
        event_title: "Dạy học tình thương",
        organization_name: "EduOrg",
        event_start_date: "2026-05-10T00:00:00.000Z",
        status: "APPROVED",
        volunteer_hours: null,
        certificate_status: null,
      },
    ];

    const paginationData = {
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    it("displays summary cards with correct numbers", () => {
      useVolunteerHistory.mockReturnValue({
        ...BASE_HOOK_RETURN,
        history: sampleItems,
        pagination: paginationData,
        summary: sampleSummary,
        loading: false,
        error: null,
      });

      renderPage();

      // Summary cards — each number appears within its own text node
      expect(screen.getByText("8")).toBeInTheDocument(); // completed_events
      expect(screen.getByText("12")).toBeInTheDocument(); // total_events
      expect(screen.getByText("45h")).toBeInTheDocument(); // total_hours
    });

    it("renders table rows for each history item", () => {
      useVolunteerHistory.mockReturnValue({
        ...BASE_HOOK_RETURN,
        history: sampleItems,
        pagination: paginationData,
        summary: sampleSummary,
        loading: false,
        error: null,
      });

      renderPage();

      expect(screen.getByText("Dọn rác bãi biển")).toBeInTheDocument();
      expect(screen.getByText("Dạy học tình thương")).toBeInTheDocument();
      expect(screen.getByText("GreenOrg")).toBeInTheDocument();
      expect(screen.getByText("EduOrg")).toBeInTheDocument();
    });

    it("displays status labels translated to Vietnamese", () => {
      useVolunteerHistory.mockReturnValue({
        ...BASE_HOOK_RETURN,
        history: sampleItems,
        pagination: paginationData,
        summary: sampleSummary,
        loading: false,
        error: null,
      });

      renderPage();

      // "Đã điểm danh" và "Đã duyệt" xuất hiện ở cả filter option và status badge → dùng getAllByText
      const attendedElements = screen.getAllByText("Đã điểm danh");
      expect(attendedElements.length).toBeGreaterThanOrEqual(2); // option + badge
      const approvedElements = screen.getAllByText("Đã duyệt");
      expect(approvedElements.length).toBeGreaterThanOrEqual(2); // option + badge
    });

    it("shows certificate badge for issued certificates", () => {
      useVolunteerHistory.mockReturnValue({
        ...BASE_HOOK_RETURN,
        history: sampleItems,
        pagination: paginationData,
        summary: sampleSummary,
        loading: false,
        error: null,
      });

      renderPage();

      expect(screen.getByText("Có chứng nhận")).toBeInTheDocument();
    });

    it("navigates to event detail page on row click", () => {
      useVolunteerHistory.mockReturnValue({
        ...BASE_HOOK_RETURN,
        history: sampleItems,
        pagination: paginationData,
        summary: sampleSummary,
        loading: false,
        error: null,
      });

      renderPage();

      // Click on a table row (tr containing event title)
      // eslint-disable-next-line testing-library/no-node-access
      const row = screen.getByText("Dọn rác bãi biển").closest("tr");
      fireEvent.click(row);
      expect(mockNavigate).toHaveBeenCalledWith("/volunteer/events/101");
    });

    it("does not render pagination when totalPages <= 1", () => {
      useVolunteerHistory.mockReturnValue({
        ...BASE_HOOK_RETURN,
        history: sampleItems,
        pagination: { total: 2, page: 1, limit: 10, totalPages: 1 },
        summary: sampleSummary,
        loading: false,
        error: null,
      });

      renderPage();

      expect(screen.queryByText(/Tổng:/)).toBeNull();
    });

    it("renders pagination bar and supports page navigation when totalPages > 1", () => {
      useVolunteerHistory.mockReturnValue({
        ...BASE_HOOK_RETURN,
        history: sampleItems,
        pagination: { total: 25, page: 1, limit: 10, totalPages: 3 },
        summary: sampleSummary,
        loading: false,
        error: null,
      });

      renderPage();

      expect(screen.getByText("Tổng: 25 bản ghi")).toBeInTheDocument();
      expect(screen.getByText("1 / 3")).toBeInTheDocument();

      // Tìm nút ">" điều hướng (ChevronRight) bằng các button đã render
      const buttons = getAllButtons();
      // PaginationBar có 2 button: [ChevronLeft] [ChevronRight]
      // Filter buttons: chỉ giữ button không chứa text "Lọc" / "Xóa bộ lọc"
      const paginationButtons = buttons.filter(
        (btn) =>
          !btn.textContent.includes("Lọc") &&
          !btn.textContent.includes("Xóa"),
      );
      // Ít nhất có 2 button pagination (prev next)
      expect(paginationButtons.length).toBeGreaterThanOrEqual(2);
      // Click button cuối cùng (next page - ChevronRight, button enabled)
      const nextBtn = paginationButtons[paginationButtons.length - 1];
      fireEvent.click(nextBtn);
      expect(mockGoToPage).toHaveBeenCalledWith(2);
    });
  });

  /* ------------------------------------------------------------------
   * 3. Empty State
   * ------------------------------------------------------------------ */
  describe("Empty State", () => {
    it("renders empty state message when no history and not loading/error", () => {
      useVolunteerHistory.mockReturnValue({
        ...BASE_HOOK_RETURN,
        history: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
        summary: { total_events: 0, completed_events: 0, total_hours: 0 },
        loading: false,
        error: null,
      });

      renderPage();

      expect(
        screen.getByText("Chưa có lịch sử tình nguyện"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Tham gia các sự kiện tình nguyện để xây dựng lịch sử hoạt động của bạn.",
        ),
      ).toBeInTheDocument();
    });

    it("still shows summary cards with zero values in empty state", () => {
      useVolunteerHistory.mockReturnValue({
        ...BASE_HOOK_RETURN,
        history: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
        summary: { total_events: 0, completed_events: 0, total_hours: 0 },
        loading: false,
        error: null,
      });

      renderPage();

      // "0" xuất hiện ở completed_events, total_events; "0h" ở total_hours
      const zeroTexts = screen.getAllByText("0");
      expect(zeroTexts.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText("0h")).toBeInTheDocument();
    });
  });

  /* ------------------------------------------------------------------
   * 4. Error State
   * ------------------------------------------------------------------ */
  describe("Error State", () => {
    it("renders ErrorState with error message on fetch failure", () => {
      const errorMsg = "Lỗi kết nối server";
      useVolunteerHistory.mockReturnValue({
        ...BASE_HOOK_RETURN,
        loading: false,
        error: errorMsg,
      });

      renderPage();

      expect(screen.getByText("Không thể tải lịch sử")).toBeInTheDocument();
      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });

    it("renders retry button in error state", () => {
      useVolunteerHistory.mockReturnValue({
        ...BASE_HOOK_RETURN,
        loading: false,
        error: "Test error",
      });

      renderPage();

      expect(getButtonByText("Thử lại")).toBeInTheDocument();
    });
  });

  /* ------------------------------------------------------------------
   * 5. Filter Interactions
   * ------------------------------------------------------------------ */
  describe("Filter Interactions", () => {
    it("calls applyFilters with selected status and year on Lọc click", () => {
      useVolunteerHistory.mockReturnValue({
        ...BASE_HOOK_RETURN,
        history: [],
        loading: false,
        error: null,
      });

      renderPage();

      // Select status thông qua display value
      const statusSelect = screen.getByDisplayValue("Tất cả trạng thái");
      fireEvent.change(statusSelect, { target: { value: "ATTENDED" } });

      // Click nút "Lọc"
      fireEvent.click(getButtonByText("Lọc"));

      expect(mockApplyFilters).toHaveBeenCalledWith(
        expect.objectContaining({ status: "ATTENDED" }),
      );
    });

    it("resets filters to undefined on Xóa bộ lọc click", () => {
      useVolunteerHistory.mockReturnValue({
        ...BASE_HOOK_RETURN,
        history: [],
        loading: false,
        error: null,
      });

      renderPage();

      fireEvent.click(getButtonByText("Xóa bộ lọc"));

      expect(mockApplyFilters).toHaveBeenCalledWith({
        status: undefined,
        year: undefined,
      });
    });
  });
});