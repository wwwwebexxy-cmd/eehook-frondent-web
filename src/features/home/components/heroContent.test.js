import { describe, expect, it } from "vitest";
import { normalizeBannerList, resolveBannerList } from "./heroContent";

describe("hero content", () => {
    it("does not create a synthetic banner when the API returns no banners", () => {
        expect(resolveBannerList({ provided: [], fetched: [] })).toEqual([]);
        expect(resolveBannerList({ fetched: undefined })).toEqual([]);
    });

    it("keeps only banners with an image", () => {
        expect(normalizeBannerList({ results: [{ id: 1, image: "hero.jpg" }, { id: 2 }] })).toEqual([
            { id: 1, image: "hero.jpg" },
        ]);
    });
});
