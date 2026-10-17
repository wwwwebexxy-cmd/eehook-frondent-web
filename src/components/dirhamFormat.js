export function formatDirhamValue(value, { useGrouping = false, minimumFractionDigits = 2, maximumFractionDigits = 2 } = {}) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return null;
    return Math.abs(numericValue).toLocaleString("en-AE", {
        useGrouping,
        minimumFractionDigits,
        maximumFractionDigits,
    });
}
