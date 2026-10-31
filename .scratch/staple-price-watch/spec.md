# Staple Price Watch MVP

Status: ready-for-agent

The product is Staple Price Watch. Use `GLOSSARY.md` terms exactly. Read `docs/adr/0001-local-first-pwa.md` before choosing a platform.

## Problem Statement

I buy the same staples again and again and I cannot tell, from memory, how quickly they are getting more expensive. Budget apps and supermarket price sites answer the wrong question: they track spending, catalogues, or deals. I need a private notebook of what I actually paid for milk, eggs, potatoes, chicken, and similar staples, normalised so pack sizes do not lie, so I can see my own prices move over months.

## Solution

A local-first installable web app on my Android phone. After a shop I start a Visit, pick the Shop once, and add only the staple Observations I care about. Each Observation is a Category, a paid price, and a quantity I can type in grams or kilograms, millilitres or litres, or items. The book converts those to Unit Prices, keeps optional Promotion flags and Comments out of the grouping logic, and shows monthly medians plus a Trend only when there is enough evidence. Everything stays on the device. I can edit history, merge Categories, export CSV, and restore from a JSON Backup.

## User Stories

1. As a Shopper, I want a phone app that works after I install it once, so that I can log prices in the car park without a signal.
2. As a Shopper, I want no account, password, or server, so that receipt-like purchase data never leaves my device unless I export it.
3. As a Shopper, I want the app to open on a home screen with “new Visit”, unfinished Drafts, recent Visits, and a way to open statistics, so that I can finish logging in under a minute.
4. As a Shopper, I want the first launch to seed a small Category list and a UK Shop list, so that I can log a Visit immediately.
5. As a Shopper, I want starter Categories of Eggs (count), Milk (volume), Chicken wings (mass), Baking potatoes (mass), and Cherry tomatoes (mass), so that my first basket matches what I actually watch.
6. As a Shopper, I want starter Shops of Tesco, Sainsbury's, Asda, Morrisons, Aldi, Lidl, Waitrose, M&S, Co-op, Iceland, Ocado, and Corner Shop, so that I rarely type a chain name.
7. As a Shopper, I want to add my own Shop later, so that a missing chain does not block logging.
8. As a Shopper, I want recently used Shops listed first, so that choosing a Shop is one tap.
9. As a Shopper, I want to start a Visit by confirming the date and Shop, so that I do not re-enter those facts on every Observation.
10. As a Shopper, I want the Visit date to default to today in the UK local calendar, so that most trips need no date edit.
11. As a Shopper, I want to change the Visit date before I complete it, so that I can log yesterday’s shop today.
12. As a Shopper, I want to add an Observation with Category, paid price, quantity, and unit, so that the book can compute a Unit Price.
13. As a Shopper, I want paid price entered in pounds and pence, so that it matches the till.
14. As a Shopper, I want to enter mass as grams or kilograms and have them treated as the same family, so that a 350 g pack and a 1 kg pack compare as pounds per kilogram.
15. As a Shopper, I want to enter volume as millilitres or litres and have them treated as the same family, so that 568 ml of milk compares with 1 L of milk.
16. As a Shopper, I want Eggs compared per item, so that a box of 10 and a box of 12 do not distort the Trend.
17. As a Shopper, I want the app to reject a quantity unit that does not match the Category’s Unit Family, so that eggs cannot be saved in kilograms by mistake.
18. As a Shopper, I want the app to refuse zero or negative prices and quantities, so that bad taps cannot enter the history.
19. As a Shopper, I want the computed Unit Price shown before I save the Observation, so that I can see £6.00/kg from “350 g at £2.10” and catch mistakes.
20. As a Shopper, I want brand and quality details only in an optional Comment, so that “milk is milk” in the statistics.
21. As a Shopper, I want to mark an Observation as a Promotion without removing it, so that I can later decide whether offers should be filtered out.
22. As a Shopper, I want Promotions included in statistics by default, so that the first picture is what I actually paid.
23. As a Shopper, I want a “save and add another” action, so that a five-staple Visit is a tight loop.
24. As a Shopper, I want recent and frequently used Categories at the top of the picker, so that I do not scroll the full list every time.
25. As a Shopper, I want the last quantity and unit I used for a Category to prefill, and never the last price, so that pack size is fast and stale prices cannot sneak in.
26. As a Shopper, I want an unfinished Visit kept as a Draft if I leave the app, so that I do not lose a half-logged shop.
27. As a Shopper, I want to resume a Draft from the home screen, so that I can finish later.
28. As a Shopper, I want to discard a Draft, so that a false start does not linger.
29. As a Shopper, I want completion blocked until the Visit has a date, a Shop, and at least one valid Observation, so that empty Visits do not enter history.
30. As a Shopper, I want each Observation required to have Category, paid price, quantity, and a unit in the Category’s family before it can be saved, so that incomplete lines never become statistics.
31. As a Shopper, I want a warning when I complete a Visit that shares date, Shop, and at least one Category with an already completed Visit, so that I do not double-count a shop I already logged.
32. As a Shopper, I want to complete anyway after that warning, so that two real trips to the same chain on the same day are still allowed.
33. As a Shopper, I want completed Visits listed by date, newest first, showing Shop and Observation count, so that I can find a trip to fix.
34. As a Shopper, I want to open a completed Visit and edit its date or Shop, so that one correction updates every Observation in that trip.
35. As a Shopper, I want to edit an Observation after completion, so that a mistyped price or quantity does not stay forever.
36. As a Shopper, I want Unit Price to recompute from the edited paid price and quantity, so that I never type a Unit Price by hand.
37. As a Shopper, I want to delete one Observation from a completed Visit, so that a logged impulse staple I do not actually watch can go away.
38. As a Shopper, I want to delete a whole completed Visit, so that a duplicated trip can be removed cleanly.
39. As a Shopper, I want deleting the last Observation of a completed Visit to ask whether to delete the Visit too, so that I am not left with an empty completed trip.
40. As a Shopper, I want to add a new Category with a name and a Unit Family, so that I can start watching rice or butter later.
41. As a Shopper, I want a Category’s Unit Family to be fixed at creation, so that history cannot be silently invalidated.
42. As a Shopper, I want renaming a Category to update every historical Observation, so that “Baking potatoe” can become “Baking potatoes” without losing data.
43. As a Shopper, I want to merge Category A into Category B only when they share a Unit Family, so that eggs cannot be merged into milk.
44. As a Shopper, I want merge to move every Observation and default to the surviving Category and archive the source, so that old logs still appear in the Trend.
45. As a Shopper, I want to archive a Category that has no Observations, or after I have moved them, so that unused staples leave the picker without destroying history.
46. As a Shopper, I want the app to refuse permanent deletion of a Category that still has Observations, so that Trends cannot vanish by accident.
47. As a Shopper, I want archived Categories hidden from the add-Observation picker and still visible in history and statistics until I filter them, so that old names do not clutter entry.
48. As a Shopper, I want a statistics screen that defaults to one Category covering all Shops and including Promotions, so that I see the overall milk Trend first.
49. As a Shopper, I want filters for Category, date range, Shop, and Promotion status (include / exclude / only), so that I can ask narrower questions later.
50. As a Shopper, I want each Observation drawn as its own point on the chart, so that I can see how sparse the data is.
51. As a Shopper, I want each calendar month’s Monthly Median drawn as well, so that one expensive week does not look like a new level.
52. As a Shopper, I want the sample count shown next to every Monthly Median, so that I know whether a month is one Observation or eight.
53. As a Shopper, I want no Trend sentence until that filtered Category has at least three Observations spanning at least two distinct calendar months, so that the app does not pretend a couple of points are inflation.
54. As a Shopper, I want the Trend, when allowed, to compare the first and last valid Monthly Median in the filtered range and show both prices, both months, the percentage change, and the total Observation count, so that I can judge the claim.
55. As a Shopper, I want a month with no Observations omitted from the median series rather than interpolated, so that gaps stay visible.
56. As a Shopper, I want changing a historical Observation to recompute statistics immediately, so that corrections are trustworthy.
57. As a Shopper, I want a list under the chart of the filtered Observations with date, Shop, pack, paid price, Unit Price, and Promotion, so that I can jump to the Visit that looks wrong.
58. As a Shopper, I want empty-state copy on statistics that says there is not enough evidence yet, so that a new Category does not look broken.
59. As a Shopper, I want JSON Backup of the entire book, so that clearing the browser or losing the phone does not destroy years of Observations.
60. As a Shopper, I want Backup to include schema version, export time, Shops, Categories (including archived and merge metadata), Visits, Observations, Drafts, and settings, so that a restore is complete.
61. As a Shopper, I want restore to validate the file, show counts, and replace the current book only after I confirm, so that a bad file cannot half-apply.
62. As a Shopper, I want the app to write an automatic pre-restore Backup I can recover from if the chosen file is wrong, so that restore is reversible once.
63. As a Shopper, I want CSV export with one row per Observation, so that I can inspect the series in a spreadsheet.
64. As a Shopper, I want Backup and CSV to use the system file picker when the browser supports it, and a file-input / download fallback otherwise, so that I can put files in Drive or Downloads myself.
65. As a Shopper, I want the app to request persistent browser storage after my first completed Visit and show whether it was granted, so that I know eviction is still possible.
66. As a Shopper, I want copy that never claims installation or persistence is a Backup, so that I keep exporting JSON.
67. As a Shopper, I want the app to work offline after the shell has finished precaching, with an explicit “Ready offline” state, so that I do not trust a home-screen icon that has not cached yet.
68. As a Shopper, I want to install the app to my Android home screen from a private HTTPS URL, so that I do not need Google Play.
69. As a Shopper, I want the UI to be usable with one thumb on a phone-width screen, so that logging at the till is practical.
70. As a Shopper, I want number fields to use numeric keyboards, so that price and quantity are fast to type.
71. As a Shopper, I want currency and dates shown in en-GB with £ and DD/MM/YYYY, so that the book matches UK receipts.
72. As a Shopper, I want to add an Observation without a Visit scan or camera, so that the MVP stays a manual notebook.
73. As a Shopper, I want future receipt scanning to be able to create the same Draft Visit the manual form creates, so that today’s data model does not have to be thrown away.
74. As a Shopper, I want no spending totals, budgets, shopping lists, or “my inflation rate” across Categories, so that the app stays an observation book.
75. As a Shopper, I want a five-Observation Visit to be completable in under one minute once I know the screens, so that I will keep using it.

