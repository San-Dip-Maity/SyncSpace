import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/security/rate-limit";

describe("Sliding-Window Rate Limiter", () => {
  it("permits requests within allowed quota", async () => {
    const key = "test-client-allowed";
    const res1 = await rateLimit(key, { limit: 3, windowMs: 1000 });
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = await rateLimit(key, { limit: 3, windowMs: 1000 });
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);
  });

  it("blocks requests once quota is exceeded", async () => {
    const key = "test-client-blocked";
    await rateLimit(key, { limit: 2, windowMs: 1000 });
    await rateLimit(key, { limit: 2, windowMs: 1000 });

    const blocked = await rateLimit(key, { limit: 2, windowMs: 1000 });
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetInSeconds).toBeGreaterThan(0);
  });
});
