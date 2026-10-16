import { useEffect, useMemo, useState } from "react";

function formatRemaining(endsAt, now) {
    const remainingSeconds = Math.max(0, Math.ceil((new Date(endsAt).getTime() - now) / 1000));
    if (remainingSeconds < 60) return "LESS THAN 1 MINUTE";

    const totalMinutes = Math.ceil(remainingSeconds / 60);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;
    const parts = [];
    if (days) parts.push(`${days} DAY${days === 1 ? "" : "S"}`);
    if (hours && parts.length < 2) parts.push(`${hours} HOUR${hours === 1 ? "" : "S"}`);
    if (minutes && parts.length < 2) parts.push(`${minutes} MINUTE${minutes === 1 ? "" : "S"}`);
    return parts.join(" ") || "LESS THAN 1 MINUTE";
}

export default function ProductMessageRail({ messages = [] }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [now, setNow] = useState(() => Date.now());
    const items = useMemo(() => (Array.isArray(messages) ? messages : []).filter((item) => {
        if (item?.is_active === false) return false;
        if (item?.message_type !== "countdown" || !item?.ends_at) return true;
        return new Date(item.ends_at).getTime() > now;
    }), [messages, now]);
    const current = items.length ? items[activeIndex % items.length] : null;
    const hasCountdown = items.some((item) => item?.message_type === "countdown" && item?.ends_at);
    const currentId = current?.id;
    const rotationSeconds = Math.max(2, Number(current?.rotation_seconds) || 4);

    useEffect(() => {
        if (!hasCountdown) return undefined;
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [hasCountdown]);

    useEffect(() => {
        if (!currentId || items.length < 2) return undefined;
        const timer = window.setTimeout(() => setActiveIndex((index) => (index + 1) % items.length), rotationSeconds * 1000);
        return () => window.clearTimeout(timer);
    }, [currentId, items.length, rotationSeconds]);

    if (!current) return null;

    const backgroundColor = /^#[0-9A-Fa-f]{6}$/.test(current.background_color || "")
        ? current.background_color
        : "#EAF4FF";
    const countdown = current.message_type === "countdown" && current.ends_at
        ? formatRemaining(current.ends_at, now)
        : "";
    const label = countdown ? `${current.text} ${countdown}` : current.text;

    return (
        <div className="product-message-rail" style={{ "--product-message-bg": backgroundColor }} aria-live="polite" aria-atomic="true">
            <span className="product-message-label">{label}</span>
        </div>
    );
}