## Implementation Decisions

### Product and platform

1. Build a client-only PWA: React, TypeScript, and Vite. No backend, auth, analytics, remote fonts, or cloud SDK.
2. Persist with Dexie over IndexedDB. Precache the full app shell with `vite-plugin-pwa` / Workbox. Validate Backup files with Zod.
3. Host one stable HTTPS origin. Origin changes strand the database unless the Shopper restores a Backup.
4. Locale is United Kingdom only: currency GBP, dates as local calendar dates, copy in English.
5. The implementable domain lives in one module, StaplePriceWatch. UI, Dexie, file pickers, and the service worker are adapters around it.

### The seam

6. Tests and UI both talk to StaplePriceWatch. Do not add other domain seams. Persistence adapters save and load a snapshot; they do not own rules.
7. StaplePriceWatch is an in-memory book with command / query operations. Construct it empty or from a validated snapshot. Every mutating command returns a new book state or a typed error; do not throw for expected validation failures.
8. Time is injected: `today()` returns the Shopper’s current local calendar date. Tests pass a fixed date. Do not read `new Date()` inside domain rules.

### Identifiers and records

9. Every Shop, Category, Visit, and Observation has a stable unique id generated by the book (UUID).
10. Money: the Shopper types pounds, the book stores integer pence. £2.10 is `210`. Reject amounts that are not a non-negative multiple of £0.01 after rounding to the nearest penny. Paid price on a saved Observation must be at least `1` pence.
11. Quantity: a positive decimal with at most 3 decimal places, strictly greater than zero.
12. Store both the entered quantity/unit and the normalised values. Never let the Shopper edit Unit Price directly.
13. Visit status is `draft` or `complete`.
14. Category records: id, name, Unit Family (`mass` | `volume` | `count`), archived-at (optional), merged-into Category id (optional).
15. Shop records: id, name, archived-at (optional), built-in flag for the seeded list.
16. Visit records: id, local date `YYYY-MM-DD`, Shop id, status, created-at, updated-at.
17. Observation records: id, Visit id, Category id, paid pence, entered quantity, entered unit, quantity in Canonical Unit, Unit Price in pence per Canonical Unit, Promotion boolean, optional Comment, created-at, updated-at.
18. Settings records: recent Category ids in display order, last quantity/unit per Category, last Shop id, persistence-prompted flag.

