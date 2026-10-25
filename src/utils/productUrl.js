export function slugifyProductName(name) {
    const slug = String(name || "product")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, "");

    return slug || "product";
}

export function getProductDetailsPath(productOrName, productId) {
    const product = productOrName && typeof productOrName === "object" ? productOrName : null;
    const name = product?.name ?? productOrName;
    const id = product?.id ?? product?.pk ?? product?.uuid ?? productId;

    if (id === null || id === undefined || id === "") return "/shop";

    return `/single/${encodeURIComponent(slugifyProductName(name))}/${encodeURIComponent(String(id))}/p`;
}

function addSelectionParam(params, key, value) {
    if (value === null || value === undefined || value === "") return;
    params.set(key, String(value));
}

export function getProductSelectionPath(productOrName, selection = {}) {
    const basePath = getProductDetailsPath(productOrName);
    const params = new URLSearchParams();

    addSelectionParam(params, "variant", selection.variantId ?? selection.variant);
    addSelectionParam(params, "size", selection.sizeId ?? selection.size);

    const colorSlug = selection.color ? slugifyProductName(selection.color) : "";
    const storageSlug = selection.storage ? slugifyProductName(selection.storage) : "";
    let selectionPath = basePath;

    if (colorSlug && storageSlug) {
        selectionPath = `${basePath}/${encodeURIComponent(colorSlug)}/${encodeURIComponent(storageSlug)}`;
    } else if (colorSlug) {
        selectionPath = `${basePath}/${encodeURIComponent(colorSlug)}`;
    } else if (storageSlug) {
        selectionPath = `${basePath}/storage/${encodeURIComponent(storageSlug)}`;
    }

    const query = params.toString();
    return query ? `${selectionPath}?${query}` : selectionPath;
}
