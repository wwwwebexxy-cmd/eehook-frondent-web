const FALLBACK_DESCRIPTION = "Discover this product at EEHOOK.";

function slugify(value) {
    return String(value || "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, "");
}

function firstQueryValue(value) {
    return Array.isArray(value) ? value[0] : value;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function absoluteUrl(value, origin) {
    if (!value) return `${origin}/eehook.jpeg`;
    try {
        const normalized = String(value).startsWith("/media/")
            ? `/backend${value}`
            : String(value).startsWith("media/")
                ? `/backend/${value}`
                : value;
        return new URL(normalized, origin).href;
    } catch {
        return `${origin}/eehook.jpeg`;
    }
}

function storageRecord(variant, sizeId, storageSlug) {
    const sizes = Array.isArray(variant?.sizes) ? variant.sizes : [];
    if (sizeId) {
        const selected = sizes.find((item) => String(item.id) === String(sizeId));
        if (selected) return selected;
    }
    if (storageSlug) {
        const selected = sizes.find((item) => slugify(storageLabel(item)) === String(storageSlug));
        if (selected) return selected;
    }
    return sizes.find((item) => item.unit || item.size) || sizes[0] || null;
}

function storageLabel(size) {
    return size?.unit?.name || size?.size?.name || size?.unit || size?.size || "";
}

function selectedVariant(product, variantId, colorSlug) {
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    return variants.find((variant) => String(variant.id) === String(variantId))
        || variants.find((variant) => colorSlug && slugify(variant.color?.name) === String(colorSlug))
        || variants[0]
        || null;
}

function selectedImage(variant) {
    const images = Array.isArray(variant?.images) ? variant.images : [];
    return images.find((image) => image.is_primary)?.image || images[0]?.image || "";
}

export default async function handler(request, response) {
    const protocol = firstQueryValue(request.headers["x-forwarded-proto"]) || "https";
    const host = request.headers.host;
    const origin = `${protocol}://${host}`;
    const id = firstQueryValue(request.query?.id);
    const slug = firstQueryValue(request.query?.slug) || "product";
    const variantId = firstQueryValue(request.query?.variant);
    const sizeId = firstQueryValue(request.query?.size);
    const colorSlug = firstQueryValue(request.query?.color);
    const storageSlug = firstQueryValue(request.query?.storage);

    if (!id) {
        response.status(400).send("Product id is required.");
        return;
    }

    let selectionPath = `/single/${encodeURIComponent(slug)}/${encodeURIComponent(id)}/p`;
    if (colorSlug && storageSlug) {
        selectionPath += `/${encodeURIComponent(colorSlug)}/${encodeURIComponent(storageSlug)}`;
    } else if (colorSlug) {
        selectionPath += `/${encodeURIComponent(colorSlug)}`;
    } else if (storageSlug) {
        selectionPath += `/storage/${encodeURIComponent(storageSlug)}`;
    }
    const canonicalUrl = new URL(selectionPath, origin);
    if (variantId) canonicalUrl.searchParams.set("variant", variantId);
    if (sizeId) canonicalUrl.searchParams.set("size", sizeId);

    let product = null;
    try {
        const apiUrl = new URL(`/backend/product/${encodeURIComponent(id)}/`, origin);
        const productResponse = await fetch(apiUrl, {
            headers: {
                Accept: "application/json",
                "User-Agent": "EEHOOK social preview renderer",
            },
        });

        if (productResponse.ok) {
            product = await productResponse.json();
        }
    } catch {
        // Return a valid preview even if the API is temporarily unavailable.
    }

    const variant = selectedVariant(product, variantId, colorSlug);
    const size = storageRecord(variant, sizeId, storageSlug);
    const color = variant?.color?.name || colorSlug || "";
    const storage = storageLabel(size) || storageSlug || "";
    const selection = [color, storage].filter(Boolean).join(" · ");
    const title = `${product?.name || "EEHOOK product"}${selection ? ` - ${selection}` : ""} | EEHOOK`;
    const description = String(product?.description || FALLBACK_DESCRIPTION)
        .replace(/\s+/g, " ")
        .slice(0, 200);
    const image = absoluteUrl(selectedImage(variant), origin);
    const escapedUrl = escapeHtml(canonicalUrl.href);
    const escapedTitle = escapeHtml(title);
    const escapedDescription = escapeHtml(description);
    const escapedImage = escapeHtml(image);
    const escapedImageAlt = escapeHtml(`${product?.name || "EEHOOK product"}${selection ? ` ${selection}` : ""}`);

    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    response.status(200).send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${escapedTitle}</title>
    <meta name="description" content="${escapedDescription}">
    <link rel="canonical" href="${escapedUrl}">
    <meta property="og:type" content="product">
    <meta property="og:site_name" content="EEHOOK">
    <meta property="og:title" content="${escapedTitle}">
    <meta property="og:description" content="${escapedDescription}">
    <meta property="og:url" content="${escapedUrl}">
    <meta property="og:image" content="${escapedImage}">
    <meta property="og:image:alt" content="${escapedImageAlt}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapedTitle}">
    <meta name="twitter:description" content="${escapedDescription}">
    <meta name="twitter:image" content="${escapedImage}">
    <meta http-equiv="refresh" content="0;url=${escapedUrl}">
  </head>
  <body>
    <p>Opening ${escapedTitle}…</p>
    <script>window.location.replace(${JSON.stringify(canonicalUrl.href)});</script>
  </body>
</html>`);
}
