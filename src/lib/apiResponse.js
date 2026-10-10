export const HTML_API_RESPONSE_MESSAGE = "The API returned an HTML page instead of JSON. Check the Vercel API rewrite.";

function contentTypeOf(headers) {
    if (typeof headers?.get === "function") {
        return String(headers.get("content-type") || headers.get("Content-Type") || "");
    }

    return String(headers?.["content-type"] || headers?.["Content-Type"] || "");
}

export function isUnexpectedHtmlResponse(response = {}) {
    const contentType = contentTypeOf(response.headers).toLowerCase();
    const body = typeof response.data === "string" ? response.data.trimStart() : "";

    return contentType.includes("text/html") || /^<!doctype\s+html\b|^<html\b/i.test(body);
}

export function assertJsonApiResponse(response) {
    if (!isUnexpectedHtmlResponse(response)) return response;

    const error = new Error(HTML_API_RESPONSE_MESSAGE);
    error.code = "ERR_API_HTML_RESPONSE";
    error.isAxiosError = true;
    error.response = {
        ...response,
        data: { detail: HTML_API_RESPONSE_MESSAGE },
    };
    throw error;
}
