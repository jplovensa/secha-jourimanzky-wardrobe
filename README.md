# Jourimanzky / SECHA Studio+

An interactive Three.js wardrobe presentation using the main-bay dimensions from **Jourimanzky WIC Revision 07** and the latest supplied floorplan for placement.

## Run

Requires Node.js 20.19+ or 22.12+ and npm. Tested with Node 24.

```sh
npm ci
npm run dev
```

For a production build: `npm run build`, then `npm run preview`. Deploy the generated `dist/` folder to any static host. No API keys, backend, or external runtime downloads are needed. The MakeHuman GLB, its eye texture, and the room materials are served locally.

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

## Measured views and human scale

The supplied images guide finishes and camera directions. The measured floorplan
remains authoritative: the tall many-level shoe tower in the render is interpreted
as visual reference; D remains the specified **1216 × 350 × 1500 mm / five levels**.
Storage cases fit on the existing right upper shelf and mirror joints are visual
pane divisions, subject to site measurement. The website's three gallery images
are snapshots of this measured baseline model, with a 1700 mm figure in the entrance
view. Click a gallery image for the live view, including furniture revisions.

**Human scale & fit** controls the clothed MakeHuman HM08 figure. It is shown in
Explore, Entrance view and Shoe return view; close-up discovery/inside/plan modes
hide the figure to avoid camera/body overlap. Defaults are centre aisle, 1700 mm,
facing the entrance. Height is adjustable from 1450–2000 mm; presets place the figure
at the entrance, drawers or shoe rack. X/Z and facing can also be set directly.
The model's actual world bounds determine overall height, headroom and approximate
furniture overlap. This is one adult body shape, uniformly scaled, including hair
and shoes—not an anthropometric range or a clothing-size fit simulation. Furniture
checks use mesh bounding boxes and do not certify access or installation clearances.

The figure uses **actual CC0 MakeHuman and MakeClothes-format assets**, not primitive
stand-ins: HM08 body, original graded rig weights, casual shirt/trousers, shoes,
short hair, eyebrows and brown-eye mesh/texture. Arms are relaxed through normalised
rig influences. MHCLO barycentric references fit the clothes to the body before
Blender exports the skinned GLB with the genuine 163-bone skeleton and garment skin weights. Body/cloth/hair/shoe surface materials are local PBR
colours; the upstream Git LFS texture download was denied and those diffuse/normal
textures are not included. No MakeHuman application code is bundled in the website.

Provenance, pinned repository commits, authors, licence and model checksum are in
`app/public/models/makehuman/credits.json`, with full CC0 text beside it. The source
conversion is `scripts/build-human.py`. To regenerate using matching checked-out
source repositories (Blender 4.3.2 was used):

```sh
blender -b --threads 2 --python scripts/build-human.py -- \
  --makehuman /path/to/makehuman --assets /path/to/makehuman-assets \
  --output app/public/models/makehuman/person.glb
npm run build
```

Update the model checksum in credits after regeneration. Blender is only required
to regenerate the asset; normal development and builds use the checked-in GLB.
If the GLB fails to load, the room remains usable and the figure can be retried.

## Interactive human and mobile controls

The live character toolbar runs actual joint motion and scene interactions:
**Move shoes** walks to the entrance rack, picks up a pair and places it beside its
original spot; **Take clothes** lifts a lower-rail garment into the aisle and
returns it to the rail. Select an individual shoe/garment and use **Let the figure
move this** to act on that item. **Walk here** makes the next floor click/tap a
destination. Routes use the current furniture meshes and avoid blocked floor
positions; an unreachable item reports that a clear route is needed.
**Sit down** uses a temporary fitting seat in the aisle (450 mm high at the default
1700 mm body scale). It is a routine prop, scales with the figure and disappears
on Stand, view changes, editing, or discovery. It is not part of the measured set-out.
Stand, changing figure parameters, hiding the figure or entering another mode
cancels an action and restores any item still in the figure's hand. Completed
shoe/garment moves remain until Reset space. Joint motion stops when an action
settles so idle scenes retain on-demand rendering. The controls are an illustrative
spatial routine rather than cloth physics or certified reach/clearance analysis.

Inter is self-hosted from `@fontsource-variable/inter`, with its OFL licence in
`app/public/fonts/inter-OFL.txt`. Every primary tool uses the same local SVG stroke
icons. On phones the room is first, with a fixed Views/Finishes/Human/Edit dock,
scrollable controls sheets, safe-area spacing, 44 px primary targets, a focus trap
and Escape/scrim dismissal. Expand maximises the room without a browser fullscreen
permission prompt. Furniture editing and the discovery trail remain available.

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
