import { useEffect, useRef, useState } from "react";

const DEFAULT_ROOT_MARGIN = "400px 0px";

function DeferredHomepageSection({
    children,
    minHeight = 360,
    rootMargin = DEFAULT_ROOT_MARGIN,
}) {
    const sectionRef = useRef(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const element = sectionRef.current;
        const Observer = typeof window !== "undefined" ? window.IntersectionObserver : undefined;
        if (!element || typeof Observer === "undefined") {
            setIsReady(true);
            return undefined;
        }

        const observer = new Observer(([entry]) => {
            if (!entry?.isIntersecting) return;
            setIsReady(true);
            observer.disconnect();
        }, { rootMargin });

        observer.observe(element);
        return () => observer.disconnect();
    }, [rootMargin]);

    return (
        <div
            ref={sectionRef}
            className="homepage-deferred-section"
            aria-busy={!isReady}
            style={isReady ? undefined : { minHeight }}
        >
            {isReady ? children : <div className="homepage-deferred-skeleton skeleton" aria-hidden="true" />}
        </div>
    );
}

export default DeferredHomepageSection;
