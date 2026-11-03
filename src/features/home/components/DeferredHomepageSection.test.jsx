import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import DeferredHomepageSection from "./DeferredHomepageSection";

describe("DeferredHomepageSection", () => {
    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
        delete window.IntersectionObserver;
    });

    it("renders content immediately when IntersectionObserver is unavailable", () => {
        vi.stubGlobal("IntersectionObserver", undefined);
        Object.defineProperty(window, "IntersectionObserver", {
            configurable: true,
            writable: true,
            value: undefined,
        });

        render(
            <DeferredHomepageSection>
                <p>Deferred content</p>
            </DeferredHomepageSection>,
        );

        expect(screen.getByText("Deferred content")).toBeInTheDocument();
    });

    it("waits until the section is near the viewport", async () => {
        let observerCallback;
        const disconnect = vi.fn();
        class MockIntersectionObserver {
            constructor(callback) {
                observerCallback = callback;
            }

            observe() {}
            disconnect() {
                disconnect();
            }
        }
        vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
        Object.defineProperty(window, "IntersectionObserver", {
            configurable: true,
            writable: true,
            value: MockIntersectionObserver,
        });
        window.IntersectionObserver = MockIntersectionObserver;

        render(
            <DeferredHomepageSection>
                <p>Deferred content</p>
            </DeferredHomepageSection>,
        );

        expect(window.IntersectionObserver).toBe(MockIntersectionObserver);
        expect(observerCallback).toBeDefined();
        expect(screen.queryByText("Deferred content")).not.toBeInTheDocument();
        observerCallback([{ isIntersecting: true }]);

        await waitFor(() => expect(screen.getByText("Deferred content")).toBeInTheDocument());
        expect(disconnect).toHaveBeenCalled();
    });
});
