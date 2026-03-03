# JuodziaiGear — Technical Documentation

## Architecture

Single-file SPA (`index.html`). All HTML, CSS, and JavaScript in one file. No build step, no bundler, no framework. Deployed as a static file; backend is Firebase Firestore + Firebase Auth.

---

## Tech Stack

| Dependency | Version | Purpose |
|---|---|---|
| Firebase App (compat) | 10.14.0 | SDK initialisation |
| Firebase Firestore (compat) | 10.14.0 | Cloud database, real-time reads/writes |
| Firebase Auth (compat) | 10.14.0 | Google Sign-In |
| Chart.js (UMD) | 4.4.1 | Statistics charts |
| Google Fonts | — | DM Sans (body), Bebas Neue (headings) |

All loaded via CDN. No npm, no package.json.

Firebase project ID: `juodziaigear`. Auth domain: `juodziaigear.firebaseapp.com`.

---

## Firestore Collections

### `gear`
One document per gear item.

| Field | Type | Notes |
|---|---|---|
| `gear_id` | string | UUID (client-generated via `crypto.randomUUID()`) |
| `name` | string | Required |
| `brand` | string | |
| `category` | string | Must exist in `lookups.hierarchy` |
| `type` | string | |
| `subtype` | string | |
| `model` | string | |
| `photo_url` | string | Must be `https://` — validated by `safeUrl()` |
| `date_purchased` | string | YYYY-MM-DD |
| `date_produced` | string | YYYY-MM-DD — used for inspection age |
| `price` | string/number | Euro value |
| `weight_g` | string/number | Grams |
| `size_color` | string | |
| `serial_cert` | string | |
| `status` | string | `active` \| `lent` \| `retired` |
| `notes` | string | Prefixed `[Retired: reason]` when retired |
| `service_log` | string | JSON-serialised array of log entries |

**Retirement encoding:** `notes` field prefixed with `[Retired: Worn out]` etc. Prefix is stripped for display; `saveItem()` writes/replaces prefix on retire; `openDetail()` reads it via regex `/^\[Retired:\s*([^\]]+)\]/`.

**Service log entry shape:** `{ date: "YYYY-MM-DD", type: "Inspection"|"Fall/Impact"|"Service"|"Repair"|"Note", note: string }`. Failed inspections prefix note with `"FAILED: "`.

### `lends`
One document per lending event.

| Field | Type | Notes |
|---|---|---|
| `lend_id` | string | UUID |
| `gear_id` | string | FK → gear |
| `lent_to` | string | Borrower name |
| `date_lent` | string | YYYY-MM-DD |
| `date_due` | string | YYYY-MM-DD |
| `date_returned` | string | YYYY-MM-DD, set on return |
| `condition` | string | Recorded on return |
| `notes` | string | |

Active lend: `date_returned` is empty. `currentLend(gear_id)` returns the most recent lend without `date_returned`.

### `trips`
One document per trip.

| Field | Type | Notes |
|---|---|---|
| `trip_id` | string | UUID |
| `name` | string | |
| `description` | string | |
| `date_start` | string | YYYY-MM-DD |
| `date_end` | string | YYYY-MM-DD |
| `status` | string | `planned` \| `in_progress` \| `ended` |
| `gear_ids` | array | Array of `gear_id` strings |
| `weight_target` | number | Grams, optional weight budget |

### `lookups`
Single document (`lookups/main`).

| Field | Type | Notes |
|---|---|---|
| `brands` | array | Sorted string array |
| `hierarchy` | object | `{ Category: { Type: [subtype, ...] } }` |

---

## localStorage Keys

| Key | Value | Purpose |
|---|---|---|
| `sg_items` | JSON array | Cached gear documents |
| `sg_lends` | JSON array | Cached lend documents |
| `sg_trips` | JSON array | Cached trip documents |
| `sg_lookups` | JSON object | Cached lookups document |
| `sg_fetched_at` | timestamp (ms) | Cache write time |
| `sg_sticky_cols` | `"1"` \| `"0"` | Sticky columns preference |

Cache TTL: **10 minutes** (`CACHE_TTL_MS = 10 * 60 * 1000`). On load, if cache age < TTL and no `force` flag, Firestore is not queried.

