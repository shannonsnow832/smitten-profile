# Smitten Singles Participant Profile App - Rebuild Handoff

Rebuilt 2026-08-24 from the GHL AI Studio code extraction of the app live at
profile.smittensingles.com. React + Vite + TypeScript + Tailwind + shadcn/ui + Supabase.

This is a straight rebuild to get the extraction running outside AI Studio. No app logic,
UI behavior, or copy was changed.

## Verified state

- `npm install` clean, 464 packages.
- `npm run build` passes. Only warning is the 691 kB chunk size notice.
- `npx tsc --noEmit` clean.
- `npm run dev` serves, and the app mounts and renders the Gate screen with full copy,
  header, and footer. The production build renders with zero console errors.

## Files added during the rebuild

The extraction did not include these. They are scaffolding, not app code.

- `index.html` - authored. The live AI Studio version may carry a favicon, analytics,
  fonts, or meta tags that are not reflected here. Worth re-extracting.
- `src/vite-env.d.ts` - one-line vite/client reference.
- `.gitignore`

`src/components/ui/` was not in the extraction and was reconstructed from the stock
shadcn registry at pinned tag `shadcn@2.3.0`, style `default`, which matches
`components.json`.

## OPEN ITEMS

### 1. components/ui/ is not verified against the live app

`components/ui/` was extracted on the assumption that every file was stock shadcn.
`progress.tsx` turned out to be customized: `CompletenessCard.tsx` passes an
`indicatorClassName` prop that stock shadcn does not accept, which failed typecheck.
That prop was restored and forwarded to the Indicator.

Other files in that folder may carry the same kind of undocumented brand customization.
Typecheck only catches customizations that add new props. A styling change inside an
otherwise stock file passes silently and simply renders slightly wrong.

NOT re-extracted or diffed in this pass. Deliberate. Left open.

### 2. Supabase is untested

The rebuild environment blocks outbound access to `*.supabase.co`, so sign-in, OTP, and
every RPC are unverified. Needs a browser pass from a normal machine.

`src/lib/supabase.ts` points at production project `qgctltxcgsnbrdtbhmay` and uses the
legacy anon JWT rather than the modern `sb_publishable_` key. Unchanged.

### 3. Dev sign-in bypass is intentional and stays

`Gate.tsx` carries a dev sign-in path with a hardcoded email, enabled when the hostname
contains `preview`, `vibepreview`, or `localhost`, or when `import.meta.env.DEV` is set.
It still sends a real OTP, so it is not an authentication bypass. Confirmed 2026-08-24:
leave in place, no changes.

### 4. Smaller notes

- No eslint config, so `npm run lint` fails even though the script and deps are declared.
- No test files, though vitest is wired into `package.json` and `tsconfig.json`.
- The header logo is hotlinked from `vibe.filesafe.space`, a GHL asset host.
- `PhotoGrid.tsx` is 414 lines. See the line-limit rule in `src/lib/rules.ts`.
- `BugBanner.tsx` writes directly to the `bug_reports` table and uploads to the
  `bug-screenshots` and `profile-photos` storage buckets. Not a rules violation, since the
  RPC rule covers profile reads and writes, but the direct paths are there.
- `vite.config.ts` sets `server.host: "::"`, which fails on hosts without IPv6. Unchanged,
  it works normally on a standard machine.
- In dev only, `@leadconnector/vibe-tagger` injects refs into components and produces
  React ref warnings, plus a generated `src/tailwind.config.vibe.json` that is gitignored.
  The production build is clean.

## Rules change in this commit

The 400-line file limit in `src/lib/rules.ts` was rewritten to scope it to AI Studio and
flag Lovable output as unverified. Requested wording was kept intact except for one em
dash, replaced with a period, because the file's own rule forbids em dashes in any string.
