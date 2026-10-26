import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import "../style/Single_product.css";
import {
    NavLink,
    useSearchParams,
    useParams,
    useNavigate
} from "react-router-dom";
import { AiOutlineDoubleRight, AiOutlineEye, AiOutlineCheckCircle, AiOutlineLock, AiOutlineLeft, AiOutlineRight, AiOutlineDown, AiOutlineUp } from "react-icons/ai";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { FiShare2 } from "react-icons/fi";
import GetSingle_product_Query from "../queries/GetSingle_product_Query";
import Cart_query from "../../cart/queries/Cart_query";
import { addToCart_Post } from "../api/AddToCart_Api";
import RelatedProductsModal from "../components/RelatedProductsModal";
import { relatedProductsFromResponse } from "../components/relatedProducts";
import { relatedProductsGet } from "../../sale/api/ProductApi";

import WishlistQuery from "../../wishlist/queries/WishlistQuery";
import {
    Wishlist_post,
    Wishlist_delete
} from "../../wishlist/api/Wishlisht_Api";
import showToast from "../../../utils/toast";
import { getImageUrl } from "../../../utils/imageUrl";
import defaultImage from "../../../assets/image_not_available.png";
import {
    getMostRecentCouponApplication,
    clearCouponApplication,
    isAuthenticatedForCoupons,
    isInactiveCouponError,
    normalizeCouponCode,
    saveCouponApplication,
    validateCoupon,
} from "../../coupon/couponState";
import ProductCouponInput from "../../coupon/components/ProductCouponInput";
import { hasAuthSession } from "../../auth/authUtils";
import DirhamAmount from "../../../components/DirhamAmount";
import { getProductDetailsPath, getProductSelectionPath, slugifyProductName } from "../../../utils/productUrl";

function getDescriptionText(value) {
    if (Array.isArray(value)) return value.filter(Boolean).join("\n").trim();
    return value === null || value === undefined ? "" : String(value).trim();
}

function getKeyFeatures(value) {
    if (Array.isArray(value)) {
        return value
            .flatMap((feature) => {
                if (feature && typeof feature === "object") return feature.name || feature.title || feature.description || "";
                return feature;
            })
            .map((feature) => String(feature || "").trim())
            .filter(Boolean);
    }

    if (value === null || value === undefined) return [];

    const text = String(value).trim();
    if (!text) return [];

    try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return getKeyFeatures(parsed);
    } catch {
        // The backend normally returns one feature per line, so plain text is handled below.
    }

    return text
        .split(/\r?\n|[•●▪◦]/)
        .map((feature) => feature.replace(/^\s*[-*]\s*/, "").trim())
        .filter(Boolean);
}

function getStorageOption(variant) {
    const option = variant?.sizes?.[0];
    return option?.unit || option?.size || null;
}

function getProductHeading(name, storageLabel, colorLabel) {
    let heading = String(name || "Product").trim();

    if (storageLabel) {
        const storagePattern = /\b\d+(?:\.\d+)?\s*(?:GB|TB)\b/gi;
        heading = storagePattern.test(heading)
            ? heading.replace(storagePattern, storageLabel)
            : `${heading} ${storageLabel}`;
    }

    if (colorLabel && !heading.toLowerCase().endsWith(String(colorLabel).toLowerCase())) {
        heading = `${heading} ${colorLabel}`;
    }

    return heading;
}

function updateMetaContent(attr, key, value, touched, created) {
    let element = Array.from(document.head.querySelectorAll("meta")).find(
        (item) => item.getAttribute(attr) === key
    );

    if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attr, key);
        document.head.appendChild(element);
        created.push(element);
        touched.push({ element, previous: null });
    } else {
        touched.push({ element, previous: element.getAttribute("content") });
    }

    element.setAttribute("content", value);
}

function updateCanonicalUrl(value, touched, created) {
    let element = document.head.querySelector('link[rel="canonical"]');

    if (!element) {
        element = document.createElement("link");
        element.setAttribute("rel", "canonical");
        document.head.appendChild(element);
        created.push(element);
        touched.push({ element, previous: null });
    } else {
        touched.push({ element, previous: element.getAttribute("href") });
    }

    element.setAttribute("href", value);
}

function updateProductMetadata({ title, description, url, image, imageAlt }) {
    if (typeof document === "undefined") return () => {};

    const previousTitle = document.title;
    const touched = [];
    const created = [];
    const absoluteImage = new URL(image, window.location.origin).href;

    document.title = title;
    updateMetaContent("name", "description", description, touched, created);
    updateMetaContent("property", "og:title", title, touched, created);
    updateMetaContent("property", "og:description", description, touched, created);
    updateMetaContent("property", "og:url", url, touched, created);
    updateMetaContent("property", "og:type", "product", touched, created);
    updateMetaContent("property", "og:image", absoluteImage, touched, created);
    updateMetaContent("property", "og:image:alt", imageAlt, touched, created);
    updateMetaContent("name", "twitter:title", title, touched, created);
    updateMetaContent("name", "twitter:description", description, touched, created);
    updateMetaContent("name", "twitter:image", absoluteImage, touched, created);
    updateCanonicalUrl(url, touched, created);

    return () => {
        document.title = previousTitle;
        touched.reverse().forEach(({ element, previous }) => {
            if (created.includes(element)) {
                element.remove();
            } else if (previous === null) {
                element.removeAttribute("content");
            } else if (element.tagName.toLowerCase() === "link") {
                element.setAttribute("href", previous);
            } else {
                element.setAttribute("content", previous);
            }
        });
    };
}

