import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../../lib/ApiClient";
import "../style/Checkout.css";
import { getImageUrl } from "../../../utils/imageUrl";
import showToast from "../../../utils/toast";
import { clearCouponApplication, isInactiveCouponError } from "../../coupon/couponState";
import { getSafeCheckoutUrl } from "../../../lib/checkoutUrl";

const Checkout = () => {

    const navigate = useNavigate();

    const [addresses, setAddresses] = useState([]);
    const [cartItems, setCartItems] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);

    const [cartSummary, setCartSummary] = useState({
        subtotal: 0,
        shipping: 0,
        total: 0,
        discount: 0,
    });

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [checkoutError, setCheckoutError] = useState("");

    const fetchAddresses = useCallback(async () => {

        try {

            const response = await client.get("addresses/");

            setAddresses(response.data);

            if (response.data.length > 0) {

                setSelectedAddress(response.data[0].id);

            }

        } catch (error) {

            console.log(error);

        }

    }, []);

    const fetchCart = useCallback(async () => {

        try {

            const response = await client.get("cart/");

            const cartData = response.data || {};
            const inactiveItems = (Array.isArray(cartData.items) ? cartData.items : []).filter((item) => item.coupon_status === "COUPON_INACTIVE");
            inactiveItems.forEach((item) => clearCouponApplication(item.product, item.coupon_code));

            setCartItems(cartData.items || []);

            setCartSummary({
                subtotal: Number(cartData.subtotal || 0),
                shipping: Number(cartData.shipping || 0),
                total: Number(cartData.total || 0),
                discount: Number(cartData.discount || 0),
            });

            return cartData;

        } catch (error) {

            console.log(error);
            setCheckoutError("Could not refresh your cart. Please try again.");
            return null;

        }

    }, []);

    useEffect(() => {
        const loadCheckout = async () => {
            await Promise.all([
                fetchAddresses(),
                fetchCart()
            ]);

            setLoading(false);
        };

        loadCheckout();
    }, [fetchAddresses, fetchCart]);

    const proceedToPayment = async () => {

        if (processing) return;

        if (!selectedAddress) {

            alert("Please select delivery address");

            return;

        }

        try {

            setProcessing(true);
            setCheckoutError("");

            const latestCart = await fetchCart();
            if (!latestCart) {
                setProcessing(false);
                return;
            }

            const inactiveItems = (Array.isArray(latestCart.items) ? latestCart.items : []).filter((item) => item.coupon_status === "COUPON_INACTIVE");
            if (inactiveItems.length) {
                inactiveItems.forEach((item) => clearCouponApplication(item.product, item.coupon_code));
                setCheckoutError("This coupon is no longer active. Your cart has been updated.");
                showToast.warning("This coupon is no longer active. Your cart has been updated.");
                setProcessing(false);
                return;
            }

            // A failed checkout attempt must never reuse a key: each button
            // click represents a new user-initiated checkout operation.
            const idempotencyKey = crypto.randomUUID();
            const response = await client.post(
                "payment/create-checkout-session/",
                {
                    address: selectedAddress
                },
                {
                    headers: { "Idempotency-Key": idempotencyKey }
                }
            );

            window.location.assign(getSafeCheckoutUrl(response.data?.checkout_url));

        } catch (error) {

            console.log(error);
            if (isInactiveCouponError(error)) {
                const responseData = error.response?.data || {};
                clearCouponApplication(null, responseData.coupon_code);
                setCheckoutError("This coupon is no longer active. Your cart has been updated.");
                showToast.warning("This coupon is no longer active. Your cart has been updated.");
                await fetchCart();
            } else {
                setCheckoutError("Unable to continue payment. Please try again.");
            }

            setProcessing(false);

        }

    };

    if (loading) {

        return (

            <div className="checkout-loading">

                Loading...

            </div>

        );

    }
        return (

        <div className="eehook-checkout">

            <div className="eehook-checkout-header">

                <h1 className="eehook-checkout-title">

                    Checkout

                </h1>

                <p className="eehook-checkout-subtitle">

                    Complete your purchase securely.

                </p>

                {checkoutError && <p className="coupon-inactive-warning" role="alert">{checkoutError}</p>}

            </div>

            <div className="eehook-checkout-wrapper">

                <div className="eehook-checkout-left">

                    <div className="eehook-checkout-card">

                        <div className="eehook-card-header">

                            <h2>

                                Delivery Address

                            </h2>

                            <button
                                className="eehook-add-address-btn"
                                onClick={() => navigate("/profile")}
                            >

                                + Add Address

                            </button>

                        </div>

                        {

                            addresses.length === 0 ?

                                <div className="eehook-empty-box">

                                    <p>

                                        No address found

                                    </p>

                                </div>

                                :

                                addresses.map((address) => (

                                    <div
                                        key={address.id}
                                        className={`eehook-address-card ${
                                            selectedAddress === address.id
                                                ? "active"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            setSelectedAddress(address.id)
                                        }
                                    >

                                        <input
                                            type="radio"
                                            checked={
                                                selectedAddress === address.id
                                            }
                                            onChange={() =>
                                                setSelectedAddress(address.id)
                                            }
                                        />

                                        <div className="eehook-address-info">

                                            <h4>

                                                {address.full_name}

                                            </h4>

                                            <p>

                                                {address.phone}

                                            </p>

                                            <p>

                                                {address.address_line}

                                            </p>

                                            <p>

                                                {address.city},{" "}
                                                {address.postal_code}

                                            </p>

                                            <p>

                                                {address.country}

                                            </p>

                                        </div>

                                    </div>

                                ))

                        }

                    </div>

                    <div className="eehook-checkout-card">

                        <h2>

                            Payment Method

                        </h2>

                        <div className="eehook-payment-card">

                            <div className="eehook-payment-title">

                                Stripe Secure Payment

                            </div>

                            <p>

                                Visa, Mastercard, Apple Pay,
                                Google Pay and other cards
                                are supported.

                            </p>

                        </div>

                    </div>

                </div>

                <div className="eehook-checkout-right">

                    <div className="eehook-checkout-card">

                        <h2>

                            Order Summary

                        </h2>

                        {

                            cartItems.length === 0 ?

                                <div className="eehook-empty-box">

                                    <p>

                                        Your cart is empty

                                    </p>

                                </div>

                                :

                                cartItems.map((item) => (

                                    <div
                                        key={item.id}
                                        className="eehook-summary-item"
                                    >

                                        <div className="eehook-summary-image">

                                            <img
                                                src={getImageUrl(item.product_image)}
                                                alt={item.product_name}
                                            />

                                        </div>

                                        <div className="eehook-summary-details">

                                            <h4>

                                                {item.product_name}

                                            </h4>

                                            {item.variant_size !== null && (
                                                <p>

                                                    {item.unit_type || "Variant Option"} : {item.size}

                                                </p>
                                            )}

                                            <p>

                                                Color : {item.color}

                                            </p>

                                            {item.coupon_status === "COUPON_INACTIVE" && (
                                                <p className="coupon-inactive-warning" role="alert">
                                                    This coupon is no longer active.
                                                </p>
                                            )}

                                            <p>

                                                Qty : {item.quantity}

                                            </p>

                                        </div>

                                        <div className="eehook-summary-price">

                                            AED{Number(item.total_price).toFixed(2)}

                                        </div>

                                    </div>

                                ))

                        }

                        <div className="eehook-summary-total">
                                                        <div className="eehook-summary-row">

                                <span>

                                    Subtotal

                                </span>

                                <span>

                                            AED{cartSummary.subtotal.toFixed(2)}

                                </span>

                            </div>

                            {/* <div className="eehook-summary-row">

                                <span>

                                    Offer Discount

                                </span>

                                <span
                                    style={{
                                        color: "#1d9d55",
                                        fontWeight: "600",
                                    }}
                                >

                                    -₹{cartSummary.discount.toFixed(2)}

                                </span>

                            </div> */}

                            <div className="eehook-summary-row">

                                <span>

                                    Shipping

                                </span>

                                <span>

                                    {
                                        cartSummary.shipping === 0
                                            ? "FREE"
                                            : `AED${cartSummary.shipping.toFixed(2)}`
                                    }

                                </span>

                            </div>

                            <div className="eehook-summary-row">

                                <span>

                                    Tax

                                </span>

                                <span>

                                    Included

                                </span>

                            </div>

                            <div className="eehook-summary-divider"></div>

                            <div className="eehook-grand-total">

                                <div>

                                    <h3>

                                        Total

                                    </h3>

                                </div>

                                <h2>

                                            AED{cartSummary.total.toFixed(2)}

                                </h2>

                            </div>

                        </div>

                        <button
                            className="eehook-checkout-btn"
                            onClick={proceedToPayment}
                            disabled={processing}
                        >

                            {

                                processing

                                    ?

                                    "Redirecting..."

                                    :

                                    "Proceed to Payment"

                            }

                        </button>

                        <p className="eehook-payment-note">

                            You will be redirected securely to Stripe
                            to complete your payment.

                        </p>

                    </div>

                </div>

            </div>

        </div>

    );

};

export default Checkout;
