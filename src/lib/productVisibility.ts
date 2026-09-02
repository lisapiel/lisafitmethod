// Feature-launch flags for customer-facing product visibility.
//
// When a product's flag is `false`, ALL customer-facing surfaces (menus,
// drawers, cross-sells, upsells, emails, dropdowns, checkout pickers,
// etc.) hide it. Admin surfaces, backend entitlement logic, existing
// entitlement records, protected routes, and pricing constants are
// unaffected — an admin can still reach and administer the product,
// and any customer who already has real access (unlikely for unlaunched
// products) still gets in via direct URL.
//
// Flip to `true` when the product is ready to promote publicly.

export const MASTERCLASS_CUSTOMER_VISIBLE = false
