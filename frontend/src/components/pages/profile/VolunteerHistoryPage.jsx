import React from 'react';
import {
  History, CheckCircle2, CalendarDays, Filter, Search,
  ChevronLeft, ChevronRight, AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useVolunteerHistory from '../../../hooks/useVolunteerHistory';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Skeleton from '../../ui/Skeleton';
import EmptyState from '../../ui/EmptyState';
import ErrorState from '../../ui/ErrorState';

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
const STATUS_LABELS = {
  PENDING:    'Chờ duyệt',
  APPROVED:   'Đã duyệt',
  REJECTED:   'Từ chối',
  CANCELLED:  'Đã hủy',
};

const STATUS_COLORS = {
  PENDING:    { bg: '#fef3c7', text: '#92400e' },
  APPROVED:   { bg: '#dbeafe', text: '#1e40af' },
  REJECTED:   { bg: '#fee2e2', text: '#991b1b' },
  CANCELLED:  { bg: '#f3f4f6', text: '#374151' },
};

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => currentYear - i);

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function formatDate(iso) {
  if (!iso) return '\u2014';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '\u2014';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/* ------------------------------------------------------------------ */
/*  Summary Card                                                      */
/* ------------------------------------------------------------------ */
function SummaryCard({ summary }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: 'var(--space-3)',
      marginBottom: 'var(--space-4)',
    }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--green-light)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckCircle2 size={22} style={{ color: 'var(--green-primary)' }} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-micro)', color: 'var(--text-secondary)' }}>
              Đơn đã duyệt
            </div>
            <div style={{ fontSize: 'var(--font-size-h2)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>
              {summary.completed_events}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--blue-light, #dbeafe)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <CalendarDays size={22} style={{ color: 'var(--blue-primary, #2563eb)' }} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-micro)', color: 'var(--text-secondary)' }}>
              Tổng số đơn
            </div>
            <div style={{ fontSize: 'var(--font-size-h2)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>
              {summary.total_events}
            </div>
          </div>
        </div>
      </Card>

    </div>
  );
}
/* ------------------------------------------------------------------ */
/*  Filter Bar                                                        */
/* ------------------------------------------------------------------ */
function FilterBar({ filters, onApply }) {
  const [status, setStatus] = React.useState(filters.status || '');
  const [year, setYear] = React.useState(filters.year || '');
  const [search, setSearch] = React.useState(filters.search || '');
  const timerRef = React.useRef(null);

  const emitFilters = (overrides = {}) => {
    const current = {
      status: overrides.status !== undefined ? overrides.status : status,
      year: overrides.year !== undefined ? overrides.year : year,
      search: overrides.search !== undefined ? overrides.search : search,
    };
    onApply({
      status: current.status || undefined,
      year: current.year ? Number(current.year) : undefined,
      search: current.search || undefined,
    });
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      emitFilters({ search: value });
    }, 300);
  };

  const handleStatusChange = (value) => {
    setStatus(value);
    emitFilters({ status: value });
  };

  const handleYearChange = (value) => {
    setYear(value);
    emitFilters({ year: value });
  };

  const handleReset = () => {
    clearTimeout(timerRef.current);
    setStatus('');
    setYear('');
    setSearch('');
    onApply({ status: undefined, year: undefined, search: undefined });
  };

  return (
    <Card style={{ marginBottom: 'var(--space-4)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <Filter size={18} style={{ color: 'var(--text-tertiary)' }} />

        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 300 }}>
          <Search size={16} style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-tertiary)',
          }} />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Tìm sự kiện hoặc địa điểm..."
            style={{
              width: '100%', padding: '8px 12px 8px 32px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-input)', backgroundColor: '#fff',
              fontSize: 'var(--font-size-body)', color: 'var(--text-primary)',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          style={{
            padding: '8px 12px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-input)', backgroundColor: '#fff',
            fontSize: 'var(--font-size-body)', color: 'var(--text-primary)',
            minWidth: 140,
          }}
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => handleYearChange(e.target.value)}
          style={{
            padding: '8px 12px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-input)', backgroundColor: '#fff',
            fontSize: 'var(--font-size-body)', color: 'var(--text-primary)',
            minWidth: 120,
          }}
        >
          <option value="">Tất cả năm</option>
          {YEAR_OPTIONS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <Button variant="secondary" onClick={handleReset} style={{ fontSize: 'var(--font-size-small)' }}>
          Xóa bộ lọc
        </Button>
      </div>
    </Card>
  );
}


