import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const stylesheet = readFileSync("src/features/Dasboard/styles/VariantResponsive.css", "utf8");

describe("multiple-price unit row layout", () => {
    it("reserves a full-width grid column for stock and the delete action", () => {
        expect(stylesheet).toMatch(
            /\.product-editor-page \.editor-unit-main-row\s*\{[\s\S]*?grid-template-columns:\s*minmax\(140px, 1fr\)\s*minmax\(140px, 1fr\)\s*minmax\(180px, 1\.2fr\)\s*minmax\(115px, \.9fr\)\s*minmax\(140px, 1\.05fr\)\s*minmax\(120px, \.85fr\)\s*38px;/,
        );
    });

    it("keeps the delete action inside the two-column mobile layout", () => {
        expect(stylesheet).toMatch(
            /@media \(max-width: 760px\) \{[\s\S]*?\.product-editor-page \.editor-unit-main-row[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);[\s\S]*?\.product-editor-page \.editor-unit-sku-hint-row[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);[\s\S]*?\.product-editor-page \.editor-unit-main-row \.table-icon[\s\S]*?grid-column: 2;/,
        );
    });
});
