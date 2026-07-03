# Metro-Style River Paths

Goal: transform the McCloud, Sacramento, and San Joaquin river paths into a metro-map style where line segments only travel in the 8 octilinear directions: horizontal, vertical, and 45-degree diagonals.

## Implemented Prototypes

### 1. Precomputed GeoJSON for Mapbox

Files:

- `apps/storyline-equity/app/components/map/generate-metro-rivers.mjs`
- `packages/data/src/gis/metro_rivers_octilinear.geojson`
- `packages/data/src/index.ts`
- `apps/storyline-equity/app/components/map/layers/MetroRiverPrototypeLayer.tsx`

How it works:

- Reads the existing river GeoJSON.
- Projects coordinates into a local meter-like plane.
- Snaps each segment angle to the nearest multiple of 45 degrees.
- Preserves original segment lengths.
- Writes a new GeoJSON file that Mapbox can render as ordinary line layers.

Pros:

- Lightest runtime cost.
- Easy to animate with Mapbox `line-trim-offset` if each line is one continuous feature.
- Keeps the styling pipeline close to the existing `MajorRiverLayer`.

Cons:

- The result drifts from true geography because each snapped segment moves the downstream coordinates.
- Branch junctions may need manual cleanup if the metro diagram needs polished topology.

Best use:

- Production candidate if we like the look after manual tuning.

### 2. Runtime GeoJSON Transformation for Mapbox

Files:

- `apps/storyline-equity/app/components/map/helpers/octilinearizeGeojson.ts`
- `apps/storyline-equity/app/components/map/layers/MetroRiverPrototypeLayer.tsx`

How it works:

- Combines the three source datasets in the browser.
- Applies the same octilinear snapping algorithm in `useMemo`.
- Feeds the transformed GeoJSON into a Mapbox source.

Pros:

- Fast to iterate on algorithm parameters without regenerating files.
- Good for prototyping alternate snapping rules, anchors, or simplification thresholds.

Cons:

- More browser work.
- Not ideal if the input GeoJSON is large or the algorithm becomes more sophisticated.

Best use:

- Design exploration, not final production unless the geometry stays small.

### 3. Precomputed SVG / SVG Overlay

Files:

- `packages/data/src/gis/metro_rivers_octilinear.svg`
- `apps/storyline-equity/app/components/map/layers/MetroRiverMorphOverlay.tsx`

How it works:

- The script writes a standalone SVG artifact.
- The React SVG prototype renders paths from the precomputed GeoJSON, projected into an SVG viewport.

Pros:

- Maximum visual control.
- Easy to make the final result look like a true designed metro map.
- Labels, stations, icons, and manual path edits are easier than in Mapbox.

Cons:

- It is a diagram overlay, not geographic map data.
- It will not naturally align with Mapbox during pan/zoom unless treated as a fixed screen-space graphic.

Best use:

- A stylized explanatory panel or inset diagram.

## Other Feasible Approaches

### 4. GIS Preprocessing

Pros:

- Best toolchain for topology-aware cleanup.
- Can preserve or enforce junctions.
- Easier to add manual anchors, line simplification, topology repair, and export QA.

Cons:

- Adds a separate GIS processing dependency.
- Still needs design judgment for good metro-map layout.

Best use:

- If the final diagram needs polished branch geometry, exact confluences, and repeatable cartographic QA.

### 5. Fully Manual SVG

Trace the rivers once in Figma, Illustrator, or hand-written SVG.

Pros:

- Best possible visual result.
- No algorithmic weirdness.

Cons:

- Harder to keep tied to data.
- Not great if the geometry needs to change often.

Best use:

- Final art-directed diagram after the data-driven prototype proves the concept.

## Current Algorithm Caveat

The implemented algorithm is intentionally simple: each segment is snapped independently to the nearest octilinear angle while preserving segment length. This proves feasibility, but it is not yet a polished metro-map layout algorithm. A production version will probably need one or more of:

- line simplification before snapping,
- manual anchors for important points like Shasta, the Delta, or major confluences,
- topology-aware junction preservation,
- branch routing rules,
- post-snap cleanup that removes tiny zig-zags,
- label placement rules.
