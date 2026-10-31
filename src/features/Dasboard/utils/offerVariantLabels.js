import { formatDirhamValue } from "../../../components/dirhamFormat";

const idOf = (value) => value?.id ?? value?.pk ?? value?.uuid ?? value;

function unitLabel(variantUnit, units = []) {
    const unit = typeof variantUnit?.unit === "object"
        ? variantUnit.unit
        : units.find((item) => String(idOf(item)) === String(variantUnit?.unit));
    return unit?.name || (variantUnit?.unit ? `Unit #${idOf(variantUnit.unit)}` : "");
}

export function variantOptionMeta(variant, variantUnits = [], units = []) {
    if (variant?.price_type === "multiple") {
        const labels = variantUnits
            .filter((item) => String(idOf(item.variant)) === String(idOf(variant)))
            .map((item) => unitLabel(item, units))
            .filter(Boolean);
        return labels.length ? `Units: ${labels.join(", ")}` : "Multiple-price units";
    }

    const formattedPrice = formatDirhamValue(variant?.price, { useGrouping: true });
    return formattedPrice === null ? "Single price" : `Price: AED ${formattedPrice}`;
}
