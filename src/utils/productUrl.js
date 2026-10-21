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
