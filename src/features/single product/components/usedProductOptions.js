const OPTION_ORDER = ["storage", "grade", "size", "connectivity", "finishing"];

export function normalizeOptionValues(values = {}) {
    if (!values || typeof values !== "object") return {};
    return Object.fromEntries(
        OPTION_ORDER
            .map((key) => [key, String(values[key] ?? "").trim()])
            .filter(([, value]) => value),
    );
}

export function getOptionGroups(variants = []) {
    return variants.reduce((groups, variant) => {
        Object.entries(normalizeOptionValues(variant?.option_values)).forEach(([key, value]) => {
            if (!groups[key]) groups[key] = [];
            if (!groups[key].includes(value)) groups[key].push(value);
        });
        return groups;
    }, {});
}

export function findMatchingVariant(variants = [], { colorId, optionValues = {}, preferredId } = {}) {
    const candidates = variants.filter((variant) => colorId == null || variant.color?.id === colorId);
    const normalized = normalizeOptionValues(optionValues);
    const exact = candidates.find((variant) => {
        const current = normalizeOptionValues(variant.option_values);
        return Object.entries(normalized).every(([key, value]) => current[key] === value);
    });
    return candidates.find((variant) => variant.id === preferredId) || exact || candidates[0] || variants[0] || null;
}

export function optionLabel(key) {
    return key === "grade" ? "Condition" : key.charAt(0).toUpperCase() + key.slice(1);
}
