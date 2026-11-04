import { describe, expect, it } from "vitest";
import { removeLightBackgroundFromPixels } from "./transparentProductImage";

describe("removeLightBackgroundFromPixels", () => {
    it("makes edge-connected light background transparent and preserves the product", () => {
        const pixels = new Uint8ClampedArray(3 * 3 * 4).fill(255);
        pixels.set([0, 0, 0, 255], 16);

        removeLightBackgroundFromPixels(pixels, 3, 3);

        expect(pixels[3]).toBe(0);
        expect(pixels[7]).toBe(0);
        expect(pixels[11]).toBe(0);
        expect(pixels[15]).toBe(0);
        expect(pixels[19]).toBe(255);
        expect(pixels[23]).toBe(0);
        expect(pixels[27]).toBe(0);
        expect(pixels[31]).toBe(0);
        expect(pixels[35]).toBe(0);
    });
});
