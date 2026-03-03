# JuodziaiGear

Outdoor gear inventory, trips, and lending tracker — single-file PWA backed by Firebase Firestore.

---

## Planned Changes: Pluggable Storage Backend (Firebase ↔ Local JSON)

### Goal
Allow the app to run without a Firebase account by switching to a fully local storage mode where all data is kept on the device.

### Current architecture

All data access goes through a single `api(action, body)` function (index.html ~line 1165) which delegates to `firestoreApi()`. This is the seam point for the backend swap.

```
api(action, body)
  └─ firestoreApi(action, body)   ← Firebase Firestore (current)
```

After the change:

```
api(action, body)
  └─ storageMode === 'firebase'  →  firestoreApi(action, body)   [unchanged]
  └─ storageMode === 'local'     →  localJsonApi(action, body)   [new]
```

`storageMode` persisted in `localStorage` as `sg_storage_mode`.

### How `localJsonApi` works

All 17 API actions map to plain in-memory array operations + `saveLocal()`. No network calls, no Firebase SDK calls.

| Action group | Local implementation |
|---|---|
| `getGear / getLends / getTrips / getLookups` | Return in-memory arrays directly |
| `addGear / addLend / addTrip` | Push to array, generate ID with `newId()`, call `saveLocal()` |
| `updateGear / updateTrip / returnGear` | Find by ID, merge fields, call `saveLocal()` |
| `deleteGear / deleteTrip` | Splice from array, call `saveLocal()` |
| `addBrand / addCategory / rename* / remove*` | Mutate `lookups` object, call `saveLocal()` |

### Auth in local mode

Firebase Auth is not needed in local mode:
- Skip the login screen — call `connectAndLoad()` directly on page load
- Hide the user avatar / sign-out button; show a "Local mode" label instead

### Import / Export as backup

The existing **Export JSON** becomes the backup mechanism. An **Import JSON** button (not yet implemented) will be added to restore data from a file.

### Settings UI change

Settings → App Database section will get a storage toggle:

```
Storage:  ◉ Firebase (cloud sync)   ○ Local (device only)
```

Switching to Local: prompts to export a backup first, then disconnects Firebase.
Switching to Firebase: requires Google sign-in, then user chooses sync direction (local → Firebase or Firebase → local).

### What changes (index.html only, ~170 lines)

| Change | Lines |
|---|---|
| `localJsonApi()` function | ~100 |
| Auth bypass / boot flow | ~20 |
| Settings storage toggle + confirmation dialog | ~30 |
| Import JSON button + handler | ~20 |

No new files. No new dependencies. No changes to `sw.js` or `manifest.json`.

---

### Risks and impacts

#### Risk 1 — Data loss on mode switch (HIGH)
Switching back from Local to Firebase and choosing "Firebase overwrites Local" destroys local-only changes. **Mitigation:** always prompt to export before switching; make sync direction explicit and require confirmation.

#### Risk 2 — ID collisions across devices (MEDIUM)
`newId()` uses `Date.now().toString(36)` — two devices in local mode creating records at the same millisecond will collide if files are merged manually. **Mitigation:** document that local mode is single-device only. Manual JSON merging is unsupported.

#### Risk 3 — Auth flow restructuring (MEDIUM)
`_auth.onAuthStateChanged` currently drives the entire app boot sequence. In local mode this must be bypassed. **Mitigation:** add a local-mode early-exit at the top of the auth listener — keep the listener intact for Firebase mode.

#### Risk 4 — Lookup mutations (LOW)
Firebase uses `FieldValue.arrayUnion` / `arrayRemove` for atomic list operations. Local mode replicates these with plain JS array mutation. Straightforward but must be verified for all 9 lookup actions.

#### Risk 5 — Firebase SDK still loaded in local mode (LOW)
The Firebase JS SDK (~200 KB) remains in the service worker cache and loads on every page open even in local mode. Acceptable for now; can be optimised later by lazy-loading the SDK only when needed.

#### Risk 6 — No multi-device sync (by design)
Local mode is single-device by design. Two users sharing the app must use Firebase mode or manually exchange JSON exports. This is a known and acceptable limitation.

---

### Feature comparison

| Feature | Firebase mode | Local mode |
|---|---|---|
| Browse gear, trips, lends, stats | ✅ | ✅ |
| Add / edit / delete | ✅ | ✅ |
| Works fully offline | ✅ (10-min cache) | ✅ (always) |
| Multi-device sync | ✅ real-time | ❌ manual export/import |
| Google sign-in required | ✅ | ❌ |
| Backup | ✅ Export JSON | ✅ Export JSON |
| Restore from backup | ✅ re-import to Firebase | ✅ Import JSON (new) |
| Shared access (multiple users) | ✅ | ❌ |
