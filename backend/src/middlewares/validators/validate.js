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
    });
  }

  // Ghi đè req.body = dữ liệu đã parse + strip (Zod .strict() tự động bỏ field lạ)
  req.body = result.data;
  next();
};

/**
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
    });
  }

  // Express 5.x does not allow reassigning req.query (getter-only).
  // Store validated + coerced query params on req.validatedQuery instead.
  req.validatedQuery = result.data;
  next();
};
