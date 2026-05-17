const request = require("supertest");
const app = require("../server");

describe("Health API", () => {
  it("should return 200 OK and status JSON", async () => {
    const res = await request(app).get("/api/health");
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("TechMinds backend is running.");
  });

  it("should return 404 for unknown routes", async () => {
    const res = await request(app).get("/api/some-unknown-route");
    
    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toContain("Not Found");
  });
});
