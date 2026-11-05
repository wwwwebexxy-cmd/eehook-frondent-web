import { WHATSAPP_NUMBER } from "../../config/contact";

export const buildWhatsAppMessage = (orderId, address = {}, items = [], total = 0) => {
    const itemLines = (Array.isArray(items) ? items : []).map((item) => {
        const variant = item.variant_size !== null && item.size
            ? `, ${item.unit_type || "Option"}: ${item.size}`
            : "";
        return `- ${item.product_name}${variant} x ${item.quantity}`;
    });

    const numericTotal = Number(total);
    const safeTotal = Number.isFinite(numericTotal) ? numericTotal : 0;

    return [
        "Hello eehook Team,",
        "",
        `I placed an order via WhatsApp. Order: ORD-${String(orderId).padStart(6, "0")}`,
        "",
        "Items:",
        ...itemLines,
        "",
        `Total: AED ${safeTotal.toFixed(2)}`,
        "",
        "Delivery address:",
        address.full_name || "",
        address.phone || "",
        address.address_line || "",
        `${address.city || ""}${address.emirate ? `, ${address.emirate}` : ""}, ${address.postal_code || ""}`,
        address.country || "",
    ].join("\n");
};

export const buildWhatsAppOrderUrl = ({ orderId, address, items, total }) => {
    const message = buildWhatsAppMessage(orderId, address, items, total);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};
