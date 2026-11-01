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

Do not serve the repository root as plain static files: it contains Vite source,
including npm module imports that browsers cannot resolve directly. Deploy the
**built `dist/` directory**. Relative asset URLs support the project path
`/secha-jourimanzky-wardrobe/` and domain-root hosting.

1. In repository **Settings → Pages → Build and deployment**, select **GitHub Actions**.
2. In **Actions**, select **Build and deploy wardrobe to GitHub Pages** and use **Run workflow** on `main`.
3. Wait for the deploy job to finish, then reload the Pages URL.

The workflow builds with `npm ci`, tests the model, and uploads only `dist/`.
It is manual so committing changes does not publish without an explicit action.
No environment publication is involved.

`npm run test:production` checks stylesheet loading, asset responses, WebGL,
and interactions on a strict static server at the actual project subpath.
A failed application import now displays a loading error instead of spinning forever;
the stylesheet loads independently of the Three.js bundle.

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
