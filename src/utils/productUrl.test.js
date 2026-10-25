import { describe, expect, it } from "vitest";
import { getProductDetailsPath, getProductSelectionPath } from "./productUrl";

describe("product URLs", () => {
    it("keeps the readable product URL stable without a selection", () => {
        expect(getProductDetailsPath({ id: 42, name: "MacBook Air 2026" }))
            .toBe("/single/macbook-air-2026/42/p");
    });

    it("adds variant, color, and storage details to a shareable URL", () => {
        expect(getProductSelectionPath({ id: 42, name: "MacBook Air 2026" }, {
            variantId: 7,
            sizeId: 12,
            color: "Midnight Blue",
            storage: "512 GB",
        })).toBe("/single/macbook-air-2026/42/p/midnight-blue/512-gb?variant=7&size=12");
    });
});
