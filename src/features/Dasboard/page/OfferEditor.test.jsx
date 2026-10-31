import { describe, expect, it } from "vitest";
import { variantOptionMeta } from "../utils/offerVariantLabels";

describe("offer variant labels", () => {
    it("shows units for multiple-price variants", () => {
        expect(variantOptionMeta(
            { id: 7, price_type: "multiple" },
            [{ variant: 7, unit: 12 }, { variant: 7, unit: 13 }],
            [{ id: 12, name: "128 GB" }, { id: 13, name: "256 GB" }],
        )).toBe("Units: 128 GB, 256 GB");
    });

    it("shows the price for single-price variants", () => {
        expect(variantOptionMeta({ id: 8, price_type: "single", price: "1299" })).toBe("Price: AED 1,299.00");
    });
});
