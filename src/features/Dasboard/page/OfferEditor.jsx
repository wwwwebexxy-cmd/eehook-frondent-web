import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { FiSave, FiSearch } from "react-icons/fi";
import { getErrorMessage, getResource, listResource, createResource, updateResource } from "../services/adminApi";
import { LoadingState } from "../components/AdminPrimitives";
import "../styles/OfferEditor.css";

const emptyOffer = {
    title: "",
    description: "",
    discount_type: "PERCENTAGE",
    discount_percentage: "",
    fixed_amount: "",
    start_date: "",
    end_date: "",
    is_active: true,
    product: "",
    variants: [],
    variant_mode: "all",
    image: null,
};

const rows = (payload) => Array.isArray(payload) ? payload : Array.isArray(payload?.results) ? payload.results : [];
const idOf = (value) => value?.id ?? value?.pk ?? value?.uuid ?? value;
const relationId = (value) => String(idOf(value) ?? "");
const relationIds = (value) => rows(value).map(relationId).filter(Boolean);
const dateValue = (value) => String(value || "").match(/^(\d{4}-\d{2}-\d{2})/)?.[1] || "";

async function listAllResourceRows(resource) {
    const collected = [];
    let page = 1;
    while (page <= 1000) {
        const response = await listResource(resource, { page, page_size: 100 });
        const payload = response.data;
        const pageRows = rows(payload);
        collected.push(...pageRows);
        if (Array.isArray(payload) || !payload?.next || !pageRows.length) break;
        page += 1;
    }
    return collected;
}

function productLabel(product) {
    return product?.name || `Product #${idOf(product)}`;
}

function variantLabel(variant) {
    const color = typeof variant?.color === "object" ? variant.color?.name : variant?.color;
    return color || variant?.sku || `Variant #${idOf(variant)}`;
}

function readOffer(data = {}) {
    const products = relationIds(data.products);
    const variants = relationIds(data.variants);
    return {
        ...emptyOffer,
        ...data,
        product: products[0] || "",
        variants,
        variant_mode: variants.length ? "selected" : "all",
        discount_percentage: data.discount_percentage ?? "",
        fixed_amount: data.fixed_amount ?? "",
        start_date: dateValue(data.start_date),
        end_date: dateValue(data.end_date),
        image: null,
    };
}

