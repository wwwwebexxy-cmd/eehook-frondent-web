import { describe, expect, it } from "vitest";
import { assertJsonApiResponse, HTML_API_RESPONSE_MESSAGE, isUnexpectedHtmlResponse } from "./apiResponse";

describe("API response validation", () => {
    it("detects HTML returned from a misrouted API request", () => {
        expect(isUnexpectedHtmlResponse({ headers: { "content-type": "text/html; charset=utf-8" }, data: "<!doctype html><html>" })).toBe(true);
        expect(() => assertJsonApiResponse({ status: 200, headers: { "content-type": "text/html" }, data: "<html>" })).toThrow(HTML_API_RESPONSE_MESSAGE);
    });

    it("allows JSON API responses", () => {
        const response = { status: 200, headers: { "content-type": "application/json" }, data: { results: [] } };
        expect(assertJsonApiResponse(response)).toBe(response);
    });
});
