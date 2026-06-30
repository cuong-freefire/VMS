import EventCard from './EventCard';

export default function EventList({ events }) {
    return (
        <div className="row g-4">
            {events.map((event) => (
                <div className="col-12 col-md-6 col-xl-4" key={event.id}>
                    <EventCard event={event} />
                </div>
            ))}
        </div>
    );
}
