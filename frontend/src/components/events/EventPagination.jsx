export default function EventPagination({ pagination, onPageChange }) {
    const totalPages = pagination?.totalPages || 0;
    const currentPage = pagination?.page || 1;

    if (totalPages <= 1) {
        return null;
    }

    const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

    return (
        <nav className="event-pagination" aria-label="Event pages">
            <button
                className="btn btn-outline-secondary"
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
            >
                Previous
            </button>

            <div className="btn-group" role="group" aria-label="Event page numbers">
                {pages.map((page) => (
                    <button
                        className={`btn ${page === currentPage ? 'btn-primary' : 'btn-outline-primary'}`}
                        type="button"
                        key={page}
                        onClick={() => onPageChange(page)}
                    >
                        {page}
                    </button>
                ))}
            </div>

            <button
                className="btn btn-outline-secondary"
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
            >
                Next
            </button>
        </nav>
    );
}
