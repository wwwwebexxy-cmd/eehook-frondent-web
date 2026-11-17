const OPTION_KEYS = ["size", "connectivity", "finishing", "storage", "grade"];

export function buildOptionValues(values = {}) {
    if (!values || typeof values !== "object") return {};
    return Object.fromEntries(
        OPTION_KEYS
            .map((key) => [key, String(values[key] ?? "").trim()])
            .filter(([, value]) => value),
    );
}

export function buildUsedVariantPayload(variant = {}) {
    const payload = {
        product: variant.product,
        color: variant.color || null,
        option_values: buildOptionValues(variant.option_values),
        price: Number(variant.price),
        stock: Number(variant.stock),
    };
    if (variant.offer_price !== "" && variant.offer_price !== null && variant.offer_price !== undefined) {
        payload.offer_price = Number(variant.offer_price);
    }
    return payload;
}

export function getOptionGroups(variants = []) {
    return variants.reduce((groups, variant) => {
        Object.entries(buildOptionValues(variant?.option_values)).forEach(([key, value]) => {
            if (!groups[key]) groups[key] = [];
            if (!groups[key].includes(value)) groups[key].push(value);
        });
        return groups;
    }, {});
}
