import { describe, expect, it } from "vitest";
import { findMatchingVariant, getOptionGroups, optionLabel } from "./usedProductOptions";

describe("used product option matching", () => {
    const variants = [
        { id: 1, color: { id: 10 }, option_values: { storage: "128 GB", grade: "A+" } },
        { id: 2, color: { id: 10 }, option_values: { storage: "256 GB", grade: "A" } },
    ];

    it("groups values and labels grade as condition", () => {
        expect(getOptionGroups(variants)).toEqual({ storage: ["128 GB", "256 GB"], grade: ["A+", "A"] });
        expect(optionLabel("grade")).toBe("Condition");
    });

    it("finds the exact combination instead of the first same-color variant", () => {
        expect(findMatchingVariant(variants, { colorId: 10, optionValues: { storage: "256 GB", grade: "A" } }).id).toBe(2);
    });

    it("supports standard product option combinations too", () => {
        const standardVariants = [
            { id: 3, color: { id: 20 }, option_values: { size: "42mm", connectivity: "GPS" } },
            { id: 4, color: { id: 20 }, option_values: { size: "46mm", connectivity: "GPS + Cellular" } },
        ];

        expect(getOptionGroups(standardVariants)).toEqual({
            size: ["42mm", "46mm"],
            connectivity: ["GPS", "GPS + Cellular"],
        });
        expect(findMatchingVariant(standardVariants, {
            colorId: 20,
            optionValues: { size: "46mm", connectivity: "GPS + Cellular" },
        }).id).toBe(4);
    });
});
