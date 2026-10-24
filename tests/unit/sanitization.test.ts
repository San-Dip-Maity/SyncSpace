import { describe, it, expect } from "vitest";
import { sanitizeContentHtml, sanitizePlainText } from "@/lib/security/sanitize";

describe("HTML Sanitization & XSS Prevention", () => {
  it("strips harmful script tags from HTML", () => {
    const malicious = '<p>Normal text</p><script>alert("hacked")</script>';
    const sanitized = sanitizeContentHtml(malicious);
    expect(sanitized).not.toContain("<script>");
    expect(sanitized).not.toContain("alert");
    expect(sanitized).toContain("<p>Normal text</p>");
  });

  it("strips javascript: link schemes", () => {
    const malicious = '<a href="javascript:alert(1)">Click me</a>';
    const sanitized = sanitizeContentHtml(malicious);
    expect(sanitized).not.toContain("javascript:");
    expect(sanitized).not.toContain("alert(1)");
  });

  it("removes dangerous event handlers (onerror, onload)", () => {
    const malicious = '<img src="invalid.jpg" onerror="alert(document.cookie)" />';
    const sanitized = sanitizeContentHtml(malicious);
    expect(sanitized).not.toContain("onerror");
    expect(sanitized).not.toContain("alert");
  });

  it("preserves valid formatting elements and tables", () => {
    const clean = '<h1>Title</h1><p>Text with <strong>bold</strong> and <em>italic</em></p><table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Cell</td></tr></tbody></table>';
    const sanitized = sanitizeContentHtml(clean);
    expect(sanitized).toContain("<h1>Title</h1>");
    expect(sanitized).toContain("<strong>bold</strong>");
    expect(sanitized).toContain("<table>");
  });

  it("strips all HTML tags in sanitizePlainText", () => {
    const rich = "<b>Bold</b> and <i>italic</i> comment";
    const plain = sanitizePlainText(rich);
    expect(plain).toBe("Bold and italic comment");
  });
});