### Seed data

19. On first launch, if the book is empty, seed Categories:

    - Eggs — `count`
    - Milk — `volume`
    - Chicken wings — `mass`
    - Baking potatoes — `mass`
    - Cherry tomatoes — `mass`

20. On first launch, seed Shops in this order: Tesco, Sainsbury's, Asda, Morrisons, Aldi, Lidl, Waitrose, M&S, Co-op, Iceland, Ocado, Corner Shop. All are built-in. The Shopper may add more. Built-in Shops may be renamed by the Shopper; keep the original id.

### Units

21. Accepted entered units:

    - mass: `g`, `kg`
    - volume: `ml`, `L`
    - count: `item`

22. Treat `l` as `L` on input. Treat `pc`, `pcs`, and `each` as `item` on input if the UI offers them; persist `item`.
23. Conversion: `1 kg = 1000 g`, `1 L = 1000 ml`, `1 item = 1 item`. Reject any conversion across Unit Families.
24. Quantity in Canonical Unit:

    - mass: kilograms = grams / 1000, or kg unchanged
    - volume: litres = millilitres / 1000, or L unchanged
    - count: items unchanged

25. Unit Price in pence per Canonical Unit = paid pence ÷ quantity in Canonical Unit. Example: 350 g at £2.10 → 0.35 kg → 210 / 0.35 = 600 pence/kg = £6.00/kg.
26. Display money as `£#.##`. Display Unit Price as `£#.##` per `kg`, `L`, or `item`, rounding half-up to two decimal pounds for display only. Keep full precision internally for median calculation.
27. Cherry tomatoes and other mass Categories always compare as £/kg even when the Shopper typed grams.

