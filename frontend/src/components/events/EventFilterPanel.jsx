export default function EventFilterPanel({ filters, onFilterChange, onClearFilter, onClearAll }) {
    const updateFilter = (key) => (event) => onFilterChange(key, event.target.value);
    const activeFilters = [
        ['location', 'Location', filters.location],
        ['startDate', 'From', filters.startDate],
        ['endDate', 'To', filters.endDate],
        ['availability', 'Availability', filters.availability]
    ].filter(([, , value]) => value);

    return (
        <div className="event-filter-panel">
            <div className="row g-3 align-items-end">
                <div className="col-12 col-md-4 col-xl-3">
                    <label className="form-label fw-semibold" htmlFor="event-location">
                        Location
                    </label>
                    <div className="input-group">
                        <input
                            id="event-location"
                            className="form-control"
                            value={filters.location}
                            placeholder="City or venue"
                            onChange={updateFilter('location')}
                        />
                        {filters.location && (
                            <button
                                className="btn btn-outline-secondary"
                                type="button"
                                onClick={() => onClearFilter('location')}
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                <div className="col-6 col-md-4 col-xl-2">
                    <label className="form-label fw-semibold" htmlFor="event-start-date">
                        From
                    </label>
                    <input
                        id="event-start-date"
                        className="form-control"
                        type="date"
                        value={filters.startDate}
                        onChange={updateFilter('startDate')}
                    />
                </div>

                <div className="col-6 col-md-4 col-xl-2">
                    <label className="form-label fw-semibold" htmlFor="event-end-date">
                        To
                    </label>
                    <input
                        id="event-end-date"
                        className="form-control"
                        type="date"
                        value={filters.endDate}
                        onChange={updateFilter('endDate')}
                    />
                </div>

                <div className="col-12 col-md-4 col-xl-2">
                    <label className="form-label fw-semibold" htmlFor="event-availability">
                        Availability
                    </label>
                    <select
                        id="event-availability"
                        className="form-select"
                        value={filters.availability}
                        onChange={updateFilter('availability')}
                    >
                        <option value="">Any</option>
                        <option value="AVAILABLE">Available</option>
                        <option value="FULL">Full</option>
                    </select>
                </div>

                <div className="col-12 col-md-4 col-xl-3">
                    <label className="form-label fw-semibold" htmlFor="event-category">
                        Category
                    </label>
                    <select id="event-category" className="form-select" value="" disabled>
                        <option>No public category source</option>
                    </select>
                </div>

                <div className="col-12 col-md-4 col-xl-3">
                    <label className="form-label fw-semibold" htmlFor="event-skill">
                        Skill
                    </label>
                    <select id="event-skill" className="form-select" value="" disabled>
                        <option>No public skill source</option>
                    </select>
                </div>

                <div className="col-12 col-md-4 col-xl-3">
                    <label className="form-label fw-semibold" htmlFor="event-organization">
                        Organization
                    </label>
                    <select id="event-organization" className="form-select" value="" disabled>
                        <option>No public organization source</option>
                    </select>
                </div>

                <div className="col-12 col-xl-3 d-flex gap-2 justify-content-xl-end">
                    <button className="btn btn-outline-secondary w-100" type="button" onClick={onClearAll}>
                        Clear filters
                    </button>
                </div>
            </div>

            {activeFilters.length > 0 && (
                <div className="active-filter-list">
                    {activeFilters.map(([key, label, value]) => (
                        <button
                            className="btn btn-sm btn-light active-filter-chip"
                            key={key}
                            type="button"
                            onClick={() => onClearFilter(key)}
                        >
                            {label}: {value} <span aria-hidden="true">x</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