function getSavingsPercentage(originalPrice, currentPrice) {
    const original = Number(originalPrice);
    const current = Number(currentPrice);
    if (!Number.isFinite(original) || !Number.isFinite(current) || original <= 0 || current >= original) return 0;
    return Math.round(((original - current) / original) * 100);
}

function SavingsLabel({ originalPrice, currentPrice, offer }) {
    const original = Number(originalPrice);
    const current = Number(currentPrice);
    if (!Number.isFinite(original) || !Number.isFinite(current) || original <= 0 || current >= original) return null;

    const savingsAmount = Math.round((original - current) * 100) / 100;
    const isFixedOffer = String(offer?.discount_type || "PERCENTAGE").toUpperCase() === "FIXED";
    return <span className="price-savings single-product-price-savings">Save {isFixedOffer ? <DirhamAmount value={savingsAmount} /> : `${getSavingsPercentage(original, current)}%`}</span>;
}

function ExpandableProductContent({ children, className = "" }) {
    const contentRef = useRef(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [hasMoreContent, setHasMoreContent] = useState(false);

    useEffect(() => {
        const content = contentRef.current;
        if (!content || isExpanded) return undefined;

        const measureContent = () => {
            setHasMoreContent(content.scrollHeight > content.clientHeight + 1);
        };

        measureContent();

        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", measureContent);
            return () => window.removeEventListener("resize", measureContent);
        }

        const resizeObserver = new ResizeObserver(measureContent);
        resizeObserver.observe(content);
        return () => resizeObserver.disconnect();
    }, [children, isExpanded]);

    return (
        <>
            <div
                ref={contentRef}
                className={`expandable-product-content ${className} ${isExpanded ? "is-expanded" : "is-collapsed"}`}
            >
                {children}
            </div>

            {hasMoreContent && (
                <button
                    type="button"
                    className="product-content-toggle"
                    onClick={() => setIsExpanded((expanded) => !expanded)}
                    aria-expanded={isExpanded}
                >
                    <span>{isExpanded ? "Read less" : "Read more"}</span>
                    {isExpanded ? <AiOutlineUp aria-hidden="true" /> : <AiOutlineDown aria-hidden="true" />}
                </button>
            )}
        </>
    );
}

function relatedProductImage(product) {
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    const images = Array.isArray(variants[0]?.images) ? variants[0].images : [];
    const primaryImage = images.find((image) => image?.is_primary) || images[0];

    return product?.product_image || product?.image || primaryImage?.image || primaryImage?.url || "";
}

function relatedProductPrice(product) {
    const value = product?.discounted_price ?? product?.current_price ?? product?.starting_price ?? product?.price;
    const price = Number(value);
    return <DirhamAmount value={price} fallback="Price unavailable" />;
}

function isWelcomeBonusCoupon(coupon) {
    return String(coupon?.promotion_type || coupon?.coupon?.promotion_type || "").toUpperCase() === "WELCOME_BONUS";
}

