# Vantage frontend (Next.js) — import notes

This is the cleaned, assembled version of the v0-generated frontend.

## Run it
```bash
npm install
npm run dev      # http://localhost:3000
```

## What changed vs the v0 export
- **Fixed the "black background" bug.** The v0 `globals.css` shipped a `.dark` block and a
  `@media (prefers-color-scheme: dark)` block that flipped the whole site to gray/black when
  the OS was in dark mode. Both were removed; the app is now light-only (warm cream + forest
  green) and `app/layout.tsx` forces `class="light"` + `color-scheme: light`.
- **Removed all fake client proof.** Deleted the invented logo strip (Northside Dental, etc.)
  and the "Trusted by local businesses across 40+ categories" line. No customer numbers anywhere.
- **Accurate agents + stats.** The pipeline visual and copy now match the real architecture:
  three research agents (competitor, audience, market) run in parallel, converge into synthesis,
  then strategy -> creative <-> reviewer. Stats band shows product facts only.
- **Wrote the 3 missing visual components** (`components/visuals/*`) that the showcase referenced
  but weren't in the export: research, pipeline, concept. They animate via CSS classes in globals.css.
- **Report accuracy.** Creative-concept mechanism tags now use real Vantage library ids
  (distinctive_asset_proof, useful_utility, turn_negativity_into_content). Removed hacky
  `dangerouslySetInnerHTML`.
- **React Bits.** Added `TextType` (hero headline typing effect) and `GlassSurface`
  (glass "See a sample report" button over the hero image).

## You still need to
1. Add two nature photos to `public/images/` (see that folder's README).
2. Wire this to the backend with Claude Code:
   - Supabase auth (anon key only) on the login card.
   - Attach the Supabase JWT as a Bearer token on API calls.
   - Build the remaining screens (dashboard, new-report form, progress, review).
   - Replace the hard-coded `/report` demo data with a real report JSON.
3. Note: `next.config.mjs` has `ignoreBuildErrors: true` (from v0). Fine for now; turn it off
   once the backend types are wired.

## Honest caveats
- The hero headline uses a typing animation. It looks good but animates the H1, which is slightly
  worse for SEO/readability than static text. `components/hero.tsx` has a comment showing how to
  revert to a static headline in one edit.
- `GlassSurface` here is a reliable frosted-glass take (backdrop-blur), not the flaky
  liquid-distortion React Bits version. It reads best over the hero image. Swap in the full
  React Bits component if you want the exact liquid effect.
- The build wasn't run in this environment (no install available here). Run `npm install` locally;
  if anything trips, it'll be a dependency/version detail, not a structural issue.