---

## Authentication

Firebase Google Sign-In via popup (`_auth.signInWithPopup`).

`_auth.onAuthStateChanged(user => ...)` controls app visibility:
- **Signed in:** hides `#login-screen`, shows `#app-shell`, populates avatar (photo URL or initials), calls `loadLocal()` → `renderAll()` → `renderLookupUI()` → `connectAndLoad()`.
- **Signed out:** shows `#login-screen`, hides `#app-shell`.

`signOut()` calls `_auth.signOut()`. No role system — all authenticated users have full read/write access.

---

## State Variables

```js
let items   = []    // gear documents (normalised)
let lends   = []    // lend documents (normalised)
let trips   = []    // trip documents (normalised)
let lookups = {}    // { brands: [], hierarchy: {} }

const CATS  = []    // derived from lookups.hierarchy, used throughout
const PALETTE = [   // colour array for non-category chart series
  '#4e9a3a','#e07b00','#2563eb', ...12 colours
]
const CAT_EMOJI = { Mountaineering: '⛰️', ... }

let sortCol  = 'brand'   // active sort column key
let sortAsc  = true      // sort direction

let currentView = 'table'  // 'card' | 'table'

// Statistics chart modes
let countMode    = 'stacked'   // 'stacked' | 'grouped' | 'line'
let catMode      = 'category'  // 'category' | 'type' | 'subtype' | 'brand'
let spendMode    = 'stacked'
let spendCatMode = 'category'

const _charts = {}   // Chart.js instances keyed by id ('cy','sy','wc')

let _packingMode    = false  // packing checklist active
let _packingChecked = {}     // { gear_id: bool }

let _undoFn    = null        // pending undo callback
let toastTimer = null        // setTimeout handle for toast auto-dismiss

const _hierOpen = {          // expanded state of hierarchy tree nodes
  cats:  new Set(),
  types: new Set()
}
```

---

## Data Flow

```
Firebase Firestore
      ↕  (connectAndLoad / api())
  localStorage  ←→  in-memory arrays (items, lends, trips, lookups)
                              ↓
                         renderAll()
                    ↙         ↓        ↘
             renderLent   renderTrips  renderInspection …
```

**Write path:** mutate in-memory array → `saveLocal()` → `api('updateGear' | 'addGear' | …)` → Firestore. Optimistic UI — local state updates immediately.

**`invalidateCache()`** sets `sg_fetched_at` to 0, forcing a fresh Firestore fetch on next `connectAndLoad`.

---

## Firestore API Wrapper

`firestoreApi(action, body)` maps action strings to Firestore SDK calls:

| Action | Firestore operation |
|---|---|
| `getGear` | `gear` collection `.get()` |
| `addGear` | `gear` `.doc(gear_id).set()` |
| `updateGear` | `gear` `.doc(gear_id).update(body)` |
| `deleteGear` | `gear` `.doc(gear_id).delete()` |
| `getLends` | `lends` `.get()` |
| `addLend` | `lends` `.doc(lend_id).set()` |
| `updateLend` | `lends` `.doc(lend_id).update()` |
| `deleteLend` | `lends` `.doc(lend_id).delete()` |
| `getTrips` | `trips` `.get()` |
| `addTrip` | `trips` `.doc(trip_id).set()` |
| `updateTrip` | `trips` `.doc(trip_id).update()` |
| `deleteTrip` | `trips` `.doc(trip_id).delete()` |
| `getLookups` | `lookups/main` `.get()` |
| `addBrand` | `lookups/main` `.update({ brands: arrayUnion })` |
| `addCategory` | `lookups/main` `.update({ hierarchy.cat: {} })` |
| `addCategoryType` | `lookups/main` `.update({ hierarchy.cat.type: arrayUnion })` |
| `removeSubtype` | `lookups/main` `.update({ hierarchy.cat.type: arrayRemove })` |

---

## Rendering Pipeline

### `renderAll()`
Top-level render. Calls: `getFiltered()` → `applySorted()` → renders All Gear (cards or table), Retired section. Then calls `renderLent()`, `renderTrips()`, `updateBadges()`.

### `getFiltered()`
Reads DOM filter values (`#fCat`, `#filterType`, `#filterSub`, `#filterBrand`, `#filterStatus`, `#searchInput`). Returns filtered subset of `items[]`.

