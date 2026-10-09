import { afterEach, describe, expect, it } from "vitest";
import { clearAuthSession, getAuthValue, hasAuthSession, saveAuthSession } from "./authUtils";

afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
});

describe("auth session storage", () => {
    it("keeps credentials in per-tab session storage and removes legacy local storage credentials", () => {
        localStorage.setItem("access", "legacy-token");

        saveAuthSession({ user: { id: 12, email: "customer@example.com", first_name: "Sam", role: "Customer" } });

        expect(hasAuthSession()).toBe(true);
        expect(getAuthValue("email")).toBe("customer@example.com");
        expect(localStorage.getItem("access")).toBeNull();
        expect(sessionStorage.getItem("refresh_token")).toBeNull();
    });

    it("clears both current and legacy credential stores during logout", () => {
        saveAuthSession({ user: { id: 12, role: "Customer" } });
        localStorage.setItem("refresh", "legacy-refresh-token");

        clearAuthSession();

        expect(hasAuthSession()).toBe(false);
        expect(sessionStorage.getItem("access_token")).toBeNull();
        expect(localStorage.getItem("refresh")).toBeNull();
    });
});
