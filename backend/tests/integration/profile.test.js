import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";

const SECRET = process.env.SECRET_KEY || "test-secret";

function makeToken(userId = 1) {
  return jwt.sign(
    { user_id: userId, email: "test@vms.com", role_id: 2, jti: "test-jti-" + userId },
    SECRET, { expiresIn: "7d" }
  );
}

describe("GET /api/v1/user/me", () => {
  describe("Auth Errors - No valid token (US2, T012)", () => {
    it("should return 401 when no token cookie present", async () => {
      const res = await request(app).get("/api/v1/user/me");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("should return 401 when token is not a valid JWT", async () => {
      const res = await request(app)
        .get("/api/v1/user/me")
        .set("Cookie", "token=not-a-valid-jwt-string");
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("TOKEN_INVALID");
    });

    it("should return 401 when token is expired", async () => {
      const expiredToken = jwt.sign(
        { user_id: 1, email: "test@vms.com" },
        SECRET, { expiresIn: "-1h" }
      );
      const res = await request(app)
        .get("/api/v1/user/me")
        .set("Cookie", "token=" + expiredToken);
      expect(res.status).toBe(401);
    });
  });

  describe("Route Registration and Structure", () => {
    it("should have the endpoint mounted correctly (returns non-404)", async () => {
      const res = await request(app).get("/api/v1/user/me");
      // 401 means route exists but auth required (correct)
      // 404 would mean route not found (incorrect)
      expect(res.status).not.toBe(404);
    });

    it("should reject with invalid token (SC-002 - 100% unauthorized blocked)", async () => {
      const res = await request(app)
        .get("/api/v1/user/me")
        .set("Cookie", "token=invalid");
      expect(res.status).toBe(401);
    });
  });

  describe("Response Format Compliance", () => {
    it("should return standard error response format", async () => {
      const res = await request(app).get("/api/v1/user/me");
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("code");
      expect(res.body).toHaveProperty("details");
    });
  });
});