/* ------------------------------------------------------------------ */
/*  History Table                                                     */
/* ------------------------------------------------------------------ */
function HistoryTable({ items }) {
  const navigate = useNavigate();

  return (
    <Card style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%', borderCollapse: 'collapse',
        fontSize: 'var(--font-size-body)',
      }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--surface-ceramic)' }}>
            <th style={thStyle}>Sự kiện</th>
            <th style={thStyle}>Địa điểm</th>
            <th style={thStyle}>Ngày bắt đầu</th>
            <th style={thStyle}>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => {
            const color = STATUS_COLORS[row.status] || STATUS_COLORS.CANCELLED;
            return (
              <tr
                key={row.id}
                style={{ borderBottom: '1px solid var(--surface-ceramic)', cursor: 'pointer' }}
                onClick={() => row.event?.id ? navigate(`/volunteer/events/${row.event.id}`) : null}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-ceramic)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <td style={tdStyle}>
                  <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                      {row.event?.title || '\u2014'}
                    </span>
                </td>
                <td style={tdStyle}>
                  <span style={{ color: 'var(--text-secondary)' }}>{row.event?.location || '\u2014'}</span>
                </td>
                <td style={tdStyle}>{formatDate(row.event?.start_date)}</td>
                <td style={tdStyle}>
                  <span style={{
                    display: 'inline-block', padding: '2px 10px', borderRadius: 'var(--radius-pill)',
                    fontSize: 'var(--font-size-micro)', fontWeight: 'var(--font-weight-semibold)',
                    backgroundColor: color.bg, color: color.text,
                  }}>
                    {STATUS_LABELS[row.status] || row.status}
                  </span>
                </td>

              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

const thStyle = {
  padding: '12px 16px', textAlign: 'left', fontWeight: 'var(--font-weight-semibold)',
  color: 'var(--text-secondary)', fontSize: 'var(--font-size-small)',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '12px 16px', color: 'var(--text-primary)',
};

/* ------------------------------------------------------------------ */
/*  Pagination                                                        */
/* ------------------------------------------------------------------ */
function PaginationBar({ pagination, onPageChange }) {
  const { page, totalPages, total: totalRecords } = pagination;
  if (totalPages <= 1) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginTop: 'var(--space-4)', flexWrap: 'wrap', gap: 8,
    }}>
      <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--text-secondary)' }}>
        Tổng: {totalRecords} bản ghi
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Button
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          style={{ padding: '6px 12px' }}
        >
          <ChevronLeft size={16} />
        </Button>
        <span style={{ fontSize: 'var(--font-size-body)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
          {page} / {totalPages}
        </span>
        <Button
          variant="secondary"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          style={{ padding: '6px 12px' }}
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                         */
/* ------------------------------------------------------------------ */
export default function VolunteerHistoryPage() {
  const { history, pagination, summary, loading, error, goToPage, applyFilters } =
    useVolunteerHistory();

  const [currentFilters, setCurrentFilters] = React.useState({});

  const handleApplyFilters = (filters) => {
    setCurrentFilters(filters);
    applyFilters(filters);
  };

  const isEmpty = !loading && !error && history.length === 0;
  const hasData = !loading && !error && history.length > 0;

  return (
    <div style={{
      maxWidth: 'var(--max-content-width)', margin: 'var(--space-6) auto',
      padding: '0 var(--space-4)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 'var(--space-5)',
      }}>
        <History size={28} style={{ color: 'var(--green-primary)' }} />
        <h1 style={{
          fontSize: 'var(--font-size-h1)', fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--text-primary)', margin: 0,
        }}>
          Lịch sử đơn đăng ký
        </h1>
      </div>

      {/* Summary — always shown while loading or with data */}
      {!error && (
        <SummaryCard summary={summary} />
      )}

      <FilterBar filters={currentFilters} onApply={handleApplyFilters} />

      {/* LOADING — skeleton only on first load, inline indicator on refetch */}
      {loading && history.length === 0 && (
        <Card>
          <Skeleton count={5} />
        </Card>
      )}
      {loading && history.length > 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-3)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-micro)' }}>
          Đang tải...
        </div>
      )}

      {/* ERROR */}
      {error && (
        <ErrorState
          icon={AlertCircle}
          title="Không thể tải lịch sử đơn đăng ký"
          message={error}
          onRetry={() => window.location.reload()}
        />
      )}

      {/* EMPTY */}
      {isEmpty && (
        <Card>
          <EmptyState
            icon={History}
            title="Chưa có đơn đăng ký nào"
            message="Gửi đơn đăng ký tham gia các sự kiện tình nguyện để bắt đầu."
          />
        </Card>
      )}

      {/* DATA */}
      {hasData && (
        <>
          <HistoryTable items={history} />
          <PaginationBar pagination={pagination} onPageChange={goToPage} />
        </>
      )}
    </div>
  );
}