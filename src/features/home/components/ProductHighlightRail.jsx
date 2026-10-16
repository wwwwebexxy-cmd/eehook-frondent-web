import { useEffect, useMemo, useState } from "react";
import { FiActivity, FiBox, FiClock, FiShield, FiStar, FiTag, FiTruck, FiZap } from "react-icons/fi";

const ICONS = {
    tag: FiTag,
    clock: FiClock,
    truck: FiTruck,
    zap: FiZap,
    fire: FiActivity,
    shield: FiShield,
    sparkles: FiStar,
    box: FiBox,
    star: FiStar,
};

function formatRemaining(endsAt, now) {
    const remainingSeconds = Math.max(0, Math.ceil((new Date(endsAt).getTime() - now) / 1000));
    if (remainingSeconds < 60) return "LESS THAN 1 MINUTE";

    const totalMinutes = Math.ceil(remainingSeconds / 60);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;
    const parts = [];
    if (days) parts.push(`${days} DAY${days === 1 ? "" : "S"}`);
    if (hours) parts.push(`${hours} HOUR${hours === 1 ? "" : "S"}`);
    if (minutes && parts.length < 2) parts.push(`${minutes} MINUTE${minutes === 1 ? "" : "S"}`);
    return parts.join(" ") || "LESS THAN 1 MINUTE";
}

export default function ProductHighlightRail({ highlights = [] }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [now, setNow] = useState(() => Date.now());
    const items = useMemo(() => (Array.isArray(highlights) ? highlights : []).filter((item) => {
        if (item?.is_active === false) return false;
        if (item?.highlight_type !== "countdown" || !item?.ends_at) return true;
        return new Date(item.ends_at).getTime() > now;
    }), [highlights, now]);
    const current = items.length ? items[activeIndex % items.length] : null;
    const hasCountdown = items.some((item) => item?.highlight_type === "countdown" && item?.ends_at);

    useEffect(() => {
        setActiveIndex((index) => (items.length ? index % items.length : 0));
    }, [items.length]);

    useEffect(() => {
        if (!hasCountdown) return undefined;
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [hasCountdown]);

    useEffect(() => {
        if (!current || items.length < 2) return undefined;
        const seconds = Math.max(2, Number(current.rotation_seconds) || 4);
        const timer = window.setTimeout(() => setActiveIndex((index) => (index + 1) % items.length), seconds * 1000);
        return () => window.clearTimeout(timer);
    }, [current?.id, current?.rotation_seconds, items.length]);

    if (!current) return null;

    const Icon = ICONS[current.icon_key] || FiTag;
    const countdown = current.highlight_type === "countdown" && current.ends_at
        ? formatRemaining(current.ends_at, now)
        : "";
    const label = countdown ? `${current.text} ${countdown}` : current.text;

    return (
        <div className="product-highlight-rail" aria-live="polite" aria-atomic="true">
            <span className="product-highlight-icon" aria-hidden="true"><Icon /></span>
            <span className="product-highlight-label">{label}</span>
        </div>
    );
}
