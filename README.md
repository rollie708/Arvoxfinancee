# ARVOX Finance — pre-launch site

You just entered the ARVOX wallet (concept). Static, no build step. 4 pages: `index.html` (enter), `demo.html` (product demo), `technology.html` (tech/security/vision), `waitlist.html` (get inside).

> ARVOX is building an intelligent self-custodial wallet for simpler, safer on-chain interactions.
> ARVOX is currently in development. DEMO only — no live transactions.

## Deploy on Vercel

- Preset: Other, no build command, root `./`
- Files: `index.html demo.html technology.html waitlist.html 404.html arvox.css arvox.js config.js favicon.svg robots.txt sitemap.xml vercel.json`
- `vercel.json` rewrites map every wallet route to a real page, so direct visits / refresh never 404.

## Routes (all 200 on direct visit; unknown paths get styled 404.html)

- `/` → Enter · `/demo` → wallet demo · `/technology` → tech/security/vision · `/waitlist` → waitlist
- `/assets /activity /ai` → demo with matching tab · `/send /swap /bridge` → demo + card highlight (COMING SOON)
- `/settings /automations /payments` → demo with contextual DEMO note
- `/security /permissions` → technology, scrolled to security section
- Legacy `.html` URLs still resolve (backward compatible).

## Environment variables

`.env.example` lists all keys. Client-safe only (`config.js`):

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` → wallet connect (unset = Connect stays “soon”)
- `RPC_URL` → chain reads (unset = Data unavailable)
- `MARKET_DATA_API_KEY` → prices (unset = Data unavailable)
- `WAITLIST_API_URL` → POST endpoint, e.g. `/api/waitlist`
- `DATABASE_URL` → server only. Never in client code.

Missing provider → UI shows **Data unavailable**, never invented numbers.

## Rules enforced

No seed/private-key flows, no auto-sign/send, no silent connect, no swaps/bridges pre-launch. No fake testimonials/users/partnerships/audits/hashes. DEMO + COMING SOON labels throughout.

## Local preview

```powershell
powershell -ExecutionPolicy Bypass -File ../serve.ps1 -Port 8000
# serves the arvox/ folder: http://localhost:8000/ /demo /technology /waitlist ...
```

## Production audit (2026-10-05, local server)

27/27 checks pass: all routes + legacy `.html` URLs 200, assets 200, sitemap/robots 200,
unknown path → 404 with styled body. Script: `%TEMP%\opencode\audit_tmp.ps1`.
Also verified: no `.html"` links left in pages, `=null` label typo fixed,
mobile menu closes on navigate/Escape/resize, noscript fallback keeps pages visible.
