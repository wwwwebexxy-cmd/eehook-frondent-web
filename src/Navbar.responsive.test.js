import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const stylesheet = readFileSync("src/Navbar.css", "utf8");

describe("navbar responsive logo", () => {
    it("hides only the top navbar logo through 860px", () => {
        expect(stylesheet).toMatch(
            /@media\s*\(max-width:\s*860px\)\s*\{[\s\S]*?\.topbar-logo-link\s*\{\s*display:\s*none;\s*\}/,
        );
    });
});
