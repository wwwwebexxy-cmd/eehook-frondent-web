import { useEffect, useRef, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

const GOOGLE_BUTTON_FALLBACK_DELAY = 2500;

function GoogleAuthButton(props) {
    const containerRef = useRef(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return undefined;

        let fallbackTimer;
        let observedFrame;

        const reveal = () => setReady(true);
        const watchFrame = () => {
            const frame = container.querySelector("iframe");
            if (!frame || frame === observedFrame) return;

            observedFrame = frame;
            frame.addEventListener("load", reveal, { once: true });
            fallbackTimer = window.setTimeout(reveal, GOOGLE_BUTTON_FALLBACK_DELAY);
        };

        const observer = new MutationObserver(watchFrame);
        observer.observe(container, { childList: true, subtree: true });
        watchFrame();

        return () => {
            observer.disconnect();
            window.clearTimeout(fallbackTimer);
        };
    }, []);

    return (
        <div ref={containerRef} className={`google-btn${ready ? " is-ready" : ""}`}>
            <GoogleLogin
                {...props}
                containerProps={{ className: "google-rendered-button" }}
            />
        </div>
    );
}

export default GoogleAuthButton;