### Commands the book must support

28. Shop commands: add (unique name, case-insensitive trim), rename, archive. Archived Shops stay on historical Visits and drop out of the picker.
29. Category commands: add (name + Unit Family), rename, archive (only if zero Observations point at it), merge source into target.
30. Merge rules: source and target must be different, same Unit Family, neither already merged into another Category. Repoint every Observation, last-quantity default, and recent-list entry from source to target. Set source.mergedInto = target.id and archive source. Target name is unchanged unless the Shopper renames it separately.
31. `startVisit({ date, shopId })` creates a Draft. Many Drafts are allowed. Home lists them, newest updated first.
32. `updateVisit` may change date or Shop on Draft or complete Visits.
33. `addObservation` / `updateObservation` validate Category exists and is not archived (archived Categories may still be edited in-place on historical Observations, but cannot be chosen for new ones), unit matches family, price and quantity valid. Compute normalised fields. Updating a complete Visit is allowed.
34. `removeObservation` deletes that Observation. If a complete Visit then has zero Observations, the command fails unless `deleteVisitIfEmpty` is true, in which case the Visit is deleted.
35. `completeVisit` requires date, existing Shop, and at least one valid Observation. It returns `duplicate-warning` without completing when another complete Visit has the same date, same Shop, and at least one shared Category id. `completeVisit(..., { acknowledgeDuplicate: true })` completes anyway.
36. `discardVisit` deletes a Draft and its Observations. It cannot delete a complete Visit (`deleteVisit` does that).
37. Repeated-entry defaults: after a successful add, store that Category’s quantity and unit. Prefill on next add for that Category. Never prefill paid price, Promotion, or Comment.
38. Recent Categories: on each successful add, move that Category id to the front of a recent list, cap at 8, then append remaining unarchived Categories alphabetically.

### Statistics

39. Do not persist chart results. Compute from Observations every time.
40. Filter first: optional Category id (required for the main chart in MVP — the screen is per Category), inclusive date range on Visit date, optional Shop id, Promotion mode `include` (default) / `exclude` / `only`.
41. An Observation is in the set only if its Visit is `complete`.
42. Group surviving Observations by Visit date’s calendar month (`YYYY-MM`).
43. Monthly Median: sort that month’s Unit Prices; if n is odd, take the middle; if n is even, take the arithmetic mean of the two middle values. Attach `n`.
44. Omit months with n = 0. Do not draw connecting lines across omitted months as if they were measured.
45. Evidence gate for a Trend: filtered Observation count >= 3 and distinct months with a Monthly Median >= 2. Otherwise show points and medians with the label “Not enough evidence for a trend yet”.
46. When the gate passes, percentage change = (lastMedian - firstMedian) / firstMedian * 100, using the first and last months in the filtered median series. Show those two months, both Unit Prices, percentage to one decimal place, and total n. If firstMedian is 0, do not claim a percentage (cannot happen if paid prices are >= 1 pence and quantities are positive — still guard it).
47. Shop filter compares that chain only. Default is all Shops.
48. There is no combined inflation number across Categories.

### Backup and CSV

49. Backup JSON shape:

    - `schemaVersion`: integer, start at `1`
    - `exportedAt`: ISO timestamp
    - `shops`, `categories`, `visits`, `observations`, `settings`

50. Restore is replace-only in the MVP. Validate with Zod. Preview counts. On confirm, keep the current snapshot as `preRestore` in memory / a side key just long enough to offer one “undo restore” in that session, then write the new snapshot in one transaction. Reject unknown future schema versions. Migrate older versions if any exist.
51. CSV is not a restore format. Columns: visit date, shop name, category name, paid pounds, entered quantity, entered unit, unit price pounds, canonical unit, promotion (true/false), comment, visit id, observation id.
52. File UX: feature-detect File System Access (`showSaveFilePicker` / `showOpenFilePicker`). Fallback: `<input type="file">` for open, Blob download for save. Sharing is optional and never the only Backup path.

