/* ARVOX Finance — client-safe config.
 * Only NEXT_PUBLIC_* values may appear here. Never put DATABASE_URL,
 * private keys, or secret API keys in client-side code — those stay server-only.
 *
 * On Vercel: Settings → Environment Variables → add the NEXT_PUBLIC_* keys,
 * then inject them before arvox.js:
 *   <script>window.ARVOX_CONFIG = {
 *     WALLETCONNECT_PROJECT_ID: "…", RPC_URL: "…",
 *     MARKET_DATA_API_KEY: "…", WAITLIST_API_URL: "/api/waitlist" };</script>
 */
window.ARVOX_CONFIG = Object.assign({
  WALLETCONNECT_PROJECT_ID: "",
  RPC_URL: "",
  MARKET_DATA_API_KEY: "",
  MARKET_API_URL: "",
  WAITLIST_API_URL: "",
  SOCIALS: { X: "https://x.com/arvoxfinance", TELEGRAM: "https://t.me/arvoxfinance", DOCS: "", PRIVACY: "", TERMS: "" }
}, window.ARVOX_CONFIG || {});