### `applySorted(arr)`
Sorts array by `sortCol` / `sortAsc`. Handles numeric fields (`weight_g`, `price`) numerically; others lexicographically.

### `groupItems(arr)`
Groups items where `groupKey(i)` matches. Key = `name||brand||category||type||subtype` concatenation. Returns array of arrays (groups). Single-item groups are arrays of length 1.

### `tableRowHTML(item, cols)`
Returns `<tr>` HTML for a single item. `cols` is an ordered array of column keys (e.g. `['photo','name','brand','weight_g','actions']`). Each key maps to a `defs` object property returning `<td>` HTML.

### `tableRowGroupedHTML(group, cols)`
Returns group header `<tr>` + hidden sub-`<tr>`s. Group header shows aggregate weight, item count badge, representative photo.

### `toggleGroup(gid)`
Expand/collapse group sub-rows by traversing `nextElementSibling` until next non-sub-row. Rotates chevron icon.

---

## Key Functions

### Gear CRUD

**`openAddModal()`** — clears form, sets `_editId = null`, opens `#addOverlay`.

**`openEdit(gear_id)`** — populates form from item, sets `_editId`, opens `#addOverlay`. Decodes `[Retired: reason]` prefix from notes.

**`saveItem()`** — reads form, builds payload, calls `api('addGear')` or `api('updateGear')`, updates `items[]`, calls `saveLocal()`, `renderAll()`.

**`deleteItem(gear_id)`** — removes from `items[]` and `lends[]` immediately, calls `renderAll()`, shows undo toast. After 5.2 s (if not undone) calls `api('deleteGear')`.

**`duplicateItem(gear_id)`** — clones item with new UUID, strips status back to `active`, opens form pre-filled.

### Lending

**`quickLend(gear_id)`** / **`openReturn(gear_id)`** — open `#lendOverlay` / `#returnOverlay` pre-filled.

**`confirmLend()`** — creates lend record, sets `item.status = 'lent'`, saves both.

**`confirmReturn()`** — sets `lend.date_returned` and `lend.condition`, sets `item.status = 'active'`, saves both.

**`currentLend(gear_id)`** — returns lend where `gear_id` matches and `date_returned` is empty.

**`populateBorrowerList()`** — fills `<datalist id="borrowerList">` from unique `lend.lent_to` values for autocomplete.

### Trips

**`saveTrip()`** — reads trip form (including `weight_target`), upserts trip doc, updates `trips[]`.

**`renderTripDetail(id)`** — renders trip detail panel: stats row (item count, total weight, weight vs budget progress bar), grouped gear table, action buttons.

**`updateTripStatuses()`** — compares today's date to `date_start`/`date_end`, auto-updates `status` field in Firestore and locally.

**`populatePickerList(search)`** — renders grouped picker for adding gear to a trip. Group header checkbox wires indeterminate/checked state; sub-rows are individually selectable.

**`addSelectedToTrip(trip_id)`** — reads checked picker checkboxes, appends to `trip.gear_ids`, saves.

### Inspection

**`getAgeYears(date_produced)`** — returns decimal years since production date.

**`ageClass(years)`** — returns `'green'` / `'amber'` / `'red'` based on 5/7 year thresholds.

**`logInspectionNow(gear_id)`** — prepends `{ date, type:'Inspection', note:'Inspected OK' }` to service log, saves.

**`openFailInspection(gear_id)`** — opens `#failInspOverlay`, pre-fills item name.

**`confirmFailInspection()`** — prepends failed log entry (`note: 'FAILED: ' + input`), sets `item.status = 'retired'`, prefixes `item.notes` with `[Retired: reason]`, calls `api('updateGear')`.

### Statistics

**`getStatItems()`** — returns `items[]` filtered by `#statStatusFilter` value.

**`buildCountYearChart(data)`** — Chart.js bar/line (`_charts.cy`, canvas `#chartCountYear`). X = purchase years, datasets = CATS. Stacked/grouped/line via `countMode`.

**`buildSpendYearChart(data)`** — same structure for price totals (`_charts.sy`, `#chartSpendYear`).

