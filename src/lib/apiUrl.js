const configuredApiUrl = String(import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");

if (!configuredApiUrl) {
    throw new Error("VITE_API_URL must be configured.");
}

const isRelativeApiUrl = configuredApiUrl.startsWith("/");
if (isRelativeApiUrl && import.meta.env.PROD) {
    throw new Error("Production builds must use an absolute HTTPS API origin.");
}

const parsedApiUrl = isRelativeApiUrl ? null : new URL(configuredApiUrl);

// Local HTTP is acceptable only while both the storefront and API are local.
// A secure storefront must never attempt to send credentials to an HTTP API.
if (import.meta.env.PROD && parsedApiUrl?.protocol !== "https:") {
    throw new Error("Production builds must use an HTTPS API origin.");
}
if (typeof window !== "undefined" && window.location.protocol === "https:" && parsedApiUrl && parsedApiUrl.protocol !== "https:") {
    throw new Error("VITE_API_URL must use HTTPS when the storefront uses HTTPS.");
}

export const API_URL = isRelativeApiUrl ? configuredApiUrl : parsedApiUrl.toString().replace(/\/$/, "");
