function validationError(message) {
  const error = new Error(message);
  error.status = 422;
  return error;
}

function parsePositiveInteger(value, fieldName) {
  if (value === undefined) {
    return undefined;
  }

  if (!/^\d+$/.test(String(value))) {
    throw validationError(`${fieldName} must be a positive integer`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw validationError(`${fieldName} must be a positive integer`);
  }

  return parsed;
}

function parseDate(value, fieldName, endOfDay = false) {
  if (value === undefined) {
    return undefined;
  }

  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(String(value));
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw validationError(`${fieldName} must be a valid date`);
  }

  if (dateOnly && endOfDay) {
    date.setUTCHours(23, 59, 59, 999);
  }

  return date;
}

export function validatePublicEventQuery(req, res, next) {
  try {
    const page = parsePositiveInteger(req.query.page, 'page') ?? 1;
    const pageSize = parsePositiveInteger(req.query.pageSize, 'pageSize') ?? 10;

    if (pageSize > 50) {
      throw validationError('pageSize must be less than or equal to 50');
    }

    const keyword = String(req.query.keyword ?? '').trim();
    if (keyword.length > 100) {
      throw validationError('keyword must be less than or equal to 100 characters');
    }

    const location = String(req.query.location ?? '').trim();
    if (location.length > 255) {
      throw validationError('location must be less than or equal to 255 characters');
    }

    const startDate = parseDate(req.query.startDate, 'startDate');
    const endDate = parseDate(req.query.endDate, 'endDate', true);

    if (startDate && endDate && startDate > endDate) {
      throw validationError('startDate must be before or equal to endDate');
    }

    const availability = req.query.availability;
    if (availability !== undefined && !['AVAILABLE', 'FULL'].includes(availability)) {
      throw validationError('availability must be AVAILABLE or FULL');
    }

    req.validatedQuery = {
      page,
      pageSize,
      keyword: keyword || undefined,
      categoryId: parsePositiveInteger(req.query.categoryId, 'categoryId'),
      skillId: parsePositiveInteger(req.query.skillId, 'skillId'),
      organizationId: parsePositiveInteger(req.query.organizationId, 'organizationId'),
      location: location || undefined,
      startDate,
      endDate,
      availability
    };

    return next();
  } catch (error) {
    const status = error.status || 422;
    return res.status(status).json({
      success: false,
      error: error.message
    });
  }
}

export function validatePublicEventId(req, res, next) {
  try {
    req.validatedParams = {
      id: parsePositiveInteger(req.params.id, 'id')
    };

    return next();
  } catch (error) {
    const status = error.status || 422;
    return res.status(status).json({
      success: false,
      error: error.message
    });
  }
}
