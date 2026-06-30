export const DEFAULT_EVENT_QUERY = {
    page: 1,
    pageSize: 6,
    keyword: '',
    location: '',
    startDate: '',
    endDate: '',
    availability: '',
    categoryId: '',
    skillId: '',
    organizationId: ''
};

export function buildEventQueryParams(query) {
    const params = {
        page: query.page || DEFAULT_EVENT_QUERY.page,
        pageSize: query.pageSize || DEFAULT_EVENT_QUERY.pageSize
    };

    const keyword = String(query.keyword || '').trim();
    const location = String(query.location || '').trim();

    if (keyword) {
        params.keyword = keyword;
    }

    if (location) {
        params.location = location;
    }

    ['startDate', 'endDate', 'availability', 'categoryId', 'skillId', 'organizationId'].forEach((key) => {
        if (query[key]) {
            params[key] = query[key];
        }
    });

    return params;
}

export function hasActiveFilters(query) {
    return Boolean(
        query.location ||
        query.startDate ||
        query.endDate ||
        query.availability ||
        query.categoryId ||
        query.skillId ||
        query.organizationId
    );
}
