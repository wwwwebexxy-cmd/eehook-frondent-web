# Implementation Plan: Used-product variants and pricing

## Overview

Add an optional used-product workflow to the existing EEHOOK catalog without
breaking normal products, legacy variant/unit cart lines, or existing offer
calculation. Dashboard users can mark a product as standard or used, leave
subcategory empty, select multiple subcategories, and configure purchasable
variant combinations with optional Color, Size, Connectivity, Finishing,
Storage, and Grade values. Each combination exposes its own base price and
optional offer price. The storefront detail page derives the available option
groups from the API and updates the selected price, stock, image, URL, and cart
line together.

## API contract

- `Product.product_type`: optional response/write field, `standard` (default)
  or `used`.
- `Product.subcategory`: remains as the legacy primary subcategory but becomes
  nullable for new products.
- `Product.subcategories`: response-only list of all selected subcategories.
- `Product.subcategory_ids`: optional write-only list used by the admin API;
  the first value is kept as the legacy primary subcategory.
- `ProductVariant.option_values`: optional JSON object whose keys are the
  supported labels `size`, `connectivity`, `finishing`, `storage`, and `grade`.
  Values are non-empty strings. Existing `color` remains the normal color FK.
- `ProductVariant.offer_price`: optional positive decimal lower than `price`.
- `ProductVariantUnit.offer_price`: optional positive decimal lower than `price`
  for legacy multiple-price rows.
- Existing `price`, `discounted_price`, offer fields, cart payloads, and order
  persistence remain backward compatible. A direct offer price is used only
  when present; otherwise the existing dated dashboard offer calculation wins.

## Architecture decisions

- Use complete purchasable combination rows (`ProductVariant`) for used
  products instead of introducing a second product model. This preserves the
  current variant/image/cart relationships and lets each Color + option
  combination have an independent stock and price.
- Keep `ProductVariantUnit` for existing multiple-price products and add the
  same optional offer-price behavior there. Do not migrate existing units into
  the new combination format.
- Add a `Product.subcategories` many-to-many relationship while retaining the
  legacy `subcategory` FK for filters and old clients. Sync both at the admin
  serializer boundary.
- Validate option values and prices at the API boundary; normalize blank
  optional fields to `null`/`{}` so duplicate and selection behavior is stable.
- Frontend option selection is derived from returned variant rows, not from
  hardcoded catalog data. Normal products continue using their current color
  and unit UI.

## Task List

### Phase 1: Contract and schema

- [ ] Add additive product/variant fields and the multi-subcategory relation.
- [ ] Add migration and model validation for nullable/optional fields.
- [ ] Add pricing helpers so direct offer prices and dated offers produce one
      consistent effective price across product cards, detail, cart, and orders.

### Phase 2: API and admin vertical slice

- [ ] Extend public/admin serializers and admin CRUD sync for product type,
      subcategories, option values, and offer prices.
- [ ] Add backend regression tests for used combinations, validation,
      subcategory syncing, and effective pricing.
- [ ] Extend ProductEditor with used-product mode, optional multi-select
      subcategories, custom option fields, and base/offer price inputs while
      preserving the existing standard editor.

### Checkpoint: API/admin

- [ ] Focused backend tests pass.
- [ ] Existing backend product/offer tests pass.
- [ ] Dashboard tests pass for standard and used-product payloads.

### Phase 3: Storefront vertical slice

- [ ] Extend product/detail payload handling and selection state for option
      combinations and condition label mapping.
- [ ] Update detail UI to show Color, Storage, Condition, and any configured
      custom option groups; update price, stock, image, URL, and cart selection.
- [ ] Add frontend regression tests for combination selection and price changes.

### Checkpoint: storefront

- [ ] Frontend focused tests and full suite pass.
- [ ] Production build succeeds.
- [ ] Browser check at desktop and 320px confirms selectors and price changes.

### Phase 4: Release verification

- [ ] Backend `manage.py check` and migration plan are clean.
- [ ] `git diff --check` passes in both repos.
- [ ] Review the final diff for secrets and unrelated changes.
- [ ] Commit locally in atomic backend/frontend commits; do not push/deploy
      until the user explicitly confirms.

## Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Existing products rely on the primary subcategory FK | High | Keep the FK and sync the first selected M2M value. |
| Direct offer prices conflict with dated Offers | High | Centralize effective-price calculation and add tests for precedence. |
| Combination variants share a color | Medium | Allow option-distinct rows and select by the full option key. |
| Existing cart/order lines only know variant/unit IDs | High | Keep IDs and price snapshots; send the selected variant ID as before. |
| Very large selector matrices | Medium | Render only values returned by API and require a complete combination. |

## Open questions

- None required for the first implementation. The requested default option
  values remain optional; admins can enter custom values in the dashboard.