**`buildCatChart(data)`** — pure HTML horizontal bar chart into `#chartCatBreakdown`. No Chart.js. Tabs: category/type/subtype/brand. Bar width = `value/total * 100%`.

**`buildSpendCatChart(data)`** — same for spend, into `#chartSpendCat`.

**`buildWeightCharts(data)`** — Chart.js bar (`_charts.wc`, `#chartWeightCat`) + top-10 heaviest HTML table (`#tableHeaviest`).

**`buildBreakdownTables(data)`** — HTML tables into `#tableByCategory`, `#tableByBrand` with mini bar indicators.

**`destroyChart(id)`** — calls `.destroy()` on existing Chart.js instance and removes from `_charts`.

### Settings & Preferences

**`setStickyColumns(on)`** — toggles `body.sticky-cols` class, writes `sg_sticky_cols` to localStorage, syncs checkbox `#stickyColsToggle`.

**`initStickyColumns()`** — reads `sg_sticky_cols` (defaults to ON if key absent), calls `setStickyColumns()`.

**`renderLookupUI()`** — renders brand list and hierarchy tree. Called on Settings open and after any lookup mutation.

**`renderHierTree()`** — builds the `#hierTree` DOM from `lookups.hierarchy`. Nodes track open state in `_hierOpen`.

### UX Utilities

**`toast(msg, dur)`** — shows `#toast` for `dur` ms (default 3000).

**`toastWithUndo(msg, undoFn, dur)`** — shows toast with Undo button. Stores `undoFn` in `_undoFn`. If user clicks Undo within `dur` ms, calls `undoFn()` and cancels deferred API delete.

**`openGlobalSearch()`** / **`runGlobalSearch()`** — opens `#globalSearchOverlay`, searches `items[]`, `trips[]`, `lends[]` by query string, renders grouped results.

**`showSec(name)`** — hides all `.sec-hidden` sections, shows `#sec-{name}`, updates sidebar and bottom nav active state, triggers section-specific render.

**`setView(view)`** — sets `currentView`, toggles `#allCard`/`#allTable` visibility, updates view-toggle buttons, calls `renderAll()`.

**`setConnStatus(state, msg)`** — sets `#connDot` CSS class (`connected`/`loading`/`error`), updates tooltip, animates `#hdrRefreshBtn` spinner during loading.

**`toggleUserDropdown()`** — toggles `#userDropdown.open`. Document click listener closes it on outside click.

---

## CSS Architecture

### Custom Properties (`:root`)
```css
--bg, --surface, --surface2, --border          /* backgrounds */
--accent, --accent-light                        /* green brand colour */
--danger, --danger-light                        /* red */
--warn, --warn-light                            /* amber */
--text, --muted                                 /* typography */
--radius: 10px                                  /* border radius */
/* Inspection age colours */
--age-green-bg/border/text
--age-amber-bg/border/text
--age-red-bg/border/text
```

### Layout
- `header` — sticky top, `position:sticky; top:0; z-index:100`
- `.app-shell` — flex row: `.sidebar` (240px) + `.main` (flex:1)
- `.sidebar` — fixed on mobile (`position:fixed; left:-230px`), slides in when `.open`
- `.main` — scroll container, `padding-bottom` accounts for bottom nav on mobile

### Responsive Breakpoints
- `≤900px` — sidebar becomes a slide-in drawer; hamburger button visible
- `≤720px` — bottom nav visible (`.mobile-nav`); FAB visible; view-toggle hidden; form grid collapses to 1 column; mobile font size overrides apply; sticky columns CSS activates (when `body.sticky-cols`)

### Key Component Classes

