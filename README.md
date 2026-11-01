# Jourimanzky / SECHA Studio+

An interactive Three.js wardrobe presentation based on the supplied **Jourimanzky WIC Revision 07** drawings (WIC-01–05).

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

- Dimensioned 2022 × 2157 × 2610 mm main bay, full left-wall planar mirror, right/rear L rails at 1050 / 2000 mm AFF.
- Rear-left four-drawer chest with animated 350 mm extensions, two shelves, right upper/low shelves, and the retained five-level entrance shoe rack.
- Procedural teak grain, physical roughness/metalness materials, environment reflections, soft shadows, day/evening mood, and under-shelf light.
- Orbit/zoom, interior and plan camera presets, three finishes, dimension summary, and PNG view export.
- Select an object by clicking. Click a drawer to open/close it. Select an accessory, then drag it or use the inspector arrows; garments slide along their rail. Reset space restores asset placement.
- Four exploration objectives unlock the Space Curator achievement. Progress lasts for the current page session.

The mirrored wall is visible from inside the room; its back is cut away in the outside presentation. The ceiling and entrance return wall are omitted for visibility. The PDF's dashed entrance pocket has no verified dimensions and is not fabricated. Wood colour is a conceptual TH 356 Baltimore Teak interpretation, not a calibrated manufacturer scan. Oak and walnut are optional conceptual alternatives. Garments and accessories are procedural styling geometry. Asset movement is for staging, without collision or installation-clearance validation. All dimensions remain nominal and need site verification.

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
