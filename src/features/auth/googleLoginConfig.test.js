import { describe, expect, it } from "vitest";
import { GOOGLE_LOGIN_OPTIONS } from "./googleLoginConfig";

describe("Google login button configuration", () => {
    it("uses the popup flow instead of the mobile FedCM button handoff", () => {
        expect(GOOGLE_LOGIN_OPTIONS).toMatchObject({
            ux_mode: "popup",
            use_fedcm_for_button: false,
        });
    });
});
