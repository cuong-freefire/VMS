export function formatEventDateRange(startDate, endDate) {
    if (!startDate && !endDate) {
        return 'Time to be updated';
    }

    const format = new Intl.DateTimeFormat('en', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const start = startDate ? format.format(new Date(startDate)) : '';
    const end = endDate ? format.format(new Date(endDate)) : '';

    return [start, end].filter(Boolean).join(' - ');
}

export function formatSlots(event) {
    if (event?.remainingSlots === undefined || event?.maxCapacity === undefined) {
        return 'Slots to be updated';
    }

    return `${event.remainingSlots}/${event.maxCapacity} slots left`;
}

export function getStatusClass(displayStatus) {
    const normalized = String(displayStatus || '').toUpperCase();

    if (normalized === 'ONGOING') {
        return 'text-bg-primary';
    }

    if (normalized === 'COMPLETED') {
        return 'text-bg-secondary';
    }

    return 'text-bg-success';
}
