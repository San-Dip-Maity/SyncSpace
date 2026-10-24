import { describe, it, expect } from "vitest";
import {
  signUpSchema,
  signInSchema,
  workspaceCreateSchema,
  documentCreateSchema,
  documentUpdateSchema,
  shareLinkCreateSchema,
  commentCreateSchema,
} from "@/lib/validation/schemas";

describe("Input Validation Schemas", () => {
  describe("signUpSchema", () => {
    it("validates valid registration input", () => {
      const valid = {
        name: "Alice Smith",
        email: "alice@example.com",
        password: "Password123!",
      };
      const result = signUpSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects weak password lacking numbers or uppercase", () => {
      const invalid = {
        name: "Alice Smith",
        email: "alice@example.com",
        password: "weakpassword",
      };
      const result = signUpSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects invalid email formats", () => {
      const invalid = {
        name: "Alice Smith",
        email: "not-an-email",
        password: "Password123!",
      };
      const result = signUpSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("signInSchema", () => {
    it("validates proper sign-in payload", () => {
      const valid = {
        email: "bob@example.com",
        password: "SecurePassword!",
      };
      const result = signInSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects empty password", () => {
      const invalid = {
        email: "bob@example.com",
        password: "",
      };
      const result = signInSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("workspaceCreateSchema", () => {
    it("validates workspace name and optional slug", () => {
      const valid = {
        name: "Engineering Pod",
        description: "Core platform specs",
      };
      const result = workspaceCreateSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects single character workspace names", () => {
      const invalid = { name: "A" };
      const result = workspaceCreateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("shareLinkCreateSchema", () => {
    it("accepts valid roles and expiration", () => {
      const valid = {
        role: "VIEWER",
        requiresAuth: true,
        expiresInDays: 7,
      };
      const result = shareLinkCreateSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects non-existent roles", () => {
      const invalid = {
        role: "ADMINISTRATOR", // Not a valid document role
      };
      const result = shareLinkCreateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("commentCreateSchema", () => {
    it("rejects empty comment text", () => {
      const invalid = { content: "    " };
      const result = commentCreateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("accepts valid comments with optional parentId", () => {
      const valid = { content: "Looks good to me!" };
      const result = commentCreateSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });
  describe("documentCreateSchema", () => {
    it("validates document creation with defaults", () => {
      const valid = { title: "Design RFC" };
      const result = documentCreateSchema.safeParse(valid);
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe("Design RFC");
    });
  });

  describe("documentUpdateSchema", () => {
    it("validates partial document updates", () => {
      const update = { title: "Renamed Title", isArchived: true };
      const result = documentUpdateSchema.safeParse(update);
      expect(result.success).toBe(true);
    });
  });
});
