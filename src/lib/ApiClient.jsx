import axios from "axios";
import { clearAuthSession } from "../features/auth/authUtils";
import showToast from "../utils/toast";
import { API_URL } from "./apiUrl";

let refreshPromise = null;
let csrfPromise = null;
let csrfToken = "";

function redirectToLogin() {
    clearAuthSession();
    const normalizedPath = window.location.pathname.toLowerCase();
    const isOrderDashboardPath = normalizedPath.startsWith("/eehook-dashboard") || normalizedPath.startsWith("/order-dashboard") || normalizedPath.startsWith("/orderdashboard");
    const path = isOrderDashboardPath ? "/eehook-dashboard/admin-login" : "/login";
    if (window.location.pathname !== path) window.location.href = path;
}

export function getRetryAfterSeconds(error, fallback = 60) {
    const raw = error?.response?.headers?.["retry-after"] ?? error?.response?.headers?.["Retry-After"];
    const seconds = Number(raw);
    return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : fallback;
}

function isAuthRequest(config = {}) {
    return /(?:^|\/)login\/?$|google-login|token\/refresh|logout/.test(String(config.url || ""));
}

function readCookie(name) {
    if (typeof document === "undefined") return "";
    const encodedName = `${encodeURIComponent(name)}=`;
    const cookie = document.cookie.split("; ").find((entry) => entry.startsWith(encodedName));
    return cookie ? decodeURIComponent(cookie.slice(encodedName.length)) : "";
}

export async function ensureCsrf() {
    const current = csrfToken || readCookie("csrftoken");
    if (current) return current;
    if (!csrfPromise) {
        csrfPromise = axios.get(`${API_URL}/auth/csrf/`, { withCredentials: true })
            .then((response) => {
                csrfToken = response.data?.csrfToken || readCookie("csrftoken");
                return csrfToken;
            })
            .finally(() => { csrfPromise = null; });
    }
    return csrfPromise;
}

async function refreshAccessToken() {
    if (!refreshPromise) {
        refreshPromise = ensureCsrf()
            .then((csrfToken) => axios.post(
                `${API_URL}/token/refresh/`,
                {},
                { withCredentials: true, headers: csrfToken ? { "X-CSRFToken": csrfToken } : {} },
            ))
            .finally(() => { refreshPromise = null; });
    }

    return refreshPromise;
}

const client = axios.create({ baseURL: `${API_URL}/`, withCredentials: true });

client.interceptors.request.use(async (config) => {
    const method = String(config.method || "get").toUpperCase();
    if (!["GET", "HEAD", "OPTIONS", "TRACE"].includes(method)) {
        const csrfToken = await ensureCsrf();
        config.headers = config.headers || {};
        if (csrfToken) config.headers["X-CSRFToken"] = csrfToken;
    }
    if (config.headers?.Authorization) delete config.headers.Authorization;
    return config;
});

client.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config || {};
        const status = error.response?.status;

        if (status === 429) {
            const retryAfter = getRetryAfterSeconds(error);
            window.dispatchEvent(new CustomEvent("api:rate-limited", { detail: { retryAfter } }));
            if (!isAuthRequest(originalRequest)) {
                showToast.warning(`Too many requests. Please try again after ${retryAfter} seconds.`);
            }
            return Promise.reject(error);
        }

        if (status === 401 && !originalRequest._retry && !originalRequest.skipAuthRefresh && !isAuthRequest(originalRequest)) {
            originalRequest._retry = true;
            try {
                await refreshAccessToken();
                return client(originalRequest);
            } catch (refreshError) {
                redirectToLogin();
                return Promise.reject(refreshError);
            }
        }

        if (status === 403) window.dispatchEvent(new CustomEvent("api:forbidden"));
        if (status === 401 && !originalRequest.skipAuthRedirect) redirectToLogin();
        return Promise.reject(error);
    }
);

export async function logoutSession() {
    try {
        await client.post("logout/", {}, { skipAuthRefresh: true });
    } catch {
        // Local credentials are cleared even when the server cannot be reached.
    } finally {
        clearAuthSession();
    }
}

export default client;
