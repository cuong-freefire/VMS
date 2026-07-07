/**
 * Integration Test: PATCH /api/v1/user/me — Text update (UC19 US1)
 *
 * Owner: Member 1 - CuongLH
 * Module: Profile Management
 */

import request from "supertest";
import app from "../../src/app.js";

describe("PATCH /api/v1/user/me — Text update", () => {
  let authCookie;

  beforeAll(async () => {
    // Đăng nhập để lấy cookie JWT
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "volunteer@test.com", password: "Test@123" });

    authCookie = loginRes.headers["set-cookie"];
  });

  it("should update full_name successfully (200)", async () => {
    const res = await request(app)
      .patch("/api/v1/user/me")
      .set("Cookie", authCookie)
      .send({ full_name: "Nguyễn Văn Updated" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.full_name).toBe("Nguyễn Văn Updated");
  });

  it("should update phone_number successfully (200)", async () => {
    const res = await request(app)
      .patch("/api/v1/user/me")
      .set("Cookie", authCookie)
      .send({ phone_number: "0987654321" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.phone_number).toBe("0987654321");
  });

  it("should update both full_name and phone_number (200)", async () => {
    const res = await request(app)
      .patch("/api/v1/user/me")
      .set("Cookie", authCookie)
      .send({ full_name: "Nguyễn Văn Both", phone_number: "0912345678" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.full_name).toBe("Nguyễn Văn Both");
    expect(res.body.data.phone_number).toBe("0912345678");
  });

  it("should return 200 with no changes for empty body", async () => {
    const res = await request(app)
      .patch("/api/v1/user/me")
      .set("Cookie", authCookie)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should return 400 for invalid full_name (quá ngắn)", async () => {
    const res = await request(app)
      .patch("/api/v1/user/me")
      .set("Cookie", authCookie)
      .send({ full_name: "A" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 for invalid phone_number", async () => {
    const res = await request(app)
      .patch("/api/v1/user/me")
      .set("Cookie", authCookie)
      .send({ phone_number: "123" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 401 for unauthenticated request", async () => {
    const res = await request(app)
      .patch("/api/v1/user/me")
      .send({ full_name: "Test" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should ignore unknown fields sent by client", async () => {
    const res = await request(app)
      .patch("/api/v1/user/me")
      .set("Cookie", authCookie)
      .send({ full_name: "Valid Name", email: "hacked@evil.com", password: "secret" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
