import { describe, expect, it } from "vitest";
import { getSwipeDirection } from "./heroSwipe";

describe("getSwipeDirection", () => {
    it("returns next for a horizontal left swipe", () => {
        expect(getSwipeDirection({ startX: 220, startY: 40, endX: 120, endY: 44 })).toBe("next");
    });

    it("returns previous for a horizontal right swipe", () => {
        expect(getSwipeDirection({ startX: 120, startY: 40, endX: 220, endY: 44 })).toBe("previous");
    });

    it("ignores short and mostly vertical gestures", () => {
        expect(getSwipeDirection({ startX: 120, startY: 40, endX: 145, endY: 45 })).toBeNull();
        expect(getSwipeDirection({ startX: 120, startY: 40, endX: 180, endY: 130 })).toBeNull();
    });
});
