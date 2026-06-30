export default function EventSearchBar({ value, onChange }) {
    return (
        <div className="event-toolbar-section">
            <label className="form-label fw-semibold" htmlFor="event-keyword">
                Search
            </label>
            <input
                id="event-keyword"
                className="form-control"
                type="search"
                value={value}
                placeholder="Search events, location, organization..."
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}
