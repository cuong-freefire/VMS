/**
 * Shared Validation Middleware Factory
 *
 * Tạo Express middleware validate req.body bằng Zod schema.
 * Dùng chung cho toàn bộ validator trong dự án.
 *
 * Pattern: validate(Schema)(req, res, next)
 *   - Parse req.body qua Schema
 *   - Nếu fail → 400 JSON với message rõ ràng
 *   - Nếu pass → ghi đè req.body = dữ liệu đã validate/strip
 *
 * Owner: Member 1 - CuongLH
 */

// -----------------------------------------------------------------

/**
 * @param {z.ZodSchema} schema - Zod schema để validate req.body
 * @returns {Function} Express middleware
 */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const messages = result.error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ");

    return res.status(400).json({
      success: false,
      message: messages,
      code: "VALIDATION_ERROR",
      details: null,
    });
  }

  // Ghi đè req.body = dữ liệu đã parse + strip (Zod .strict() tự động bỏ field lạ)
  req.body = result.data;
  next();
};

/**
 * Middleware validate req.query bằng Zod schema.
 * Dùng cho các endpoint có query params cần validate (phân trang, lọc, tìm kiếm).
 *
 * @param {z.ZodSchema} schema - Zod schema để validate req.query
 * @returns {Function} Express middleware
 */
export const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);

  if (!result.success) {
    const messages = result.error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ");

    return res.status(400).json({
      success: false,
      message: messages,
      code: "VALIDATION_ERROR",
      details: null,
    });
  }

  // Express 5.x does not allow reassigning req.query (getter-only).
  // Store validated + coerced query params on req.validatedQuery instead.
  req.validatedQuery = result.data;
  next();
};

/**
 * Middleware validate req.params bằng Zod schema.
 *
 * @param {z.ZodSchema} schema
 * @returns {Function}
 */
export const validateParams = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.params);

  if (!result.success) {
    const messages = result.error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ");

    return res.status(400).json({
      success: false,
      message: messages,
      code: "VALIDATION_ERROR",
      details: null,
    });
  }

  req.validatedParams = result.data;
  next();
};