/**
 * Feature flags — flip these booleans to enable / disable customer-facing features.
 *
 * ECOMMERCE_ENABLED        → cart, checkout, Paystack payments, "Add to cart" buttons
 * CUSTOMER_ACCOUNT_ENABLED → customer login, register, order-history pages
 * SPIN_WIN_EDUCATION_ENABLED → landing page educational section for Spin & Win
 *
 * When a flag is false the feature is hidden site-wide.
 * Set both to true to restore full e-commerce functionality.
 */

/** Online ordering (cart, checkout, Paystack). */
export const ECOMMERCE_ENABLED = false;

/** Customer account features (login, register, my orders). */
export const CUSTOMER_ACCOUNT_ENABLED = false;

const spinWinEducationEnv =
	(process.env.NEXT_PUBLIC_SPIN_WIN_EDUCATION_ENABLED ?? 'true').trim().toLowerCase();

/**
 * Landing page Spin & Win education block.
 * Enabled by default. Set NEXT_PUBLIC_SPIN_WIN_EDUCATION_ENABLED=false to hide.
 */
export const SPIN_WIN_EDUCATION_ENABLED = !['0', 'false', 'no', 'off'].includes(
	spinWinEducationEnv,
);
