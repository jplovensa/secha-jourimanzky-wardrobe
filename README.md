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

- **Start discovery** opens a point-and-click room exploration. Click numbered 3D
  hotspots or station buttons to choose your viewpoint. The camera stays still
  until you choose a destination; there is no autoplay, timeline or video tour.
- Five tasks award 20 XP each: identify the mirror direction, select a garment,
  open a drawer, inspect the mirror, and move a shoe pair. Collect all five badges
  to unlock Wardrobe Explorer. Repeating an action cannot farm XP. Restart clears
  discovery progress; Escape or Exit returns to normal exploration.
- PBR wood grain, plaster and limestone textures; cloth weave and draped garment
  geometry; rounded joinery, shoe lining/laces, stitched leather, ceramic styling,
  recessed light fittings, and a full-height planar mirror. These are procedural
  approximations, not manufacturer scans or a path-traced photograph.
- Layout and entrance views plus the **original** floorplan reference, with entrance
  at top. This plan remains a baseline for comparison with furniture revisions.
- The finished floor is 2022 × 2157 mm and ceiling underside is 2610 mm. One model
  unit is one metre. Viewpoints use 1600 mm eye height. The exterior approach is
  illustrative because the retained entrance pocket has no surveyed dimensions.
- The stool is removed. Drawers, props, lighting, material options and PNG export
  remain interactive. The optional supplied MP4 is available separately as
  **Reference film**, with native playback controls.

## Furniture revisions

Choose **Edit furniture layout**, then select furniture in the scene or dropdown.
Eight assemblies are editable: chest, both rear shelves, L rails, right upper/low
shelves, entrance shoe cabinet, and mirror. Contents move with their assembly.

- Hold and drag any furniture surface to place the whole assembly across the floor.
  Selection is automatic, height stays fixed, and the camera remains stationary.
  Mouse, pen and touch are supported; release to drop. Escape cancels a drag.
- Drag empty space to orbit. Use coloured move/rotate handles for height and rotation.
  Minimise the panel for an unobstructed view. Out-of-canvas drops and interrupted
  touch gestures release the camera controls safely. Each completed drag is one undo step.
- Enter structural **left edge X / base AFF Y / rear edge Z** in millimetres and
  rotation in degrees. Styling props do not change the structural edge measurements.
- Snap toggles 25 mm translation / 15° rotation. Undo/Redo retain up to 50 edits;
  Reset to floorplan restores the initial measured positions.
- Export revision downloads a versioned JSON file in mm. Import restores the
  revision and supports Undo. Files for other room dimensions, unknown furniture,
  duplicate IDs or non-finite coordinates are rejected before applying changes.
- Revisions last for the current page session unless exported. The room shell and
  measured dimensions stay fixed. Editing is for spatial revision; it does not
  enforce collision, anchoring or installation-clearance rules.

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
npm run test:production
```

Browser tests use system Chromium by default (`/usr/bin/chromium`); set `CHROMIUM_PATH` for another installation. They exercise WebGL rendering, drawers, movement controls, all four objectives, finish/light controls, PNG download, and mobile viewport overflow. The browser QA hooks in `window.showcase` provide serializable state and projected object coordinates; tests click the actual scene and UI handlers.

No cloud environment is published by this application or its setup commands.

## Startup and rendering recovery

The loading overlay stays visible until the first successful rendered frame. Failed
bundle imports, WebGL initialization, graphics context loss, and render-loop errors
show a retry action. A 20-second loading timeout avoids an indefinite spinner.
The mirror render target, shadow map, and maximum pixel ratio are bounded, and
idle scenes skip rendering until controls, camera, assets, or dimensions change.

Production regression tests cover blocked bundles, unavailable WebGL, context loss,
and idle redraw suppression in addition to the normal interactive workflow.
