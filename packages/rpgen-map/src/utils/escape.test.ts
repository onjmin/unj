import { describe, expect, test } from "vitest";
import { escapeMetaChars, unescapeMetaChars } from "@/utils/escape.js";

describe("escapeMetaChars()", () => {
  test("Special characters must be escaped", () =>
    expect(escapeMetaChars("#Hello, world!")).toBe("[#]Hello[、] world!"));
});

describe("unescapeMetaChars()", () => {
  test("Escaped characters can be unescaped", () => {
    const escaped = escapeMetaChars("#Hello, world!");

    expect(unescapeMetaChars(escaped)).toBe("#Hello, world!");
  });
});
