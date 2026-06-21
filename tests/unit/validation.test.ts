import { describe, it, expect } from "vitest";
import {
  isValidEmail,
  isValidHttpUrl,
  MAX_URL_LENGTH,
} from "../../shared/validation";

describe("isValidEmail", () => {
  it("accepts normal addresses", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("first.last@example.com")).toBe(true);
  });

  it("rejects malformed addresses", () => {
    expect(isValidEmail("no-at-sign")).toBe(false);
    expect(isValidEmail("missing@domain")).toBe(false);
    expect(isValidEmail("@example.com")).toBe(false);
  });

  it("rejects internal whitespace / CRLF (header-injection guard)", () => {
    expect(isValidEmail("a b@example.com")).toBe(false);
    expect(isValidEmail("a@exa mple.com")).toBe(false);
    // An embedded newline can't smuggle a header — the internal \n fails the regex.
    expect(isValidEmail("a@example.com\nBcc: evil@x.com")).toBe(false);
  });

  it("trims surrounding whitespace (callers use the trimmed value)", () => {
    expect(isValidEmail("  a@example.com  ")).toBe(true);
    expect(isValidEmail("a@example.com\n")).toBe(true);
  });

  it("rejects over-long addresses and nullish input", () => {
    expect(isValidEmail(`${"x".repeat(255)}@e.com`)).toBe(false);
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
  });
});

describe("isValidHttpUrl", () => {
  it("accepts http and https", () => {
    expect(isValidHttpUrl("http://example.com")).toBe(true);
    expect(isValidHttpUrl("https://example.com/path?q=1")).toBe(true);
  });

  it("trims surrounding whitespace before validating", () => {
    expect(isValidHttpUrl("  https://example.com  ")).toBe(true);
  });

  it("rejects non-http schemes, empty, and nullish input", () => {
    expect(isValidHttpUrl("ftp://example.com")).toBe(false);
    expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isValidHttpUrl("")).toBe(false);
    expect(isValidHttpUrl(null)).toBe(false);
    expect(isValidHttpUrl(undefined)).toBe(false);
  });

  it("enforces MAX_URL_LENGTH (B3 abuse guard)", () => {
    const atLimit = "https://e.com/" + "a".repeat(MAX_URL_LENGTH - 14);
    expect(atLimit.length).toBe(MAX_URL_LENGTH);
    expect(isValidHttpUrl(atLimit)).toBe(true);
    expect(isValidHttpUrl(atLimit + "a")).toBe(false);
  });
});