### UI behaviour

53. Screens: Home, Visit editor, Observation editor, Visit history detail, Statistics, Categories, Shops, Backup/restore.
54. Visit editor: date, Shop, list of current Observations with Unit Price, add, complete, discard (Draft only).
55. Observation editor: Category picker, price, quantity, unit segmented control legal for that Category, Promotion toggle, Comment, live Unit Price preview.
56. Statistics: Category selector, filters, chart (Observation points + Monthly Medians + counts), Trend sentence or evidence-gate copy, Observation table.
57. After first successful `completeVisit`, call `navigator.storage.persist()` from the UI adapter and show Granted or Not granted.
58. Show “Ready offline” only after the service worker reports the app shell is cached.
59. Phone-first layout. No tablet/desktop-specific design required.

### Future scanning

60. Do not implement camera or OCR. Keep Visit + Observation as the only write model so a later scanner can create a Draft and Observations the Shopper still confirms.

## Testing Decisions

A good test names a Shopper-visible rule, drives StaplePriceWatch through its commands, and asserts on queries or returned errors. It does not open Dexie, React, or the DOM. Expected numbers are literals from this spec (350 g at £2.10 → 600 pence/kg), never recomputed with the same helper the production code uses.

### Seam under test

**StaplePriceWatch** (in-memory, injected `today`).

This is the only required seam. It catches validation, unit conversion, Visit completion, duplicate warning, merge/archive, defaults, Backup round-trip, CSV contents, Monthly Median, evidence gate, and Trend maths.

It misses layout, keyboards, file-picker quirks, service-worker caching, and IndexedDB eviction. Those are checked once on a physical Android phone before calling the MVP done, not with a second automated seam.

There is no prior art in this repo.

### Required examples

Cover at least these behaviours, one vertical slice at a time:

- Seed then complete a Visit with Eggs 12 items at £2.40 → Unit Price 20 pence/item.
- Milk 568 ml at £1.15 → Unit Price 115 / 0.568 pence/L (assert the stored canonical quantity 0.568 and that display rounding is applied only at the edge).
- 350 g at 210 pence → 600 pence/kg.
- Reject Milk saved with `item`.
- Reject 0 pence and 0 quantity.
- Prefill last quantity/unit, not price.
- Draft survives as listed state after `startVisit` + add without complete.
- `completeVisit` duplicate warning, then acknowledge.
- Merge Baking potatoes into a renamed Category and see statistics follow.
- Three Observations in one month → no Trend; add a fourth in a second month → Trend appears.
- Even-count median: Unit Prices 10, 20, 30, 40 → median 25.
- Promotion `exclude` drops an offer Observation from n and the median.
- Backup restore replaces, rejected on invalid JSON.
- CSV has one row per Observation and no Draft rows.

## Out of Scope

- Camera, receipt images, OCR, barcode scanning, label learning
- Budgets, spending totals, payment methods, loyalty, shopping lists, savings streaks
- Brand, quality, fat percentage, or organic as comparison dimensions
- Pack-size / shrinkflation callouts beyond Unit Price
- Combined multi-Category inflation index
- Official ONS / CPI comparison
- Forecasts, alerts, shopping recommendations
- Cloud sync, accounts, multi-user households
- CSV import, historical spreadsheet import
- Returns, refunds, negative prices
- Native Android or Capacitor packaging
- Google Play listing
- Separate PIN or extra database encryption
- Tablet/desktop-specific layouts
- Automatic promotion detection
- Shop branches / locations
- Keeping receipt photos

## Further Notes

### Acceptance

The MVP is done when a physical Android Chrome install can: add the PWA, go offline, complete a five-Observation Visit in under a minute, edit it, see a Trend after enough data, export JSON and CSV, restore JSON, and survive a reload. Clearing site data must empty the book; the UI must say so.

### Suggested build order for a smaller model

1. StaplePriceWatch in TypeScript with an in-memory snapshot and the tests above. No UI.
2. Vite React shell that calls the book and redraws from queries.
3. Dexie adapter: load snapshot on boot, write snapshot after each successful command.
4. Visit / Observation screens, then statistics, then Category/Shop management.
5. Backup / restore / CSV.
6. PWA precache, persistence prompt, phone check.

### Research

Existing apps (ShelfPenny, Product Price Tracker, TillBook, GrocSnap, and others) were reviewed in `docs/research-existing-apps.md`. They do not implement this model. Do not change scope to match them.

## Comments

*This spec was synthesised from the grilling session and existing-app research on 2026-10-31.*
