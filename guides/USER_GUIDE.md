# JuodziaiGear — User Guide

## What Is JuodziaiGear?

JuodziaiGear is a personal gear inventory system for outdoor athletes — mountaineers, climbers, skiers, and campers. It is a private web application that lets you track every piece of equipment you own, who has borrowed it, which trips it has been packed for, and whether it is still safe to use.

The app lives in a browser. All data is stored in the cloud and shared in real time between authorised users. You sign in with a Google account.

---

## Use Cases

| Situation | How the app helps |
|---|---|
| "What gear do I own and where is it?" | All Gear view — browse, filter, search your full inventory |
| "I lent my harness to Tomas — when is it due back?" | Lent Out view — see active loans, due dates, overdue warnings |
| "I'm planning a spring alpine trip — what do I pack and how heavy will it be?" | Trips — create a trip, add gear, set a weight budget, use the packing checklist |
| "Is my helmet still safe to use?" | Inspection — see gear age, last inspection date, pass/fail history |
| "How much have I spent on climbing gear overall?" | Statistics — value by category, year-by-year spending |
| "How heavy is my full kit?" | Statistics — total kit weight, weight by category, heaviest items |

---

## Sections

### All Gear
The main inventory. Every item you own appears here.

- **Card view** — photo cards with key details at a glance
- **Table view** — sortable columns: name, brand, category, type, subtype, weight, purchase date, production date, status
- **Filters** — narrow by category, type, subtype, brand, and status (active / lent / retired)
- **Sort** — click any table column header, or use the sort dropdown in the filter bar
- **Search** — type in the search bar to filter by name, brand, or model
- **Grouped rows** — identical items (e.g. 12 quickdraws of the same model) are collapsed into one row with aggregate weight. Click the row to expand individual items.
- **Item detail** — click any item name to open a detail panel with all fields, lending history, and service log
- **Add gear** — the **+** button (top right on desktop, floating button on mobile)
- **Stat cards** — Total Items, Lent Out, Brands (follow active filters); Retired (always shows all)

**Item statuses:**
- **Active** — in your possession, available
- **Lent Out** — currently with someone else
- **In Trip** — packed into an active trip
- **Retired** — removed from service (reason recorded)

### Retired
A separate view of all retired items, accessible from the sidebar. Shows retirement reason alongside standard fields.

### Lent Out
Tracks gear currently on loan.

- Items are grouped by borrower
- Shows date lent, expected return date, and notes
- Overdue items are highlighted in red with a warning icon
- Click **Return** to mark an item as returned and record its condition
- Full lending history (all past loans) is shown below active loans

### Trips
Plan and manage expeditions.

- **Trip card** — shows name, dates, status (Planned / In Progress / Ended), item count, and total weight
- **Trip detail** — opens when you click a card
  - Gear list grouped by item type, with total weight per group
  - **Weight budget** — set a target weight on the trip; a progress bar turns amber at 80 % and red at 100 %
  - **Add gear** — picker with search, grouped by item type; check a group header to add all items in that group, or expand and pick individually
  - **Packing mode** — tap the backpack icon to enter packing mode; check items off as you physically pack them
  - **Remove items** from the trip with the × button

Trip statuses update automatically based on dates (Planned → In Progress → Ended).

### Inspection
Tracks gear age and maintenance history.

**Age bands:**
- **Green** — under 5 years old
- **Amber** — 5–7 years (consider inspection)
- **Red** — 7+ years (inspect or replace)

**Actions per item:**
- **Shield button** — log a passed inspection (adds a service log entry "Inspected OK" with today's date)
- **Warning button** — log a failed inspection: enter result notes and retirement reason; the item is retired automatically and the failure is recorded in its service log
- **Last Inspected column** — shows date and result of the most recent inspection entry, with a green (pass) or red (fail) dot indicator

Only items with a production date set appear here.

### Statistics
Gear inventory insights.

**KPI cards:** Total Items, Total Value, Avg Item Price, Most Expensive item, Top Category, Total Kit Weight, Avg Item Weight.

**Charts:**
- **Items Acquired per Year** — bar/line chart by category. Tabs: Stacked / Grouped / Line
- **Collection Breakdown** — horizontal bar chart: item count by Category / Type / Subtype / Brand
- **Spend per Year** — bar/line chart by category
- **Spend Breakdown** — horizontal bar chart: purchase value by Category / Type / Subtype / Brand
- **Weight by Category** — bar chart
- **Top 10 Heaviest Items** — table with bar indicator

Use the **Active / All / Retired** filter at the top to scope the data.

### Settings

**App Database** — Firebase connection status. Reload button forces a fresh sync from the cloud.

**Export Data** — download a full JSON backup (all gear, trips, lends, lookups) or a flat CSV of gear items.

**Display Preferences** — toggle **Freeze photo & name columns on mobile**: when on, the first two table columns stay fixed while you scroll sideways on a phone.

**Brands** — add or remove brands available in the gear form.

**Category → Type → Subtype Hierarchy** — manage the gear taxonomy. Add categories, types within categories, and subtypes within types. Rename or delete nodes (renaming cascades to all affected gear items).

---

## Adding & Editing Gear

The **Add / Edit** form contains:

| Field | Notes |
|---|---|
| Name | Required |
| Brand | Dropdown from your Brands list |
| Category | Drives Type and Subtype dropdowns |
| Type | Filtered by category |
| Subtype | Filtered by type |
| Model | Free text |
| Photo URL | Paste an image URL (hosted externally) |
| Date Purchased | YYYY-MM-DD |
| Date Produced | YYYY-MM-DD — required for Inspection tracking |
| Price (€) | Used in statistics |
| Weight (g) | Used in trip weight totals and statistics |
| Size / Colour | Free text |
| Serial / Cert | For safety equipment certification numbers |
| Status | Active / Lent Out / Retired |
| Retirement Reason | Shown when Status = Retired |
| Notes | Free text |

The form also contains a **Service Log** section where you can add inspection, fall/impact, service, repair, or general note entries with a date.

---

## Global Search

Click the **magnifying glass** in the top-right header (any page). Type to search across:
- Gear names
- Borrower names (Lent Out)
- Trip names

Results are grouped by type. Click any result to navigate directly to that item.

---

## Data Refresh

Click the **refresh icon** (next to the search button in the header) to force a fresh sync from Firebase. The connection status dot on your avatar indicates sync state: green = connected, amber = syncing, red = error.

---

## Undo Delete

Deleting a gear item or trip shows a 5-second **"Undo"** toast. Click Undo to restore the item before the deletion is sent to the database.

---

## Mobile

- Bottom navigation bar with icons for all sections
- Floating **+** button to add gear
- Tables scroll horizontally; enable **Freeze columns** in Settings to keep photo and name visible while scrolling
- Font sizes and touch targets are optimised for phones