export default function OfferEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const editing = Boolean(id);
    const [form, setForm] = useState(emptyOffer);
    const [products, setProducts] = useState([]);
    const [variants, setVariants] = useState([]);
    const [productSearch, setProductSearch] = useState("");
    const [productPickerOpen, setProductPickerOpen] = useState(false);
    const [loading, setLoading] = useState(editing);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const productPickerRef = useRef(null);

    useEffect(() => {
        let active = true;
        Promise.all([
            listAllResourceRows("products"),
            listAllResourceRows("product-variants"),
            editing ? getResource("offers", id) : Promise.resolve({ data: null }),
        ]).then(([productResponse, variantResponse, offerResponse]) => {
            if (!active) return;
            setProducts(productResponse);
            setVariants(variantResponse);
            if (offerResponse.data) {
                const nextForm = readOffer(offerResponse.data);
                setForm(nextForm);
                const selectedProduct = productResponse.find((product) => String(idOf(product)) === String(nextForm.product));
                setProductSearch(selectedProduct ? productLabel(selectedProduct) : "");
            }
        }).catch((requestError) => {
            if (active) setError(getErrorMessage(requestError, "Could not load offer options."));
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => { active = false; };
    }, [editing, id]);

    useEffect(() => {
        const closePicker = (event) => {
            if (!productPickerRef.current?.contains(event.target)) setProductPickerOpen(false);
        };
        document.addEventListener("mousedown", closePicker);
        return () => document.removeEventListener("mousedown", closePicker);
    }, []);

    const productVariants = useMemo(
        () => variants.filter((variant) => String(idOf(variant.product)) === String(form.product)),
        [variants, form.product],
    );

    const filteredProducts = useMemo(() => {
        const query = productSearch.trim().toLowerCase();
        return products
            .filter((product) => !query || `${productLabel(product)} ${idOf(product)}`.toLowerCase().includes(query))
            .slice(0, 12);
    }, [products, productSearch]);

    const update = (name, value) => setForm((current) => ({ ...current, [name]: value }));
    const selectProduct = (product) => {
        const productId = String(idOf(product));
        setForm((current) => ({ ...current, product: productId, variants: [], variant_mode: "all" }));
        setProductSearch(productLabel(product));
        setProductPickerOpen(false);
    };
    const toggleVariant = (variantId) => setForm((current) => {
        const idValue = String(variantId);
        const selected = current.variants.map(String);
        const next = selected.includes(idValue)
            ? selected.filter((value) => value !== idValue)
            : [...selected, idValue];
        return { ...current, variants: next };
    });

    const validate = () => {
        if (!form.title.trim()) return "Offer title is required.";
        if (!form.description.trim()) return "Offer description is required.";
        if (!form.product) return "Select a product for this offer.";
        if (!form.start_date || !form.end_date) return "Start date and expiry date are required.";
        if (form.end_date < form.start_date) return "Expiry date must be on or after the start date.";
        if (form.discount_type === "PERCENTAGE" && (Number(form.discount_percentage) <= 0 || Number(form.discount_percentage) > 100)) return "Enter a percentage between 0 and 100.";
        if (form.discount_type === "FIXED" && Number(form.fixed_amount) <= 0) return "Enter a fixed amount greater than 0.";
        if (form.variant_mode === "selected" && productVariants.length > 1 && !form.variants.length) return "Select at least one variant or choose All variants.";
        if (!editing && !(form.image instanceof File)) return "Offer image is required.";
        return "";
    };

    const save = async (event) => {
        event.preventDefault();
        const validation = validate();
        if (validation) {
            setError(validation);
            return;
        }
        if (!window.confirm(editing ? "Save changes to this offer?" : "Create this offer?")) return;
        setSaving(true);
        setError("");
        const data = {
            title: form.title.trim(),
            description: form.description.trim(),
            discount_type: form.discount_type,
            discount_percentage: form.discount_type === "PERCENTAGE" ? Number(form.discount_percentage) : null,
            fixed_amount: form.discount_type === "FIXED" ? Number(form.fixed_amount) : null,
            start_date: form.start_date,
            end_date: form.end_date,
            is_active: Boolean(form.is_active),
            products: [Number(form.product)],
            variants: form.variant_mode === "selected" && productVariants.length > 1 ? form.variants.map(Number) : [],
        };
        try {
            let payload = data;
            if (form.image instanceof File) {
                payload = new FormData();
                Object.entries(data).forEach(([key, value]) => payload.append(key, Array.isArray(value) ? JSON.stringify(value) : value === null ? "" : String(value)));
                payload.append("image", form.image);
            }
            if (editing) await updateResource("offers", id, payload);
            else await createResource("offers", payload);
            toast.success(`Offer ${editing ? "updated" : "created"} successfully`);
            navigate("/eehook-dashboard/offers", { replace: true });
        } catch (requestError) {
            setError(getErrorMessage(requestError, "Could not save offer."));
            toast.error(getErrorMessage(requestError, "Could not save offer."));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="admin-page"><LoadingState label="Loading offer editor..." /></div>;
    return <div className="admin-page offer-editor-page">
        <button type="button" className="admin-back-link" onClick={() => navigate("/eehook-dashboard/offers")}>Back to Offers</button>
        <div className="admin-page-header"><div><p className="admin-eyebrow">OFFER MANAGEMENT</p><h2>{editing ? "Edit Offer" : "Create Offer"}</h2><p>Select the product and decide whether the offer applies to all variants or selected variants.</p></div></div>
        <form className="admin-panel admin-form offer-editor-form" onSubmit={save}>
            <div className="admin-form-grid">
                <label className="admin-form-field"><span>Offer title *</span><input value={form.title} onChange={(event) => update("title", event.target.value)} /></label>
                <label className="admin-form-field"><span>Offer image {!editing && "*"}</span><input type="file" accept="image/*" onChange={(event) => update("image", event.target.files?.[0] || null)} /></label>
                <label className="admin-form-field admin-form-field-wide"><span>Description *</span><textarea rows="4" value={form.description} onChange={(event) => update("description", event.target.value)} /></label>
                <label className="admin-form-field"><span>Discount type *</span><select value={form.discount_type} onChange={(event) => update("discount_type", event.target.value)}><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed amount</option></select></label>
                {form.discount_type === "PERCENTAGE" ? <label className="admin-form-field"><span>Discount percentage (%) *</span><input type="number" min="0.01" max="100" step="0.01" value={form.discount_percentage} onChange={(event) => update("discount_percentage", event.target.value)} /></label> : <label className="admin-form-field"><span>Fixed amount *</span><input type="number" min="0.01" step="0.01" value={form.fixed_amount} onChange={(event) => update("fixed_amount", event.target.value)} /></label>}
                <label className="admin-form-field"><span>Start date *</span><input type="date" value={form.start_date} onChange={(event) => update("start_date", event.target.value)} /></label>
                <label className="admin-form-field"><span>Expiry date *</span><input type="date" value={form.end_date} onChange={(event) => update("end_date", event.target.value)} /></label>
            </div>
            <section className="offer-target-section"><div className="offer-target-heading"><div><h3>Offer target</h3><p>Choose one product. If all variants is selected, every variant of this product receives the offer.</p></div></div>
                <div className="admin-form-field offer-product-picker" ref={productPickerRef}>
                    <span>Product *</span>
                    <div className="offer-product-search-wrap">
                        <FiSearch aria-hidden="true" />
                        <input
                            type="search"
                            value={productSearch}
                            onFocus={() => setProductPickerOpen(true)}
                            onChange={(event) => { setProductSearch(event.target.value); setProductPickerOpen(true); }}
                            placeholder="Search products or choose from the dropdown"
                            aria-label="Search products"
                            aria-expanded={productPickerOpen}
                            aria-autocomplete="list"
                        />
                    </div>
                    {productPickerOpen && <div className="offer-product-suggestions" role="listbox" aria-label="Product suggestions">
                        {filteredProducts.length ? filteredProducts.map((product) => <button type="button" className="offer-product-suggestion" role="option" key={idOf(product)} onClick={() => selectProduct(product)}><span>{productLabel(product)}</span><small>Product #{idOf(product)}</small></button>) : <p className="offer-product-empty">No matching products found.</p>}
                    </div>}
                    <small className="offer-field-help">Search by product name, then select a suggestion.</small>
                </div>
                {form.product && productVariants.length > 1 && <fieldset className="offer-variant-choice"><legend>Variants</legend><label><input type="radio" name="variant_mode" checked={form.variant_mode === "all"} onChange={() => update("variant_mode", "all")} /> All variants</label><label><input type="radio" name="variant_mode" checked={form.variant_mode === "selected"} onChange={() => update("variant_mode", "selected")} /> Select specific variants</label></fieldset>}
                {form.product && productVariants.length === 1 && <p className="offer-single-variant-note">This product has one sellable variant ({productVariants[0].price_type === "multiple" ? "multiple-price units" : "single price"}). The product selection will apply the offer to it.</p>}
                {form.product && form.variant_mode === "selected" && productVariants.length > 1 && <div className="offer-variant-list">{productVariants.map((variant, index) => <label className="offer-variant-option" key={idOf(variant)}><input type="checkbox" checked={form.variants.map(String).includes(String(idOf(variant)))} onChange={() => toggleVariant(idOf(variant))} /><span>Variant {index + 1}{variantLabel(variant) ? ` · ${variantLabel(variant)}` : ""}</span><small>{variant.price_type === "multiple" ? "Multiple price" : "Single price"}</small></label>)}</div>}
            </section>
            <label className="admin-form-field offer-active-toggle"><span>Active</span><input type="checkbox" checked={Boolean(form.is_active)} onChange={(event) => update("is_active", event.target.checked)} /></label>
            {error && <p className="admin-form-error">{error}</p>}
            <div className="admin-modal-actions"><button type="button" className="admin-button secondary" onClick={() => navigate("/eehook-dashboard/offers")}>Cancel</button><button className="admin-button primary" disabled={saving}><FiSave /> {saving ? "Saving..." : "Save Offer"}</button></div>
        </form>
    </div>;
}