function Single_product() {

    const navigate = useNavigate();

    const {
        id,
        slug,
        colorSlug,
        storageSlug,
        storageOnlySlug,
    } = useParams();

    const [searchParams] = useSearchParams();

    const variantId = Number(
        searchParams.get("variant")
    );

    const sizeId = Number(
        searchParams.get("size")
    );

    const {
        data = {},
        isLoading,
        error,
        refetch: refetchProduct
    } = GetSingle_product_Query(id);

    const descriptionText = getDescriptionText(data.description);
    const keyFeatures = getKeyFeatures(data.key_features);

    const [selectedColor, setSelectedColor] = useState(null);

    const [selectedSize, setSelectedSize] = useState(null);

    const [activeImage, setActiveImage] = useState(null);

    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [modalImageIndex, setModalImageIndex] = useState(0);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [isRelatedProductsOpen, setIsRelatedProductsOpen] = useState(false);

    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState("");
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [isCouponLocked, setIsCouponLocked] = useState(false);
    const couponRequestPending = useRef(false);

    const productId = data?.id || id;

    useEffect(() => {
        if (isLoading || error || !data?.id) return;

        const canonicalPath = getProductDetailsPath(data);
        const expectedSlug = slugifyProductName(data.name);
        const hasCanonicalParams = String(id) === String(data.id) && slug === expectedSlug;
        if (!hasCanonicalParams) {
            const query = searchParams.toString();
            navigate(`${canonicalPath}${query ? `?${query}` : ""}`, { replace: true });
        }
    }, [data, error, id, isLoading, navigate, searchParams, slug]);

    const { data: relatedProductsResponse } = useQuery({
        queryKey: ["related-products", id],
        queryFn: () => relatedProductsGet(id),
        enabled: Boolean(id),
    });

    const queriedRelatedProducts = relatedProductsFromResponse(relatedProductsResponse);
    const pageRelatedProducts = (queriedRelatedProducts.length ? queriedRelatedProducts : relatedProductsFromResponse(data))
        .filter((product) => String(product?.id ?? product?.pk ?? product?.uuid) !== String(productId))
        .slice(0, 4);

    const couponFromResponse = (responseData = {}) => ({
        ...responseData,
        coupon_code: responseData.coupon_code || responseData.code || responseData.coupon?.code,
        discount_type: String(responseData.discount_type || responseData.coupon_discount_type || responseData.coupon?.discount_type || "PERCENTAGE").toUpperCase(),
        discount_percentage: responseData.discount_percentage ?? responseData.coupon?.discount_percentage,
        fixed_amount: responseData.fixed_amount ?? responseData.coupon?.fixed_amount,
        discount_value: responseData.discount_value ?? responseData.coupon?.discount_value,
    });

    useEffect(() => {
        let active = true;
        const savedCoupon = getMostRecentCouponApplication(productId);

        if (!savedCoupon) {
            setCouponCode("");
            setAppliedCoupon(null);
            setCouponError("");
            setIsCouponLocked(false);
            return () => { active = false; };
        }

        setCouponCode(savedCoupon.code);
        setAppliedCoupon(null);
        setIsCouponLocked(false);
        setIsApplyingCoupon(true);
        validateCoupon(savedCoupon.code, productId).then((response) => {
            if (!active) return;
            const coupon = couponFromResponse(response.data);
            if (isWelcomeBonusCoupon(coupon)) {
                clearCouponApplication(productId, savedCoupon.code);
                setCouponCode("");
            } else {
                saveCouponApplication(productId, savedCoupon.code, { ...savedCoupon, status: "applied", response: coupon });
            }
            setAppliedCoupon(coupon);
            setCouponError(savedCoupon.status === "already_applied" ? savedCoupon.message : "");
            setIsCouponLocked(true);
        }).catch((error) => {
            if (!active) return;
            const responseData = error.response?.data || {};
            if (isInactiveCouponError(error)) {
                clearCouponApplication(productId, savedCoupon.code);
                setCouponCode("");
                setAppliedCoupon(null);
                setIsCouponLocked(false);
                setCouponError("This coupon is no longer active.");
            } else if (responseData.error_code === "COUPON_ALREADY_APPLIED") {
                setAppliedCoupon(null);
                setCouponError(responseData.message || savedCoupon.message || "You have already applied this coupon to this product.");
                setIsCouponLocked(true);
            } else {
                clearCouponApplication(productId, savedCoupon.code);
                setCouponCode("");
                setAppliedCoupon(null);
                setIsCouponLocked(false);
                setCouponError(responseData.detail || responseData.message || "Could not revalidate this coupon.");
            }
        }).finally(() => { if (active) setIsApplyingCoupon(false); });
        return () => { active = false; };
    }, [productId]);

    const handleCouponCodeChange = (value) => {
        setCouponCode(value);
        setCouponError("");
        setIsCouponLocked(false);

        setAppliedCoupon(null);
    };

    const handleApplyCoupon = async () => {
        if (couponRequestPending.current || isApplyingCoupon || isCouponLocked) return;

        setCouponError("");
        const normalizedCouponCode = normalizeCouponCode(couponCode);
        if (!normalizedCouponCode) {
            setCouponError("Please enter a coupon code");
            return;
        }

        if (!isAuthenticatedForCoupons()) {
            const message = "Please log in to apply a coupon.";
            setCouponError(message);
            showToast.info(message);
            return;
        }

        couponRequestPending.current = true;
        setIsApplyingCoupon(true);
        try {
            const response = await validateCoupon(normalizedCouponCode, productId);
            if (response.status !== 200) {
                if (isInactiveCouponError(response)) {
                    clearCouponApplication(productId, normalizedCouponCode);
                    setCouponCode("");
                    setAppliedCoupon(null);
                    setIsCouponLocked(false);
                    setCouponError("This coupon is no longer active.");
                    return;
                }
                setCouponError(response.data?.message || "Failed to apply coupon");
                return;
            }

            const coupon = couponFromResponse(response.data);
            if (!isWelcomeBonusCoupon(coupon)) {
                saveCouponApplication(productId, normalizedCouponCode, {
                    status: "applied",
                    response: coupon,
                    message: response.data?.message || "Coupon applied successfully!",
                });
            }
            setCouponCode(isWelcomeBonusCoupon(coupon) ? "" : normalizedCouponCode);
            setAppliedCoupon(coupon);
            setIsCouponLocked(true);
            showToast.success(response.data?.message || "Coupon applied successfully!");
        } catch (err) {
            const status = err.response?.status;
            const responseData = err.response?.data || {};

            if (isInactiveCouponError(err)) {
                clearCouponApplication(productId, normalizedCouponCode);
                setCouponCode("");
                setAppliedCoupon(null);
                setIsCouponLocked(false);
                setCouponError("This coupon is no longer active.");
                showToast.error("This coupon is no longer active.");
            } else if (status === 400 && responseData.error_code === "COUPON_ALREADY_APPLIED") {
                const message = responseData.message || "You have already applied this coupon to this product.";
                saveCouponApplication(productId, normalizedCouponCode, {
                    status: "already_applied",
                    message,
                });
                setCouponCode(normalizedCouponCode);
                setCouponError(message);
                setIsCouponLocked(true);
            } else if (status === 401 || status === 403) {
                const message = "Please log in to apply a coupon.";
                setCouponError(message);
                showToast.info(message);
            } else {
                setCouponError(responseData.message || responseData.detail || "An error occurred while validating coupon");
            }
        } finally {
            couponRequestPending.current = false;
            setIsApplyingCoupon(false);
        }
    };

    const {
        data: cart = [],
        refetch: refetchCart
    } = Cart_query();

    /*
        GET UNIQUE COLORS
    */

    const colors = [
        ...new Map(
            (data?.variants || [])
                .filter(
                    variant => variant.color
                )
                .map(
                    variant => [
                        variant.color.id,
                        variant.color
                    ]
                )
        ).values()
    ];

    /*
        SELECTED VARIANT
    */

    const selectedVariant =
        data?.variants?.find(
            variant =>
                variant.color?.id === selectedColor?.id
        ) ||
        data?.variants?.[0];

    useEffect(() => {

        if (!data?.variants?.length) return;

        const routeStorageSlug = storageOnlySlug || storageSlug;
        const routeVariant = data.variants.find(
            (variant) => variant.id === variantId
        ) || data.variants.find(
            (variant) => colorSlug && slugifyProductName(variant.color?.name) === colorSlug
        ) || data.variants[0];

        // Restore the selected color/storage from either the readable URL
        // segments or the legacy variant/size query parameters.
        if (variantId || colorSlug || routeStorageSlug) {
            const variant = routeVariant;

            if (variant) {
                setSelectedColor(
                    variant.color
                );

                const size =
                    variant.sizes?.find(
                        s => s.id === sizeId
                    ) ||
                    variant.sizes?.find(
                        (item) => {
                            const option = item.unit || item.size;
                            return routeStorageSlug && slugifyProductName(option?.name) === routeStorageSlug;
                        }
                    ) ||
                    variant.sizes?.[0];

                setSelectedSize(
                    size ? (size.unit || size.size) : null
                );

                const image = variant.images.find(img => img.is_primary) || variant.images[0];

                setActiveImage(
                    image?.image
                );
                syncProductSelectionUrl(variant, size || null);
                return;
            }
        }

        // Default

        const firstVariant =
            data.variants[0];

        setSelectedColor(
            firstVariant.color
        );

        const firstSize = firstVariant.sizes?.find((item) => item.unit || item.size) || null;

        setSelectedSize(firstSize ? (firstSize.unit || firstSize.size) : null);

        const image = firstVariant.images.find(img => img.is_primary) || firstVariant.images[0];

        setActiveImage(
            image?.image || null
        );

        syncProductSelectionUrl(firstVariant, firstSize);

    }, [
        data,
        variantId,
        sizeId,
        colorSlug,
        storageSlug,
        storageOnlySlug,
    ]);

    const availableSizes =
        selectedVariant?.sizes || [];

    const selectedSizeVariant =
        selectedVariant?.sizes?.find(
            item =>
                (item.unit?.id === selectedSize?.id) || (item.size?.id === selectedSize?.id)
        );

    const selectedPriceInfo = selectedVariant?.price_type === 'single'
        ? selectedVariant
        : (selectedSizeVariant || availableSizes?.[0]);
    const selectedCurrentPrice = Number(selectedPriceInfo?.discounted_price ?? selectedPriceInfo?.price ?? 0);
    const selectedOriginalPrice = Number(selectedPriceInfo?.price ?? 0);

    const selectedStorage = selectedSizeVariant?.unit
        || selectedSizeVariant?.size
        || selectedSize
        || getStorageOption(selectedVariant);
    const selectedStorageLabel = selectedStorage?.name || "";
    const productHeading = getProductHeading(data.name, selectedStorageLabel, selectedColor?.name);

    const syncProductSelectionUrl = (variant, sizeOption) => {
        if (!data?.id || !variant?.id) return;

        const storage = sizeOption?.unit || sizeOption?.size;
        navigate(
            getProductSelectionPath(data, {
                variantId: variant.id,
                sizeId: sizeOption?.id,
                color: variant.color?.name,
                storage: storage?.name,
            }),
            { replace: true, preventScrollReset: true }
        );
    };

    useEffect(() => {
        if (!data?.id || !selectedVariant) return undefined;

        const selectedImage = activeImage
            || selectedVariant.images?.find((image) => image.is_primary)?.image
            || selectedVariant.images?.[0]?.image;
        const imageUrl = selectedImage ? getImageUrl(selectedImage) : "/eehook.jpeg";
        const description = (descriptionText || `Shop ${productHeading} at EEHOOK.`)
            .replace(/\s+/g, " ")
            .slice(0, 200);
        const url = new URL(
            getProductSelectionPath(data, {
                variantId: selectedVariant.id,
                sizeId: selectedSizeVariant?.id,
                color: selectedColor?.name,
                storage: selectedStorageLabel,
            }),
            window.location.origin
        ).href;

        return updateProductMetadata({
            title: `${productHeading} | EEHOOK`,
            description,
            url,
            image: imageUrl,
            imageAlt: productHeading,
        });
    }, [
        activeImage,
        data,
        descriptionText,
        productHeading,
        selectedColor,
        selectedSizeVariant,
        selectedStorageLabel,
        selectedVariant,
    ]);

    const displayImages =
        selectedVariant?.images || [];

    const cartItem = cart?.items?.find(item => 
        item.variant === selectedVariant?.id && 
        (selectedVariant?.price_type === 'single' || item.variant_size === selectedSizeVariant?.id)
    );
    const cartQuantity = cartItem ? cartItem.quantity : 0;

    const availableStock = selectedVariant?.price_type === 'single'
        ? (selectedVariant?.stock || 0) - cartQuantity
        : (selectedSizeVariant?.stock || 0) - cartQuantity;

    const addTocart = async () => {

        if (isApplyingCoupon) {
            showToast.info("Please wait while the coupon is being validated.");
            return;
        }

        if (!hasAuthSession()) {
            showToast.info("Please login to continue");
            navigate("/login");
            return;
        }



        if (colors.length > 0 && !selectedColor) {
            showToast.warning("Please select a color");
            return;
        }

        if (selectedVariant?.price_type === 'multiple') {
            if (!selectedSize) {
                showToast.warning("Please select a size/unit");
                return;
            }
            if (!selectedSizeVariant) {
                showToast.warning("This combination is not available");
                return;
            }
            if (availableStock <= 0) {
                showToast.info("Out of stock");
                return;
            }
        } else {
            if (availableStock <= 0) {
                showToast.info("Out of stock");
                return;
            }
        }

        const cartPayload = {
            variant: selectedVariant.id,
            variant_size: selectedVariant?.price_type === 'single' ? (selectedVariant?.sizes?.[0]?.id || null) : selectedSizeVariant?.id,
            quantity: 1
        };

        try {
            setIsAddingToCart(true);
            const response = await addToCart_Post(cartPayload);
            await refetchCart();
            showToast.success(
                "Product added to cart"
            );
            const choices = relatedProductsFromResponse(response);
            if (choices.length) {
                setRelatedProducts(choices.slice(0, 4));
                setIsRelatedProductsOpen(true);
            }
        } catch (error) {
            console.log(error);
            if (isInactiveCouponError(error)) {
                clearCouponApplication(productId, couponCode);
                setCouponCode("");
                setAppliedCoupon(null);
                setIsCouponLocked(false);
                setCouponError("This coupon is no longer active.");
                showToast.error("This coupon is no longer active.");
            }
            if (error.response?.status === 401) {
                showToast.info(
                    "Please login to continue"
                );
                navigate("/login");
            } else if (!isInactiveCouponError(error)) {
                showToast.error(error.response?.data?.message || error.response?.data?.detail || "Could not add this product to the cart.");
            }
        } finally {
            setIsAddingToCart(false);
        }
    };

    const addSelectedRelatedProducts = async (payload) => {
        const response = await addToCart_Post(payload);
        await refetchCart();
        if (Array.isArray(response?.unavailable_related_products) && response.unavailable_related_products.length) {
            showToast.warning("Some selected related products are no longer available.");
            return { unavailable: true };
        }
        showToast.success("Selected products added to cart");
        return response;
    };

    const refreshRelatedProducts = async () => {
        const response = await refetchProduct();
        const choices = relatedProductsFromResponse(response?.data);
        setRelatedProducts(choices);
        return choices;
    };

    /*
        ADD TO WISHLIST
    */

    const {
        data: rawWishdata,
        refetch: refetchWishlist
    } = WishlistQuery();
    const wishdata = Array.isArray(rawWishdata) ? rawWishdata : [];

    const addToWishlist = async () => {

        if (!hasAuthSession()) {
            showToast.info("Please login to continue");
            navigate("/login");
            return;
        }



        if (!selectedVariant) {
            showToast.warning("Please select a variant");
            return;
        }

        if (colors.length > 0 && !selectedColor) {
            showToast.warning("Please select a color");
            return;
        }

        try {
            const wishlistVariantSize = selectedVariant?.price_type === 'multiple' ? selectedSizeVariant?.id ?? null : null;
            const wishlistItem = wishdata.find(
                item =>
                    item.variant === selectedVariant.id &&
                    (item.variant_size ?? null) === wishlistVariantSize
            );

            if (wishlistItem) {
                await Wishlist_delete(
                    wishlistItem.id
                );
                await refetchWishlist();
                showToast.success(
                    "Product removed from wishlist"
                );
                return;
            }

            await Wishlist_post({
                variant: selectedVariant.id,
                variant_size: wishlistVariantSize
            });

            await refetchWishlist();

            showToast.success(
                "Product added to wishlist"
            );
        } catch (error) {
            console.log(error);
            if (error.response?.status === 401) {
                showToast.info(
                    "Please login to continue"
                );
                navigate("/login");
            }
        }
    };

    if (isLoading) return "Loading...";
    if (error) return "Something went wrong";

    const isWishlisted = wishdata.some(
        item =>
            item.variant === selectedVariant?.id &&
            (selectedVariant?.price_type === 'single' || item.variant_size === selectedSizeVariant?.id)
    );

    const shareProduct = async () => {
        if (!data?.id || !selectedVariant || typeof window === "undefined") return;

        const sharePath = getProductSelectionPath(data, {
            variantId: selectedVariant.id,
            sizeId: selectedSizeVariant?.id,
            color: selectedColor?.name,
            storage: selectedStorageLabel,
        });
        const shareUrl = new URL(sharePath, window.location.origin).href;
        const shareTitle = `${productHeading} | EEHOOK`;
        const shareText = `Check out ${productHeading} on EEHOOK.`;

        try {
            if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
                await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
                return;
            }

            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(shareUrl);
                showToast.success("Product link copied");
                return;
            }

            const textArea = document.createElement("textarea");
            textArea.value = shareUrl;
            textArea.setAttribute("readonly", "");
            textArea.style.position = "fixed";
            textArea.style.opacity = "0";
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            textArea.remove();
            showToast.success("Product link copied");
        } catch (shareError) {
            if (shareError?.name !== "AbortError") {
                showToast.error("Could not share this product");
            }
        }
    };

    return (
        <div className="single-product-main">
            <div className="single-product-toshop">
                <div className="toshop">
                    <NavLink to="/shop">Shop</NavLink>
                    <AiOutlineDoubleRight />
                </div>
            </div>

            <div className="single-product">

                {/* LEFT: IMAGE GALLERY */}
                <div className="gallery-section">
                    <div className="main-image-wrapper">
                        <div className="main-image" style={{ cursor: 'pointer' }}>
                            <button className="wishlist-icon" onClick={(e) => { e.stopPropagation(); addToWishlist(); }}>
                                {isWishlisted ? <FaHeart color="#fd0707ff" /> : <FaRegHeart color="#4B636D" />}
                            </button>
                            <button
                                type="button"
                                className="share-product-button"
                                onClick={(e) => { e.stopPropagation(); shareProduct(); }}
                                aria-label="Share product"
                                title="Share product"
                            >
                                <FiShare2 aria-hidden="true" />
                            </button>
                            <img
                                onClick={() => {
                                    const index = displayImages.findIndex(img => img.image === activeImage);
                                    setModalImageIndex(index >= 0 ? index : 0);
                                    setIsImageModalOpen(true);
                                }}
                                src={
                                    activeImage
                                        ? getImageUrl(activeImage)
                                        : (selectedVariant?.images?.find(img => img.is_primary)?.image || selectedVariant?.images?.[0]?.image)
                                            ? getImageUrl(selectedVariant.images.find(img => img.is_primary)?.image || selectedVariant.images[0].image)
                                            : defaultImage
                                }
                                alt={data.name}
                            />
                        </div>
                        <p className="zoom-text">Click image to view in full screen</p>
                    </div>

                    {data.current_viewers_count != null && (
                        <div className="viewers-count-badge">
                            <div className="eye-wrapper">
                                <AiOutlineEye size={18} color="#007185" />
                                <span><strong style={{ color: "#007185" }}>{data.current_viewers_count} person{data.current_viewers_count > 1 ? "s" : ""}</strong> is watching this product now.</span>
                            </div>
                            <span className="close-badge-btn">×</span>
                        </div>
                    )}

                    <div className="thumbs-carousel-wrapper">
                        <button className="thumb-arrow left-arrow"><AiOutlineLeft size={16} /></button>
                        <div className="thumbs">
                            {displayImages.map((img) => (
                                <img
                                    key={img.id}
                                    src={getImageUrl(img.image)}
                                    alt={data.name}
                                    className={
                                        activeImage === img.image
                                            ? "active-thumb"
                                            : ""
                                    }
                                    onClick={() => setActiveImage(img.image)}
                                />
                            ))}
                        </div>
                        <button className="thumb-arrow right-arrow"><AiOutlineRight size={16} /></button>

                    </div>
                </div>

                {/* CENTER: PRODUCT INFORMATION */}
                <div className="info-section">
                    <h1>{productHeading}</h1>

                    {colors.length > 0 && <div className="option-block color-selection-block">
                        <h4>Color: <span className="selected-option-label" style={{ fontWeight: 'bold', color: '#111' }}>{selectedColor?.name || "Select color"}</span></h4>
                        <div className="colors image-colors">
                            {colors.map((color) => {
                                const variant = data.variants.find(item => item.color?.id === color.id);
                                const img = variant?.images?.find(i => i.is_primary)?.image || variant?.images?.[0]?.image;

                                return (
                                    <button
                                        key={color.id}
                                        className={selectedColor?.id === color.id ? "color-img-btn active-color-img" : "color-img-btn"}
                                        title={color.name}
                                        onClick={() => {
                                            const variant = data.variants.find(item => item.color?.id === color.id);
                                            const nextSizeOption = variant?.sizes?.find((item) => item.unit || item.size) || null;
                                            setSelectedColor(color);
                                            setSelectedSize(nextSizeOption ? (nextSizeOption.unit || nextSizeOption.size) : null);
                                            const image = variant?.images?.find(img => img.is_primary) || variant?.images?.[0];
                                            setActiveImage(image?.image || null);
                                            syncProductSelectionUrl(variant, nextSizeOption);
                                        }}
                                    >
                                        {img ? <img src={getImageUrl(img)} alt={color.name} /> : <div className="fallback-color" style={{ background: color.code }} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>}

                    {selectedVariant?.price_type === 'multiple' && availableSizes?.some(item => item.unit || item.size) && (
                        <div className="option-block">
                            <h4>{availableSizes?.[0]?.unit_type?.name || availableSizes?.[0]?.size?.unit_type || selectedSize?.unit_type || "Variant Option"}: <span className="selected-option-label">{selectedStorageLabel || "Select option"}</span></h4>
                            <div className="sizes">
                                {availableSizes.map((item) => {
                                    const unitObj = item.unit || item.size;
                                    return unitObj && (
                                        <button
                                            key={item.id}
                                            className={selectedSize?.id === unitObj.id ? "size-btn active-size" : "size-btn"}
                                            onClick={() => {
                                                setSelectedSize(unitObj);
                                                syncProductSelectionUrl(selectedVariant, item);
                                            }}
                                        >
                                            {unitObj.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="product-price-section" style={{ margin: '20px 0', padding: '15px 0', borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>Price:</div>
                        {(() => {
                            let itemPriceInfo = selectedVariant?.price_type === 'single'
                                ? selectedVariant
                                : (selectedSizeVariant || availableSizes?.[0]);

                            if (!itemPriceInfo) return null;

                            let currentPrice = Number(itemPriceInfo.discounted_price || itemPriceInfo.price || 0);
                            let originalPrice = Number(itemPriceInfo.price || 0);
                            // Product and cart prices are backend-owned. Coupon validation only
                            // updates the applied state; it must not change this price locally.
                            const finalPrice = currentPrice;

                            return (
                                <div>
                                    <SavingsLabel originalPrice={originalPrice} currentPrice={finalPrice} offer={data?.offer} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontFamily: 'Inter, Arial, sans-serif', fontSize: '28px', fontWeight: '800', color: '#B12704' }}>
                                            <DirhamAmount value={finalPrice} />
                                        </span>
                                        {originalPrice > finalPrice && (
                                            <>
                                                <span style={{ fontFamily: 'Inter, Arial, sans-serif', fontSize: '16px', color: '#565959', textDecoration: 'line-through' }}>
                                                    <DirhamAmount value={originalPrice} />
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    {appliedCoupon && (
                                        <div style={{ color: 'green', fontSize: '14px', marginTop: '5px', fontWeight: 'bold' }}>
                                            {String(appliedCoupon.promotion_type || "").toUpperCase() === "WELCOME_BONUS"
                                                ? "Welcome Bonus applied. Final discount will be calculated by the server."
                                                : `Coupon applied${appliedCoupon.coupon_code ? ` (${appliedCoupon.coupon_code})` : ""}. Final discount will be calculated by the server.`}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    <ProductCouponInput value={couponCode} onChange={handleCouponCodeChange} onApply={handleApplyCoupon} applying={isApplyingCoupon} locked={isCouponLocked} error={couponError} />

                    {(descriptionText || keyFeatures.length > 0) && (
                        <div className="product-content-details" aria-label="Product details">
                            {descriptionText && (
                                <section className="product-content-section" aria-labelledby="product-description-heading">
                                    <h2 id="product-description-heading">Description</h2>
                                    <ExpandableProductContent className="description">
                                        {descriptionText}
                                    </ExpandableProductContent>
                                </section>
                            )}

                            {keyFeatures.length > 0 && (
                                <section className="product-content-section key-features" aria-labelledby="product-features-heading">
                                    <h2 id="product-features-heading">Key features</h2>
                                    <ExpandableProductContent className="key-features-list-wrapper">
                                        <ul className="key-features-list">
                                            {keyFeatures.map((feature, idx) => <li key={`${feature}-${idx}`}>{feature}</li>)}
                                        </ul>
                                    </ExpandableProductContent>
                                </section>
                            )}
                        </div>
                    )}

                    {data?.promotional_banner_image && (
                        <div className="product-description-banner">
                            {data?.promotional_banner_link ? (
                                <a href={data.promotional_banner_link} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                                    <img 
                                        src={getImageUrl(data.promotional_banner_image)} 
                                        alt="Promotion" 
                                    />
                                </a>
                            ) : (
                                <img 
                                    src={getImageUrl(data.promotional_banner_image)} 
                                    alt="Promotion" 
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT: PURCHASE PANEL */}
                <div className="purchase-panel eehook-purchase-panel">

                    <div className="delivery-time-section">
                        {Number(data?.shipping_fee || 0) > 0 && (
                            <div className="shipping-fee">+ <DirhamAmount value={data.shipping_fee} /> Shipping</div>
                        )}
                        <div className="delivery-date">Delivery <strong>{data.estimated_delivery_time || "09 Sep - 10 Sep"}</strong></div>
                    </div>

                    <div className="price-right-section" style={{ marginBottom: '15px' }}>
                        <SavingsLabel originalPrice={selectedOriginalPrice} currentPrice={selectedCurrentPrice} offer={data?.offer} />
                        <span className="price-value"><DirhamAmount value={selectedCurrentPrice} /></span>
                    </div>

                    <div className="stock-status">
                        {selectedVariant?.price_type === 'single' ? (
                            (availableStock <= 0 ? (
                                <span className="stock-out" style={{ fontSize: '14px', color: '#b12704' }}>Out of stock</span>
                            ) : (
                                <span className="stock" style={{ fontSize: '14px', color: '#007600' }}>In stock</span>
                            ))
                        ) : (!selectedSizeVariant ? (
                            <span className="stock" style={{ fontSize: '14px', color: '#555' }}>Please select options to view stock</span>
                        ) : availableStock <= 0 ? (
                            <span className="stock-out" style={{ fontSize: '14px', color: '#b12704' }}>Out of stock</span>
                        ) : (
                            <span className="stock" style={{ fontSize: '14px', color: '#007600' }}>In stock</span>
                        ))}
                    </div>

                    <div className="sigle_product_cart-buy">
                        <button className="add-to-cart-amazon-btn" onClick={addTocart} disabled={isApplyingCoupon || isAddingToCart}>{isAddingToCart ? "ADDING..." : "ADD TO CART"}</button>
                    </div>

                    <div className="sold-by">
                        Sold by <a href="#">{data.seller_name || "ALAREESH MPT"}</a>
                    </div>

                    {data.warranty_info && (
                        <>
                            <hr className="divider" />
                            <div className="warranty-section">
                                <AiOutlineCheckCircle size={20} color="#555" />
                                <span>{data.warranty_info}</span>
                            </div>
                            <hr className="divider" />
                        </>
                    )}

                    <div className="secure-transaction">
                        <AiOutlineLock size={20} color="#555" />
                        <span>Secure Transaction</span>
                    </div>
                </div>

            </div>

            {/* PROMOTIONAL BANNER AT BOTTOM */}
            {data.promotional_banner_url && (
                <div className="promotional-banner">
                    {data.promotional_banner_link ? (
                        <a className="promotional-banner-link" href={data.promotional_banner_link} target="_blank" rel="noopener noreferrer">
                            <img src={data.promotional_banner_url} alt="Promotion" />
                        </a>
                    ) : (
                        <img src={data.promotional_banner_url} alt="Promotion" />
                    )}
                </div>
            )}

            {pageRelatedProducts.length > 0 && (
                <section className="product-related-products" aria-labelledby="related-products-heading">
                    <div className="product-related-products-header">
                        <div>
                            <p>YOU MAY ALSO LIKE</p>
                            <h2 id="related-products-heading">Related Products</h2>
                        </div>
                    </div>

                    <div className="product-related-products-grid">
                        {pageRelatedProducts.map((product) => {
                            const relatedProductId = product?.id ?? product?.pk ?? product?.uuid;
                            const image = relatedProductImage(product);
                            return (
                                <NavLink className="product-related-product-card" to={getProductDetailsPath(product, relatedProductId)} key={relatedProductId}>
                                    <div className="product-related-product-image">
                                        <img src={image ? getImageUrl(image) : defaultImage} alt={product?.name || "Related product"} onError={(event) => { event.currentTarget.src = defaultImage; }} />
                                    </div>
                                    <div className="product-related-product-info">
                                        <h3>{product?.name || "Related product"}</h3>
                                        <strong>{relatedProductPrice(product)}</strong>
                                        <span>View product</span>
                                    </div>
                                </NavLink>
                            );
                        })}
                    </div>
                </section>
            )}

            {isImageModalOpen && (
                <div className="image-popup-modal" role="dialog" aria-modal="true">
                    <button type="button" className="image-popup-close" onClick={() => setIsImageModalOpen(false)} aria-label="Close image preview">&times;</button>
                    <div className="image-popup-stage">
                    
                    {displayImages.length > 1 && (
                        <button type="button" className="image-popup-arrow image-popup-arrow-left" onClick={() => setModalImageIndex((prev) => (prev > 0 ? prev - 1 : displayImages.length - 1))} aria-label="Previous image">&#10094;</button>
                    )}

                    <img src={getImageUrl(displayImages[modalImageIndex]?.image)} alt="Product preview" />

                    {displayImages.length > 1 && (
                        <button type="button" className="image-popup-arrow image-popup-arrow-right" onClick={() => setModalImageIndex((prev) => (prev < displayImages.length - 1 ? prev + 1 : 0))} aria-label="Next image">&#10095;</button>
                    )}
                    </div>
                </div>
            )}

            {isRelatedProductsOpen && relatedProducts.length > 0 && (
                <RelatedProductsModal
                    key={relatedProducts.map((product) => product.id || product.pk || product.uuid).join("-")}
                    products={relatedProducts}
                    sourceProductId={productId}
                    onClose={() => setIsRelatedProductsOpen(false)}
                    onAddSelected={addSelectedRelatedProducts}
                    onRefreshChoices={refreshRelatedProducts}
                />
            )}

        </div>
    );
}

export default Single_product;
