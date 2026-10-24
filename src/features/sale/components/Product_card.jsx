import { useEffect } from "react";
import "./../styles/ProductCard.css";
import { FaHeart } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Wishlist_post, Wishlist_delete } from "../../wishlist/api/Wishlisht_Api";
import WishlistQuery from "../../wishlist/queries/WishlistQuery";
import { getImageUrl } from "../../../utils/imageUrl";
import showToast from "../../../utils/toast";
import defaultImage from "../../../assets/image_not_available.png";
import { hasAuthSession } from "../../auth/authUtils";
import DirhamAmount from "../../../components/DirhamAmount";
import ProductHighlightRail from "../../home/components/ProductHighlightRail";
import { getProductDetailsPath } from "../../../utils/productUrl";

const hasValue = (value) => value !== null && value !== undefined && value !== "";

function getFirstVariant(product) {
    return product?.variants?.[0] || null;
}

function getFirstUnit(variant) {
    if (!variant || variant.price_type === "single") return null;
    return variant.sizes?.[0] || variant.units?.[0] || null;
}

function getVariantLabel(variant) {
    if (!variant) return "";
    if (typeof variant.color === "string") return variant.color;
    return variant.color?.name || variant.color_name || "";
}

function getProductSelection(product) {
    const variant = getFirstVariant(product) || (hasValue(product?.default_variant_id)
        ? { id: product.default_variant_id, price_type: hasValue(product.default_variant_unit_id) ? "multiple" : "single" }
        : null);
    const unit = getFirstUnit(variant) || (hasValue(product?.default_variant_unit_id)
        ? { id: product.default_variant_unit_id, stock: product.stock }
        : null);
    return { variant, unit };
}

function getProductImage(product, variant) {
    // A variant image is color-specific. Prefer its selected primary image so
    // a generic/product-level image cannot hide the color's primary image in
    // category and subcategory listings.
    return variant?.images?.find((item) => item.is_primary)?.image
        || variant?.images?.[0]?.image
        || product?.image
        || product?.product_image;
}

function getAvailability(product, variant, unit) {
    // A card can represent one color, so use that variant's stock before the
    // aggregate product-level availability.
    const stock = unit?.stock ?? variant?.stock ?? product?.stock;
    if (hasValue(stock)) return Number(stock) > 0 ? "In stock" : "Out of stock";

    if (hasValue(product?.availability)) return String(product.availability);
    if (hasValue(product?.stock_status)) return String(product.stock_status);
    if (product?.in_stock === true) return "In stock";
    if (product?.in_stock === false) return "Out of stock";
    if (product?.is_available === false) return "Out of stock";
    return "Availability varies";
}

function getPricing(product, variant, unit) {
    const selectedPrice = unit?.price ?? variant?.price;
    const selectedDiscountedPrice = unit?.discounted_price ?? variant?.discounted_price;
    const originalPrice = selectedPrice ?? product?.original_price ?? product?.starting_price;
    const currentPrice = selectedDiscountedPrice
        ?? selectedPrice
        ?? product?.current_price
        ?? product?.discounted_price
        ?? product?.starting_price;
    const discountedPrice = selectedDiscountedPrice ?? product?.discounted_price;
    const hasOffer = variant?.has_offer === true
        || unit?.has_offer === true
        || product?.has_offer === true
        || (hasValue(product?.discount_percentage) && Number(product.discount_percentage) > 0);

    return { originalPrice, currentPrice, discountedPrice, hasOffer };
}

function getCardItems(products, expandVariants) {
    return products.flatMap((product) => {
        if (!expandVariants) {
            const { variant, unit } = getProductSelection(product);
            return [{ product, variant, unit, key: product.id }];
        }

        const variants = Array.isArray(product?.variants) ? product.variants : [];
        if (!variants.length) {
            return [{ product, variant: null, unit: null, key: product.id }];
        }

        return variants.map((variant, index) => ({
            product,
            variant,
            unit: getFirstUnit(variant),
            key: `${product.id}-${variant.id || index}`,
        }));
    });
}

