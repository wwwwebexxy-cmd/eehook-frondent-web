import { describe, expect, it } from "vitest";
import { buildWhatsAppOrderUrl } from "./whatsappOrder";

describe("WhatsApp order links", () => {
    it("uses the EEHOOK WhatsApp number and includes order details", () => {
        const url = buildWhatsAppOrderUrl({
            orderId: 27,
            address: {
                full_name: "Sadiq",
                phone: "+971500000000",
                address_line: "Warehouse 9",
                city: "Dubai",
                emirate: "Dubai",
                postal_code: "00000",
                country: "UAE",
            },
            items: [{ product_name: "Smart Watch", quantity: 2, variant_size: null }],
            total: "49.50",
        });

        expect(url).toMatch(/^https:\/\/wa\.me\/971527281919\?text=/);

        const message = decodeURIComponent(url.split("?text=")[1]);
        expect(message).toContain("ORD-000027");
        expect(message).toContain("Smart Watch x 2");
        expect(message).toContain("Total: AED 49.50");
        expect(message).toContain("Warehouse 9");
    });
});
