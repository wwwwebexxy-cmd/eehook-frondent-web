import { describe, expect, it } from "vitest";

import { buildUsedVariantPayload, getGradeOptions, getOptionGroups } from "./productEditorOptions";

describe("used product editor contract", () => {
    it("sends complete option values and an optional offer price", () => {
        expect(buildUsedVariantPayload({
            product: 7,
            color: 3,
            option_values: {
                storage: "128 GB",
                grade: "A+",
                finishing: "Aluminum",
            },
            price: "1200",
            offer_price: "1100",
            stock: "2",
        })).toMatchObject({
            product: 7,
            color: 3,
            option_values: {
                storage: "128 GB",
                grade: "A+",
                finishing: "Aluminum",
            },
            price: 1200,
            offer_price: 1100,
            stock: 2,
        });
    });

    it("derives option groups from combinations without hardcoded catalog values", () => {
        expect(getOptionGroups([
            { color: { id: 1, name: "Black" }, option_values: { storage: "128 GB", grade: "A+" } },
            { color: { id: 2, name: "Silver" }, option_values: { storage: "256 GB", grade: "A" } },
        ])).toEqual({
            storage: ["128 GB", "256 GB"],
            grade: ["A+", "A"],
        });
    });

    it("keeps unique grade options for the product-level grade dropdown", () => {
        expect(getGradeOptions([
            { option_values: { grade: "Flawless" } },
            { option_values: { grade: "A+" } },
            { option_values: { grade: "Flawless" } },
            { option_values: { storage: "256 GB" } },
        ])).toEqual(["Flawless", "A+"]);
    });
});