| Class | Purpose |
|---|---|
| `.gtable` | Main gear/inspection table. `border-collapse:collapse` |
| `.table-wrap` / `.ltw` | Scroll wrapper: `overflow-x:auto; -webkit-overflow-scrolling:touch` |
| `.lent-table` | Lent Out table |
| `.td-photo` | 40×40px photo thumbnail cell |
| `.td-name` | Bold clickable name cell with `<small>` subtitle |
| `.td-actions` | Flex container for row action icon buttons |
| `.group-row` | Grouped table header row (expand/collapse) |
| `.sub-row.hidden` | Collapsed sub-row (`display:none`) |
| `.insp-row-green/amber/red` | Inspection table row tints |
| `.insp-dot-pass/fail` | Green/red indicator dot with halo ring |
| `.hbar-chart` / `.hbar-row` | Horizontal bar chart (Statistics) |
| `.kpi-card` | Statistics KPI card |
| `.chart-card` / `.chart-tabs` | Statistics chart container and tab buttons |
| `.modal` / `.overlay` | Modal dialogs. Overlay has `position:fixed; inset:0; z-index:200` |
| `.mobile-nav` / `.mnav-item` | Bottom navigation bar (mobile only) |
| `.user-avatar-btn` / `.user-dropdown` | Avatar button + dropdown menu |
| `.toggle-switch` / `.toggle-track` / `.toggle-thumb` | CSS toggle switch component |
| `.weight-bar-wrap` / `.weight-bar` | Trip weight budget progress bar |
| `.insp-last` / `.insp-last-date` / `.insp-last-note` | Inspection last-inspection cell |
| `.tag` | Pill badge. Variants: `tag-lent`, `tag-retired`, `tag-camping`, `tag-in_trip` |
| `.btn` | Base button. Variants: `btn-primary`, `btn-ghost`, `btn-danger`, `btn-warn`, `btn-sm`, `icon-btn` |

### Icon System
`const IC = { ... }` — object of inline SVG strings. Referenced as `${IC.pencil}` in template literals. Icons: `grid, send, pin, shield, lend, ret, trash, x, pencil, copy, back, chevD, chevR, warn, refresh, db, folder, menu, search, signout`.

### Sticky Columns (Mobile)
`@media(max-width:720px)` — when `body.sticky-cols`:
- `col 1` (photo): `position:sticky; left:0; z-index:2`
- `col 2` (name): `position:sticky; left:68px; z-index:2; box-shadow:2px 0 5px -2px rgba(0,0,0,.12)`
- Explicit `background` on each sticky cell per row variant (surface, hover, lent-row, insp-row colours)

---

## Normalisation

**`normalizeItem(raw)`** — runs `fmtDate()` on `date_purchased` and `date_produced`. Ensures dates are always YYYY-MM-DD strings regardless of source format (Sheets serial numbers, ISO with time, locale strings).

**`normalizeTrip(raw)`** — ensures `gear_ids` is always an array.

**`normalizeLend(raw)`** — no-op currently, reserved for future use.

---

## Undo-Delete Pattern

1. Remove item from `items[]` / `lends[]` in memory immediately.
2. Call `renderAll()` (optimistic).
3. Call `toastWithUndo(msg, undoFn, 5000)` — stores `undoFn` in `_undoFn`.
4. `setTimeout` at 5200 ms: if item is still absent from `items[]`, call `api('deleteGear')`.
5. If user clicks Undo within 5 s: `undoFn()` restores item to array, calls `renderAll()`, cancels deferred delete by the presence-check in step 4.

---

## Helper Functions

| Function | Purpose |
|---|---|
| `esc(s)` | HTML-escape string (replaces `&`, `<`, `>`, `"`, `'`) |
| `safeUrl(u)` | Returns URL only if it starts with `https?://`, else null |
| `fmtWeight(g)` | `g < 1000` → `"Ng"`, else `"N.NNkg"` |
| `fmtPrice(v)` | `"€N,NNN"` |
| `fmtDate(v)` | Normalises any date representation to YYYY-MM-DD |
| `fmtTripDate(d)` | YYYY-MM-DD → `"D Mon YYYY"` |
| `getCatColor(cat)` | Returns `{ bg, border }` colour strings for a category |
| `getCatTagStyle(cat)` | Returns inline style string for category tag |
| `getServiceLog(item)` | Parses `item.service_log` JSON, returns array (empty on error) |
| `currentLend(gear_id)` | First lend without `date_returned` for this gear |
| `activeTrip(gear_id)` | First non-ended trip containing this gear |
| `getCats()` | Returns sorted category array from `lookups.hierarchy` |

---

## File Structure

```
index.html          — entire application (HTML + CSS + JS, ~3200 lines)
USER_GUIDE.md       — user documentation
TECHNICAL.md        — this file
```

No build artefacts, no node_modules, no configuration files.
