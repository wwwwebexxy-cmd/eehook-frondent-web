import "./DirhamAmount.css";
import { formatDirhamValue } from "./dirhamFormat";

function DirhamSymbol({ className = "" }) {
    return (
        <svg
            className={`currency-symbol ${className}`.trim()}
            viewBox="8 15 112 98"
            role="img"
            aria-label="UAE dirham"
            focusable="false"
        >
            <path
                fill="currentColor"
                fillRule="evenodd"
                d="M20 15h42c26 0 43 20 43 49s-17 49-43 49H20V15Zm16 15v68h25c18 0 28-13 28-34S79 30 61 30H36Z"
            />
            <rect fill="currentColor" x="8" y="47" width="112" height="14" rx="7" />
            <rect fill="currentColor" x="8" y="72" width="112" height="14" rx="7" />
        </svg>
    );
}

export default function DirhamAmount({
    value,
    className = "",
    fallback = "—",
    useGrouping = false,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
}) {
    const formattedValue = formatDirhamValue(value, { useGrouping, minimumFractionDigits, maximumFractionDigits });
    if (formattedValue === null) return <span className={className}>{fallback}</span>;

    const numericValue = Number(value);
    return (
        <span className={`dirham-amount ${className}`.trim()}>
            {numericValue < 0 && <span className="dirham-amount-sign">−</span>}
            <DirhamSymbol />
            <span className="dirham-amount-value">{formattedValue}</span>
        </span>
    );
}