function Product_card({ products = [], isLoading, error, page = 1, pageSize = 14, count = 0, onPageChange, showPagination = true, compact = false, expandVariants = false }) {
    const navigate = useNavigate();
    const { data: rawWishlist = [], refetch } = WishlistQuery();
    const wishdata = Array.isArray(rawWishlist) ? rawWishlist : rawWishlist?.results || [];
    const cardItems = getCardItems(products, expandVariants);
    const totalPages = Math.max(1, Math.ceil(Number(count || products.length) / pageSize));

    useEffect(() => { if (!compact) window.scrollTo(0, 0); }, [compact, page]);

    const addToWishlist = async (product, event, selectedVariant, selectedUnit) => {
        event.stopPropagation();

        if (!hasAuthSession()) {
            showToast.info("Please login to continue");
            navigate("/login");
            return;
        }

        const { variant: firstVariant, unit: firstUnit } = selectedVariant
            ? { variant: selectedVariant, unit: selectedUnit }
            : getProductSelection(product);
        if (!firstVariant || (firstVariant.price_type !== "single" && !firstUnit)) {
            showToast.error("Variant not available");
            return;
        }

        const wishlistItem = wishdata.find((item) => String(item.variant) === String(firstVariant.id) && String(item.variant_size ?? "") === String(firstUnit?.id ?? ""));
        try {
            if (wishlistItem) {
                await Wishlist_delete(wishlistItem.id);
                showToast.success("Product removed from wishlist");
            } else {
                await Wishlist_post({ variant: firstVariant.id, variant_size: firstUnit ? firstUnit.id : null });
                showToast.success("Product added to wishlist");
            }
            await refetch();
        } catch (requestError) {
            showToast.error(requestError?.response?.data?.detail || "Could not update wishlist");
        }
    };

    if (isLoading) {
        return <div className="catalog-container homepage-product-catalog"><section className="products shop-many-products">{Array.from({ length: 8 }).map((_, index) => <div className="product_card skeleton-card" key={index}><div className="product_img skeleton"></div><div className="product_info"><div className="skeleton skeleton-text category-skeleton"></div><div className="skeleton skeleton-text title-skeleton"></div><div className="skeleton skeleton-text price-skeleton"></div></div></div>)}</section></div>;
    }
    if (error) return <p className="error-state">Unable to load products. Please try again.</p>;
    if (!cardItems.length) return null;

    return <div className="catalog-container homepage-product-catalog"><section className={`products ${cardItems.length <= 3 ? "shop-few-products" : "shop-many-products"}`}>
        {cardItems.map(({ product, variant, unit, key }) => {
            const isWishlisted = !!wishdata.find((item) => String(item.variant) === String(variant?.id) && String(item.variant_size ?? "") === String(unit?.id ?? ""));
            const { originalPrice, currentPrice, discountedPrice, hasOffer } = getPricing(product, variant, unit);
            const image = getProductImage(product, variant);
            const variantLabel = getVariantLabel(variant);
            const displayPrice = hasOffer && hasValue(discountedPrice) ? discountedPrice : currentPrice;
            const showOriginalPrice = hasOffer && hasValue(originalPrice) && hasValue(displayPrice) && String(originalPrice) !== String(displayPrice);
            const savingsPercentage = showOriginalPrice
                ? Math.round(((Number(originalPrice) - Number(displayPrice)) / Number(originalPrice)) * 100)
                : 0;
            const availability = getAvailability(product, variant, unit);

            const openProduct = () => {
                const query = new URLSearchParams();
                if (variant?.id) query.set("variant", String(variant.id));
                if (unit?.id) query.set("size", String(unit.id));
                navigate(`${getProductDetailsPath(product)}${query.toString() ? `?${query.toString()}` : ""}`);
            };
            const openProductWithKeyboard = (event) => {
                if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
                event.preventDefault();
                openProduct();
            };

            return <article className="product_card" key={key} role="link" tabIndex={0} aria-label={`View ${product.name || "product"}${variantLabel ? ` in ${variantLabel}` : ""}`} onClick={openProduct} onKeyDown={openProductWithKeyboard}>
                <div className="product_img">
                    {(product.marketing_highlights?.length || (hasOffer && hasValue(product.discount_percentage))) ? (
                        <div className="product-image-topbar">
                            <ProductHighlightRail highlights={product.marketing_highlights} placement="badge" />
                            {hasOffer && hasValue(product.discount_percentage) && <div className="offer-badge">{product.discount_percentage}% OFF</div>}
                        </div>
                    ) : null}
                    <div className="product-image-stage">
                        <img src={image ? getImageUrl(image) : defaultImage} alt={product.name || "Product"} />
                        <button
                            type="button"
                            className="quick-add-bar"
                            onClick={(event) => {
                                event.stopPropagation();
                                openProduct();
                            }}
                        >
                            VIEW PRODUCT
                        </button>
                    </div>
                    <button className={`favorite_btn ${isWishlisted ? "active" : ""}`} onClick={(event) => addToWishlist(product, event, variant, unit)} aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}><FaHeart /></button>
                </div>
                <div className="product_info">
                    <span className="product-category">{product.category?.name || product.brand?.name || ""}</span>
                    <h3 className="product-title">{product.name}</h3>
                    {variantLabel && <span className="product-variant-label">Color: {variantLabel}</span>}
                    <div className="product-footer">
                        <div className="price-box">
                            {savingsPercentage > 0 && <span className="price-savings">Save {savingsPercentage}%</span>}
                            {showOriginalPrice ? (
                                <span className="old-price"><DirhamAmount value={originalPrice} fallback="Price unavailable" /></span>
                            ) : null}
                            <span className={showOriginalPrice ? "new-price" : "price"}>
                                <DirhamAmount value={displayPrice} fallback="Price unavailable" />
                            </span>
                        </div>
                    </div>
                    <span className={`product-availability ${availability.toLowerCase().includes("out") ? "is-unavailable" : ""}`}>{availability}</span>
                </div>
            </article>;
        })}
    </section>
    {showPagination && totalPages > 1 && <div className="pagination-wrapper" aria-label="Product pages"><div className="numbers"><button type="button" className="page-num pagination-arrow" disabled={page <= 1} onClick={() => onPageChange?.(page - 1)}>‹</button>{Array.from({ length: totalPages }, (_, index) => index + 1).slice(Math.max(0, page - 3), Math.min(totalPages, page + 2)).map((number) => <button type="button" key={number} className={`page-num ${page === number ? "active" : ""}`} onClick={() => onPageChange?.(number)}>{number}</button>)}<button type="button" className="page-num pagination-arrow" disabled={page >= totalPages} onClick={() => onPageChange?.(page + 1)}>›</button></div></div>}
    </div>;
}

export default Product_card;
