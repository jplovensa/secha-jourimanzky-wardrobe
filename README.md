# Jourimanzky / SECHA Studio+

An interactive Three.js wardrobe presentation using the main-bay dimensions from **Jourimanzky WIC Revision 07** and the latest supplied floorplan for placement.

## Run

Requires Node.js 20.19+ or 22.12+ and npm. Tested with Node 24.

```sh
npm ci
npm run dev
```

For a production build: `npm run build`, then `npm run preview`. Deploy the generated `dist/` folder to any static host. No API keys, backend, or external texture downloads are needed.

## GitHub Pages deployment

The repository root now contains a ready-to-serve production app: `index.html`,
`site-assets/`, and `.nojekyll`. This supports the existing **Deploy from a branch →
main → / (root)** Pages configuration. No runtime npm imports or CDN dependencies
are needed by the deployed page.

Editable source is in `app/`. Run `npm run dev` for development. After source
changes, run `npm run build` and commit both the source and regenerated root
`index.html` / `site-assets/`. Do not edit generated bundles directly.
Previous hashed bundles are retained for already-open pages during updates.

The optional GitHub Actions workflow also supports deploying `dist/`. Both
outputs use relative URLs for the project path and domain-root hosting.
`npm run test:production` tests the actual repository root with a plain static
server under `/secha-jourimanzky-wardrobe/`, without Vite or an HTML fallback.

## Presentation

The latest supplied floorplan is the placement authority: hanging on the **right**,
chest and two shelves at the **rear-left**, full-height mirror on the **left**.
The retained D shoe rack is on the **entrance return**, x = 806–2022 mm,
z = 1807–2157 mm: 1216 W × 350 D × 1500 H mm, five levels. The right hanging run
ends at z = 1750 mm, leaving the specified 57 mm nominal gap before the rack.
Room dimensions remain 2022 × 2157 × 2610 mm and rails remain at 1050 / 2000 mm AFF.
The earlier render's reversed orientation and rear-corner shoe column are superseded.
Full-height entrance and left backing walls are visible in entrance/walkthrough modes and cut away in Explore; the dashed entrance pocket still
requires survey and has no invented measured geometry. Verify all dimensions on site.

- Layout and entrance camera presets, plus a labelled SVG floorplan with entrance at
  the top, mirror left, right-hand L hanging, drawers rear-left, and D on the upper return.
- A 31-second guided walkthrough at 1600 mm eye height holds the entrance approach for three seconds,
  crosses the left opening, and visits the aisle, hanging, drawers, mirror, and shoe rack.
  Play/pause, previous/next stops, scrub, replay and Escape/exit are supported.
  The tour pauses in a hidden tab or when opening the presentation film.
- The finished floor is exactly 2022 × 2157 mm; the ceiling underside is at 2610 mm.
  One model unit is one metre. Only the approach before the threshold is illustrative;
  the retained entrance pocket has no surveyed dimensions in the supplied plan.
- PBR teak, oak and walnut options, planar mirror reflections, soft shadows,
  daylight/evening settings and under-shelf lighting.
- Click a drawer to open/close it. Select accessories, then drag or use the arrows.
  The dressing stool has been removed entirely, keeping the measured aisle clear.
- Four exploration objectives, reset placement, and PNG export.
- **Watch the wardrobe film** opens the supplied 10-second MP4 with native playback,
  seeking, volume and fullscreen controls. Close or Escape pauses playback and
  restores focus. Video works independently of WebGL. No autoplay on page load.

Editable media is in `app/public/media/`; `npm run build` includes it in both
`dist/media/` and the branch-deployable root `media/`. The clip is presentation
inspiration rather than a live view of the 3D scene. Materials and accessories
are procedural approximations, not calibrated product scans. Asset staging does
not perform collision checks.

## Validation

```sh
npm test
npm run build
npm run test:e2e
```

Browser tests use system Chromium by default (`/usr/bin/chromium`); set `CHROMIUM_PATH` for another installation. They exercise WebGL rendering, drawers, movement controls, all four objectives, finish/light controls, PNG download, and mobile viewport overflow. The browser QA hooks in `window.showcase` only provide scene selection and serializable state; interactions still use the actual UI handlers.

No cloud environment is published by this application or its setup commands.

## Startup and rendering recovery

The loading overlay stays visible until the first successful rendered frame. Failed
bundle imports, WebGL initialization, graphics context loss, and render-loop errors
show a retry action. A 20-second loading timeout avoids an indefinite spinner.
The mirror render target, shadow map, and maximum pixel ratio are bounded, and
idle scenes skip rendering until controls, camera, assets, or dimensions change.

Production regression tests cover blocked bundles, unavailable WebGL, context loss,
and idle redraw suppression in addition to the normal interactive workflow.
