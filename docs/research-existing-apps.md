# Existing apps and Android local-first PWA feasibility

**Research date:** 2026-10-31

## Executive conclusion

Building is justified. The closest verified products are **Product Price Tracker**, **ShelfPenny**, **TillBook**, and **My Price Log**, but none of their first-party materials documents the settled combination of a shopping-visit entry model, promotion-aware observations, monthly medians with sample counts, the `>=3 observations across >=2 months` trend gate, and historical/category maintenance. ShelfPenny does document both JSON backup/restore and CSV export; the others have different or unverified portability gaps. “Not documented” is not proof that a feature is absent, but it means none can safely be selected as an off-the-shelf replacement without hands-on acceptance testing.

For this scan-free, single-user MVP, an installable **local-first PWA** is the best first implementation. Chrome on Android can install an HTTPS web app as a WebAPK, the service worker can precache the complete application shell for offline use, IndexedDB is designed for structured offline data, and Chrome 132 added the File System Access API to Android and WebView. Those capabilities cover this MVP without a native bridge. The principal trade-off is data durability: browser storage is best-effort unless persistence is granted, remains tied to the Chrome profile/origin, and can be deleted through site-data controls. A prominent, versioned JSON backup/restore flow is therefore a core durability feature, not an optional extra.

Recommended implementation: React + TypeScript + Vite, Dexie over IndexedDB, `vite-plugin-pwa`/Workbox for app-shell precaching, and Zod validation for versioned restore files. Host the static build at one stable HTTPS origin. Keep all data and calculations on-device; do not add a backend for the MVP.

## Scope and evidence standard

- The target is personal observation of grocery inflation, not budgeting, receipt-total management, retailer-price scraping, forecasting, or an official inflation index.
- Product claims below come primarily from current Google Play pages, official product sites/manuals, official repositories, and platform documentation. A feature is marked **unknown** when the reviewed first-party source does not establish it.
- “Current” means a listing, release, or maintained first-party page was reachable on the research date. A reachable web listing does not prove that Google Play will offer installation to every UK account/device.
- Store descriptions are developer claims, not independent functional tests. No candidate APK was installed during this research.

## Existing and recently available products

### Product Price Tracker

- **Platform and status:** Android; its Google Play listing was reachable and reported an update on 2026-10-25. The listing describes offline operation and no required account. [Google Play](https://play.google.com/store/apps/details?hl=en&id=com.ngoctd.product_price_tracker)
- **Manual workflow:** the user creates products and updates their prices; each update is saved with a time, note, and optional store. Quantity and unit can be recorded, with `500 g` and `1 box` given as examples. Recently used stores are offered for quicker selection. [Google Play](https://play.google.com/store/apps/details?hl=en&id=com.ngoctd.product_price_tracker)
- **Units and shops:** the listing claims unit-price display and an optional store/source, but does not document conversion rules such as g↔kg, ml↔L, or incompatible unit families. **Unit normalization beyond the entered unit is unknown.** [Google Play](https://play.google.com/store/apps/details?hl=en&id=com.ngoctd.product_price_tracker)
- **History and analysis:** every update is retained; a mini chart shows a sparkline, low/high values, and percent change from the previous value. Quick Compare shows current price, previous price, and percentage change; filters include category and price range. The listing does not document monthly aggregation, medians, sample counts, promotion filtering, or a minimum-evidence trend rule. [Google Play](https://play.google.com/store/apps/details?hl=en&id=com.ngoctd.product_price_tracker)
- **Offline, export, and backup:** the listing says it works offline and exports/imports JSON; import merges records without deleting existing data. CSV export and full-replacement/transactional restore semantics are **unknown**. [Google Play](https://play.google.com/store/apps/details?hl=en&id=com.ngoctd.product_price_tracker)
- **Pricing:** **unknown from the current fetched first-party page.** The current page establishes availability and features but does not expose a reliable price or purchase model in the fetched content. [Google Play](https://play.google.com/store/apps/details?hl=en&id=com.ngoctd.product_price_tracker)
- **Decisive mismatch:** this is the closest feature-level substitute, but its documented model is product-price updates rather than one dated shop visit containing multiple category observations. The settled statistical definition, promotions, category merge/archive, complete JSON replacement restore, and CSV export are not documented.

### ShelfPenny: Grocery Price Book

- **Platform and status:** Android; Google Play shows an initial release updated 2026-09-19. [Google Play](https://play.google.com/store/apps/details?hl=en_GB&id=au.softwarehouse.shelfpenny)
- **Manual workflow:** the user records a product, store, price, pack size, and timestamp, then can search and filter the saved observation history. The listing does not describe one visit containing several observations. [Google Play](https://play.google.com/store/apps/details?hl=en_GB&id=au.softwarehouse.shelfpenny)
- **Units and shops:** it compares two to six compatible items on a per-kilogram, per-litre, or per-item basis and retains product/store details. The exact accepted entry units and conversion/error rules are not documented. [Google Play](https://play.google.com/store/apps/details?hl=en_GB&id=au.softwarehouse.shelfpenny)
- **History and analysis:** observation history, favourites, search, and filters are documented. Charts, monthly medians, sample counts, promotion handling, and the settled trend gate are not documented. [Google Play](https://play.google.com/store/apps/details?hl=en_GB&id=au.softwarehouse.shelfpenny)
- **Offline/local behavior:** no account or cloud sync is required; grocery records remain on-device unless explicitly exported. The app contains ads, and its listing says the advertising SDK processes data. [Google Play](https://play.google.com/store/apps/details?hl=en_GB&id=au.softwarehouse.shelfpenny)
- **Exports, backups, and pricing:** CSV export and JSON backup/restore are explicit. Every feature is advertised as free, with advertising and optional cosmetic rewarded ads rather than subscriptions or feature paywalls. [Google Play](https://play.google.com/store/apps/details?hl=en_GB&id=au.softwarehouse.shelfpenny)
- **Decisive mismatch:** this is the strongest portability match, but the settled visit/category model, promotion filter, category merge/archive, monthly statistics, and evidence-gated trend are unverified. It was also a very recent first release on the research date.

### TillBook: Grocery Price Book

- **Platform and status:** Android; Google Play shows a first release dated 2026-07-22. [Google Play](https://play.google.com/store/apps/details?hl=en_GB&id=ie.nxeratech.tillbook)
- **Manual workflow:** an item can be added manually or recalled by barcode; the user records a shelf/receipt price, pack size, and shop. It is explicitly a personal price book based on the user’s own entries. [Google Play](https://play.google.com/store/apps/details?hl=en_GB&id=ie.nxeratech.tillbook)
- **Units and shops:** the listing says it compares consistent €/kg, €/L, or per-item figures across user-selected shops and can expose pack-size changes. It does not document the exact accepted input units or conversion/error rules. [Google Play](https://play.google.com/store/apps/details?hl=en_GB&id=ie.nxeratech.tillbook)
- **History and analysis:** it shows the latest logged price across shops, personal item price history, pack-size changes, and the lowest logged price when sufficient history exists. The meaning of “sufficient” is not specified, and monthly medians, sample counts, trend thresholds, promotions, and filters are **unknown**. [Google Play](https://play.google.com/store/apps/details?hl=en_GB&id=ie.nxeratech.tillbook)
- **Offline/local behavior:** the listing says items, prices, and shops remain on-device; no account, ads, analytics, retailer feed, or internet access other than Google Play is used. [Google Play](https://play.google.com/store/apps/details?hl=en_GB&id=ie.nxeratech.tillbook)
- **Exports, backups, and pricing:** JSON, CSV, and backup/restore are not documented on the first-party listing. The listing does not expose a reliable price model in the fetched content, so pricing is **unknown**. [Google Play](https://play.google.com/store/apps/details?hl=en_GB&id=ie.nxeratech.tillbook)
- **Decisive mismatch:** conceptually very close, but export/restore and the specified statistics are unverified; the listing also describes item history rather than the required visit-with-many-observations workflow.

### My Price Log

- **Platform and status:** open-source native Android, distributed through F-Droid and GitHub rather than a verified Google Play listing. F-Droid lists version 0.3.4, added 2026-10-01, requiring Android 11 or newer; the source repository is MIT-licensed. [F-Droid](https://f-droid.org/packages/app.zornslemma.mypricelog/) [source repository](https://github.com/ZornsLemma/my-price-log)
- **Manual workflow:** users define stores and products, then enter, update, or confirm the price for a product/store while shopping. Each product/store pair has at most one current price, with prior values available in history; price notes are supported. [official manual](https://zornslemma.github.io/my-price-log-docs/)
- **Units and shops:** it calculates and compares unit prices across stores and automatically converts within and between metric, imperial, and US customary systems. Customer-loyalty discounts can be configured per store. [official manual](https://zornslemma.github.io/my-price-log-docs/)
- **History and analysis:** it exposes per-product/per-store history and marks values fresh, stale, or ancient according to configurable age thresholds. It can apply a user-configured “inflation” penalty to old prices, but the manual explicitly says this is a staleness/uncertainty adjustment, not derived inflation analysis or forecasting. [official manual](https://zornslemma.github.io/my-price-log-docs/)
- **Offline/local behavior:** it works entirely offline and is designed as a local specialised database. [official manual](https://zornslemma.github.io/my-price-log-docs/)
- **Exports and backups:** Settings → Backup writes all collections to a SQLite database file; restore replaces all existing collections. The author recommends keeping and inspecting multiple backups and says Android Auto Backup behavior is untested for this app. CSV and JSON exports are not documented. [official manual](https://zornslemma.github.io/my-price-log-docs/)
- **Pricing:** F-Droid distributes the open-source APK without a purchase flow. [F-Droid](https://f-droid.org/packages/app.zornslemma.mypricelog/)
- **Decisive mismatch:** the manual expressly says the app is not intended to collect an objective, detailed history of everything bought; it prioritizes one current product/store price and recency-aware comparison. It has no documented monthly-median trend analysis, visit grouping, promotion filter, JSON backup, or CSV export. [official manual](https://zornslemma.github.io/my-price-log-docs/)

### Price Cruncher

- **Platform and status:** Android and iOS. The Android Google Play listing was reachable and showed an update on 2026-10-14; the US listing labels the app as containing ads and in-app purchases. [Google Play UK](https://play.google.com/store/apps/details?hl=en_GB&id=ca.brainservice.price.cruncher) [Google Play US](https://play.google.com/store/apps/details?hl=en_US&id=ca.brainservice.price.cruncher)
- **Listing inconsistency:** the current English listing foregrounds a unit-price calculator, while the current French listing describes product, multi-store, shopping-list, barcode, price-history, offline, guest-mode, and shared-list features. Current reviews and developer replies on the English page also refer to stored items, stores, brands, prices, and legacy-data import. This inconsistency makes exact current feature entitlement and regional behavior uncertain. [English listing](https://play.google.com/store/apps/details?hl=en_GB&id=ca.brainservice.price.cruncher) [French listing](https://play.google.com/store/apps/details?hl=fr&id=ca.brainservice.price.cruncher)
- **Manual workflow, units, and shops:** the French listing claims unit-price comparison across shops, quantities, and package sizes, including g→kg and oz→lb normalization; users can add their own stores and price entries. [French listing](https://play.google.com/store/apps/details?hl=fr&id=ca.brainservice.price.cruncher)
- **History and analysis:** the French listing claims retained price history and sale-pattern visibility. The iOS version history documents a price-trends screen and editing history dates. Monthly medians, sample counts, promotion filtering, and the settled trend gate are not documented. [French Google Play listing](https://play.google.com/store/apps/details?hl=fr&id=ca.brainservice.price.cruncher) [Apple App Store](https://apps.apple.com/us/app/price-cruncher-price-compare/id6759057196)
- **Offline, exports, and backup:** the French listing claims offline and guest modes; iOS release notes document data export, but the current sources do not establish the export format, completeness, restore semantics, or equivalent Android behavior. [French listing](https://play.google.com/store/apps/details?hl=fr&id=ca.brainservice.price.cruncher) [Apple App Store](https://apps.apple.com/us/app/price-cruncher-price-compare/id6759057196)
- **Pricing:** the Android US listing says ads and in-app purchases. The iOS listing is free with in-app purchases, but iOS prices must not be assumed to match Android or the UK. [Google Play US](https://play.google.com/store/apps/details?hl=en_US&id=ca.brainservice.price.cruncher) [Apple App Store](https://apps.apple.com/us/app/price-cruncher-price-compare/id6759057196)
- **Decisive mismatch:** it is oriented toward deal/unit-price comparison and shopping lists, with optional account/shared features. The exact Android data portability and the required inflation-observation statistics remain unverified.

### GroceryBudget

- **Platform and status:** Android and iOS; the current official site says Android is available and describes an offline-first release with no account required to start. The Google Play page was reachable, though its fetched update date and feature entitlements lag the newer official-site claims. [official Android announcement](https://grocerybudget.app/blog/grocerybudget-now-on-android) [Google Play](https://play.google.com/store/apps/details?hl=en_US&id=com.ynctry.grocerybudget)
- **Manual workflow:** a user creates a cart/trip, chooses a store, and adds item name, quantity, unit, and price manually, by voice, or by scanner; completing the trip retains item, store, and date. Repeated entries can use the last price at the selected store. [price-tracker page](https://grocerybudget.app/features/grocery-price-tracker) [getting-started guide](https://grocerybudget.app/blog/getting-started-with-grocerybudget)
- **Units and shops:** quantity and unit are accepted, and history can compare the same item across stores. The reviewed official pages do not document canonical g/kg or ml/L conversion rules. [features](https://grocerybudget.app/features) [price-tracker page](https://grocerybudget.app/features/grocery-price-tracker)
- **History and analysis:** the official site claims item price trends and store comparison based on the user’s own purchases. It also has spending analysis, which is outside this MVP. Monthly median calculation, sample counts, promotion filters, and the specified trend gate are not documented. [features](https://grocerybudget.app/features) [price-tracker page](https://grocerybudget.app/features/grocery-price-tracker)
- **Offline/local behavior:** the official site says core lists and saved price memory work offline, while AI receipt and shelf-label scanning need a connection. It also says no account is required to begin and data stays on-device in guest use. [price-tracker page](https://grocerybudget.app/features/grocery-price-tracker) [Android announcement](https://grocerybudget.app/blog/grocerybudget-now-on-android)
- **Exports and backup:** the official pricing and getting-started pages say CSV export is available and can serve as an external backup. Complete JSON export/restore is not documented. [pricing](https://grocerybudget.app/pricing) [getting-started guide](https://grocerybudget.app/blog/getting-started-with-grocerybudget)
- **Pricing conflict:** the current official pricing page says price memory, history/store comparison, CSV export, offline use, and no-account use are in the free tier, with Premium at US$9.99/month or US$29.99/year and regional variation. The accessible Google Play description says price history/store comparison and CSV are Premium. Treat entitlements as **uncertain until tested in the UK Android build**. [official pricing](https://grocerybudget.app/pricing) [Google Play](https://play.google.com/store/apps/details?hl=en_US&id=com.ynctry.grocerybudget)
- **Decisive mismatch:** this is trip-oriented and has meaningful personal-price overlap, but budgeting and receipt totals are central, complete JSON restore is absent from the documentation, and the settled median/trend semantics are unverified.

### Price Right – Price Tracker

- **Platform and status:** Android and iOS; Google Play was reachable and showed an update on 2026-07-18. [Google Play](https://play.google.com/store/apps/details?hl=en_GB&id=com.meemold.itpr)
- **Manual workflow, units, and shops:** it is a shared shopping list that remembers paid prices across stores and automatically compares unit prices per 100 g or per ounce. Photo/receipt AI entry and online lookups are optional additions; current and historical manual entry details are not fully documented. [Google Play](https://play.google.com/store/apps/details?hl=en_GB&id=com.meemold.itpr)
- **History and analysis:** the listing establishes remembered previous prices and cross-store unit comparison, but does not document charts, monthly medians, sample counts, promotion handling, or category maintenance. [Google Play](https://play.google.com/store/apps/details?hl=en_GB&id=com.meemold.itpr)
- **Offline/local behavior:** real-time sharing and sync are first-class features, and the Play data-safety section reports collection of personal info, app activity, and device/other IDs. Fully offline, account-free, local-only use is **unknown**. [Google Play](https://play.google.com/store/apps/details?hl=en_GB&id=com.meemold.itpr)
- **Exports and pricing:** the listing says users can export their data. It does not state the format or restore behavior. The current listing says no ads, subscriptions, or locked features. [Google Play](https://play.google.com/store/apps/details?hl=en_GB&id=com.meemold.itpr)
- **Decisive mismatch:** cloud sharing/sync conflicts with the no-server/no-cloud requirement, while trend statistics and complete portable backup are unverified.

### Trolley.co.uk

- **Platform and status:** UK web service plus Android/iOS app; its official app page presents current access to 16+ UK supermarkets, and a Google Play URL exists for package `trolley.co.uk`. [official app page](https://www.trolley.co.uk/app/) [Google Play](https://play.google.com/store/apps/details?id=trolley.co.uk)
- **Workflow:** users search Trolley’s retailer-fed catalogue, compare a product across stores, and create saveable lists; this is not manual recording of what the user personally paid. [official comparison guide](https://www.trolley.co.uk/help-guide/how-do-i-compare-supermarket-prices/3662) [official app page](https://www.trolley.co.uk/app/)
- **Units and shops:** product pages can expose unit prices such as price per 100 g or per 100 ml, and the service covers named UK chains. The source does not establish user-controlled normalization or custom shops. [official explore page](https://www.trolley.co.uk/explore/) [official app page](https://www.trolley.co.uk/app/)
- **History and analysis:** product pages have a price-history chart showing the current year and part of the previous year, and list items can trigger price-change alerts. These are retailer catalogue prices, not the user’s observation history. [price-history guide](https://www.trolley.co.uk/help-guide/how-do-i-see-price-history/3674) [price-alert guide](https://www.trolley.co.uk/help-guide/how-do-i-setup-price-alerts/3672)
- **Offline/local behavior and exports:** lists are account features. Offline use, local-only storage, CSV/JSON export, and restore are not documented in the reviewed first-party pages. [price-alert guide](https://www.trolley.co.uk/help-guide/how-do-i-setup-price-alerts/3672) [official app page](https://www.trolley.co.uk/app/)
- **Pricing:** the official page says supermarket comparison is free, with no subscription, ads, or sudden in-app-purchase requests. [official app page](https://www.trolley.co.uk/app/)
- **Decisive mismatch:** it answers “where is a catalogued product cheapest now?” rather than “how has my normalized, personally observed staple-category price changed?” It depends on a remote service and accounts for saved lists.

### Grocy and Grocy Android

- **Platform and status:** Grocy is a self-hosted web household-management/stock system with an installable PWA; Grocy Android is an open-source companion requiring a running Grocy server and cannot operate standalone. [Grocy](https://grocy.info/) [Grocy Android repository](https://github.com/patzly/grocy-android)
- **Manual workflow, units, and shops:** Grocy’s purchase workflow records product, amount, quantity unit, price, store, location, date-related stock data, and note. The system is inventory-centric rather than a lightweight observation log. [official demo purchase page](https://en.demo.grocy.info/purchase)
- **History and analysis:** the product card has price history, and the official API includes product price-history data; Grocy’s changelog documents a trendline and purchase-unit-based history. The settled monthly-median and evidence-gating rules are not documented. [Grocy changelog](https://grocy.info/changelog) [OpenAPI source](https://github.com/grocy/grocy/blob/master/grocy.openapi.json)
- **Offline/local behavior:** Grocy explicitly says its installable web frontend has no offline usage capability. Grocy Android supports offline shopping lists, but most transactions rely on the server and are not handled offline. [Grocy](https://grocy.info/) [Grocy Android offline issue](https://github.com/patzly/grocy-android/issues/384)
- **Exports, backups, and pricing:** self-hosting gives the operator server/database control, but the reviewed product sources do not document the MVP’s standard-picker JSON restore and CSV observation export. Server hosting and maintenance are required. [Grocy Android repository](https://github.com/patzly/grocy-android) [Grocy](https://grocy.info/)
- **Decisive mismatch:** it violates the no-server requirement and introduces stock, expiry, recipes, locations, and household-management complexity unrelated to personal inflation observation.

## Is an existing product close enough?

**No, not on verified evidence.**

ShelfPenny and Product Price Tracker should be the first hands-on comparisons if the goal changes from “implement the settled model” to “avoid building at almost any cost.” ShelfPenny documents offline/account-free observations, unit-price comparisons, CSV, and JSON backup/restore. Product Price Tracker documents offline manual price history, quantity/unit, stores, notes, charts, and JSON import/export. Their unresolved gaps are exactly the differentiators in the settled MVP: visit-level entry, promotions, fully specified canonical conversions, monthly medians/sample counts, the trend validity gate, and category merge/archive.

TillBook is another close conceptual match for a private grocery price book, but it has only a first-release listing and no documented export/restore. My Price Log has the strongest verified offline/unit-conversion/backup story, but its one-current-price-per-product/store model and stated design philosophy conflict with an observation dataset intended for defensible monthly inflation trends.

GroceryBudget could reduce implementation work if budgeting, cart totals, and its entitlement ambiguity were acceptable. They are not: budgeting is expressly excluded, and its complete JSON restore and exact statistics are not documented. Trolley and Grocy solve different problems.

The recommendation to build is therefore based on a model mismatch, not on an absence of price-tracking apps.

## Technical feasibility of a local-first Android PWA

### Installation and offline operation — sourced facts

- Chrome’s “crafted” install promotion requires HTTPS and a manifest with a name/short name, 192 px and 512 px icons, `start_url`, an accepted standalone-capable `display` value, and `prefer_related_applications` absent or false. Chrome’s current promotion criteria also include at least one user tap/click and 30 seconds of viewing. A service worker is not in that current install-promotion list. [web.dev install criteria](https://web.dev/articles/install-criteria)
- Chrome also permits manual installation of pages that do not satisfy crafted-app criteria through **More → Add to Home screen → Install app**; on Android it also uses site-health and recent-visit signals to decide when to promote installation. Meeting the crafted criteria remains preferable because it produces the intended app identity and discoverable install UX. [Chrome installation guidance](https://developer.chrome.com/blog/how_chrome_helps_users_install_the_apps_they_value)
- On Android with Google Mobile Services, Chrome can create a signed WebAPK. A WebAPK appears in the launcher and Android app settings and does not require the user to enable APK sideloading. If WebAPK creation is unavailable, the browser can fall back to a browser-badged shortcut with fewer OS integrations. [web.dev Android installation](https://web.dev/learn/pwa/installation)
- A service worker can intercept scoped requests and answer from Cache Storage while offline. It is installed separately from PWA installation; it does not control the first page load, and existing pages may need a reload before control. [web.dev service workers](https://web.dev/learn/pwa/service-workers) [MDN service-worker usage](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)
- Service workers and Cache Storage require a secure context: HTTPS in production, with localhost treated as secure for development. [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) [MDN CacheStorage](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage)

### Installation and hosting — recommendation/judgment

- A private or unadvertised static URL is technically sufficient if the phone can fetch the page, manifest, service worker, and complete app shell over HTTPS on the first visit. No Play Store listing is required for Chrome installation.
- Treat “offline after installation” as “offline after the app confirms that precaching completed,” not merely after the icon appears. Show an explicit “Ready offline” state after service-worker activation and cache verification.
- Use one stable origin and path. IndexedDB, Cache Storage, service-worker scope, and installed identity are origin/path-sensitive; changing hostnames later would strand the old local database unless the user exports and restores it.
- Bundle fonts, icons, and chart assets into the app shell. Avoid runtime CDNs so the offline guarantee does not depend on caching third-party origins.

### Local database and storage durability — sourced facts

- IndexedDB stores significant amounts of structured data, supports indexes and transactions, and is intended for applications that need rich queries regardless of network availability. [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) [MDN Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
- Browser storage is **best-effort by default**. It can be evicted under storage pressure or when browser-wide storage limits are exceeded, and an origin’s stored data is treated as a unit during eviction. Chromium’s documented maximum is up to 60% of total disk size, but reported quota is an estimate and actual availability can be lower. [MDN storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- `navigator.storage.estimate()` reports estimated origin usage and quota. Writes that exceed available quota can fail with `QuotaExceededError`. [Chrome storage estimate](https://developer.chrome.com/blog/estimating-available-storage-space)
- `navigator.storage.persist()` requests protection from automatic eviction. Chromium grants or silently denies it according to engagement signals such as installation/bookmarking and site engagement; when granted, IndexedDB, Cache Storage, and service-worker data are protected from automatic eviction and remain removable by explicit user action. [web.dev persistent storage](https://web.dev/articles/persistent-storage)
- A Chrome WebAPK uses the current Chrome profile’s site storage rather than an isolated native store. Clearing the Chrome profile or that origin’s site data affects the installed PWA too. [web.dev WebAPKs](https://web.dev/articles/webapks) [Chrome Help: delete browsing data](https://support.google.com/chrome/answer/2392709?co=GENIE.Platform%3DAndroid&hl=en)
- Chromium’s Android uninstall flow opens Chrome site settings so the user can clear associated origin data; the WebAPK itself does not own a separate database. [Chromium web-app registration and data-clear flow](https://chromium.googlesource.com/chromium/src/+/main/components/webapps/docs/android_registration_and_permissions.md)

### Local database and backup — recommendation/judgment

- The expected grocery dataset is small, so quota capacity is not the practical concern; accidental clearing, device loss, restore bugs, and denied persistence are.
- Request persistent storage after installation or after the user saves the first completed visit. Display whether it was granted, but never describe it as a backup.
- Make JSON backup prominent and repeatable. A backup should contain a format version, export timestamp, all categories (including archived/merge metadata), shops, visits, observations, drafts, and settings. Validate before mutation, preview counts, and restore in one database transaction.
- Support both **replace** and, only if carefully specified later, **merge** restore. For the MVP, replace is safer and easier to verify; create an automatic pre-restore backup first.
- The official sources do not establish that Android backs up or restores Chrome origin storage as application data. Treat PWA browser storage as having **no guaranteed device/cloud backup** and rely on explicit JSON export.

### File import, export, picker, and sharing — sourced facts

- Chrome 132 made the File System Access API available on Android and Android WebView. `showOpenFilePicker()` reads a user-selected file and `showSaveFilePicker()` creates or selects a destination; the API must be feature-detected. [Chrome 132 release notes](https://developer.chrome.com/release-notes/132) [Chrome File System Access guide](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access)
- File System Access picker calls require a secure context and user activation. The API is Chromium-oriented; the official guide recommends feature detection and describes `<input type="file">` as the open-file fallback and a generated download as the save fallback. [Chrome File System Access guide](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access)
- Standard `<input type="file">` lets the user select local files and exposes them as `File` objects for JavaScript to read. [MDN file input](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file) [MDN using files](https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications)
- The Web Share API requires HTTPS and transient user activation. File sharing must be tested with `navigator.canShare({files})`; support depends on the file type and target environment. Chrome documents Android file sharing for audio, images, video, and text documents, while MDN’s usual shareable text types include CSV and plain text but do not promise JSON. [Chrome Web Share files](https://developer.chrome.com/blog/new-in-chrome-75) [MDN Navigator.share](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)

### File UX — recommendation/judgment

- Primary path on current Chrome Android: save JSON and CSV through `showSaveFilePicker()`, and restore through `showOpenFilePicker()`.
- Compatibility fallback: import through `<input type="file" accept=".json,application/json">`; export through a Blob/object-URL download.
- Offer “Share CSV” only when `navigator.canShare()` accepts the generated CSV `File`. Do not make sharing the sole backup path, and do not assume `.json` sharing works.
- CSV is a reporting/interoperability export, not a complete restore format. JSON is the authoritative backup because CSV cannot reliably preserve drafts, IDs, category merge/archive state, settings, and schema version.

## PWA versus native Android versus Capacitor

### Local-first PWA

**Sourced facts**

- It can be installed from an HTTPS URL as a WebAPK or shortcut and can operate offline through a service worker/Cache Storage. [Android PWA installation](https://web.dev/learn/pwa/installation) [service workers](https://web.dev/learn/pwa/service-workers)
- IndexedDB supplies transactional structured local storage, while StorageManager exposes quota estimates and a persistence request. [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) [persistent storage](https://web.dev/articles/persistent-storage)
- Current Chrome Android has native open/save file pickers through File System Access, with standard file-input/download fallbacks. [Chrome 132](https://developer.chrome.com/release-notes/132) [File System Access guide](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access)

**Judgment**

- Best fit for the MVP: one codebase, static hosting, URL-based updates, no store review, no sideload permission, and no native capability missing from the settled scope.
- Main cost: browser-profile storage is easier for a user to clear and has no guaranteed app backup. The product must teach and encourage JSON backups.
- Risk is manageable because the app has no server, background sync, scanner, push, or complex OS integration.

### Native Android

**Sourced facts**

- Android recommends Room over direct SQLite for non-trivial structured local data; Room provides compile-time query verification and migration support. [Android Room guide](https://developer.android.com/training/data-storage/room)
- The Storage Access Framework provides system pickers: `ACTION_CREATE_DOCUMENT` creates a user-chosen file and `ACTION_OPEN_DOCUMENT` opens one, without broad storage permission. [Android shared documents guide](https://developer.android.com/training/data-storage/shared/documents-files)
- App-specific files and a Room database are removed on uninstall. Android Auto Backup is enabled by default for eligible modern apps, can upload app data to the user’s Google Drive, and restores data during installation; an app can opt out with `android:allowBackup="false"`. [Android storage overview](https://developer.android.com/training/data-storage) [Android Auto Backup](https://developer.android.com/identity/data/autobackup)
- A privately hosted APK requires a signed release, user opt-in to install unknown apps, and ongoing update signing/version discipline. Android accepts an update only when application ID, signing certificate, and version requirements match. [Android website distribution](https://developer.android.com/studio/publish) [Android update rules](https://developer.android.com/google/play/app-updates)

**Judgment**

- Native gives the strongest Android-specific storage and lifecycle control and the cleanest SAF integration, but those advantages do not justify Kotlin/Compose, APK signing, private distribution, and update overhead for this MVP.
- The no-cloud requirement would require explicitly disabling Android Auto Backup, then retaining the same manual JSON-backup obligation.
- Reconsider native only if later scope adds capabilities the web cannot meet reliably, such as intensive background work, widgets, deep platform integrations, or Play-managed distribution.

### Capacitor web wrapper

**Sourced facts**

- Capacitor embeds a web app in a native Android runtime and bridges JavaScript to Java/Kotlin; its Android project is managed through Android Studio. [Capacitor Android](https://capacitorjs.com/docs/android)
- Capacitor’s Preferences plugin uses Android SharedPreferences, is intended only for lightweight key/value data rather than a database, and is cleared on uninstall. Its own docs recommend a SQLite-based solution for larger or query-heavy data. [Capacitor Preferences](https://capacitorjs.com/docs/apis/preferences)
- Capacitor can produce a signed APK or AAB, and its web bundle must be built and synced into the native project before distribution. [Capacitor build](https://capacitorjs.com/docs/cli/commands/build) [Capacitor workflow](https://capacitorjs.com/docs/basics/workflow)
- The Capacitor Filesystem plugin exposes native file access, but Android directory behavior varies by OS version; on Android 11+ its Documents access is limited to files/folders created by the app. [Capacitor Filesystem](https://capacitorjs.com/docs/apis/filesystem)

**Judgment**

- Capacitor preserves web UI reuse but inherits native signing/distribution/update work. Since Chrome 132 already supplies Android file pickers, the wrapper adds little value to this MVP.
- Wrapping later remains possible if Play distribution or a native-only feature becomes valuable. Keep domain logic and persistence interfaces separate enough that a Capacitor adapter can be added without rewriting calculations.
- Do not use Capacitor Preferences as the observation database.

## Recommended stack and design

### Stack

- **React + TypeScript + Vite:** a small client-only application with a static production bundle. Vite’s production output is designed for static hosting. [Vite static deployment](https://vite.dev/guide/static-deploy)
- **Dexie over IndexedDB:** Dexie provides TypeScript types, promise-based indexed queries, schema versions, and atomic multi-table transactions while staying close to IndexedDB. [Dexie TypeScript guide](https://dexie.org/docs/Typescript) [Dexie API](https://dexie.org/docs/API-Reference)
- **`vite-plugin-pwa` with Workbox `generateSW`:** precache the complete build output and icons; the plugin generates the manifest, service worker, and registration code. Its precache process stores the declared app resources for offline request handling. [Vite PWA guide](https://vite-pwa-org.netlify.app/guide/) [precache guide](https://github.com/vite-pwa/vite-plugin-pwa/blob/main/docs/guide/service-worker-precache.md)
- **Zod for backup schemas:** validate imported, untrusted JSON before opening a write transaction and keep explicit schema-version migrations. Zod provides TypeScript-first runtime schemas and `parse`/`safeParse`. [Zod](https://zod.dev/) [Zod basics](https://zod.dev/basics)
- **No backend, authentication, analytics, remote fonts, or cloud SDK in the MVP.**

### Data model

Recommended records:

- `Shop`: stable ID, display name, archived timestamp if ever needed.
- `Category`: stable ID, name, unit family (`mass`, `volume`, `count`), canonical display unit (`kg`, `L`, `item`), archived timestamp, optional `mergedIntoCategoryId`.
- `Visit`: stable ID, local calendar date, shop ID, status (`draft` or `complete`), created/updated timestamps.
- `Observation`: stable ID, visit ID, category ID, paid price stored as integer pence, entered quantity and unit, normalized base quantity, normalized unit price, promotion flag, optional comment, created/updated timestamps.
- `Settings`: recent-category ordering, repeated-entry defaults, export metadata, and UI preferences.

Store raw entered quantity/unit and normalized values. This makes restore auditable and allows normalization logic to be corrected later without losing what the user typed. Reject zero/negative quantities and cross-family conversions; convert only g↔kg and ml↔L, with count remaining per-item.

Treat category merge as a transaction that repoints observations and defaults to the surviving category, then archives the source category. Do not delete historical observations.

### Statistics

- Filter observations first by shop/date/promotion selection.
- Group by category and calendar month.
- Calculate median from normalized unit prices and show the sample count beside every point.
- “First/last change” uses the first and last valid monthly medians in the filtered series.
- Show a trend claim only when the filtered category has at least 3 observations spanning at least 2 distinct months; otherwise show descriptive values with an explicit insufficient-evidence state.
- Promotions remain included by default; the promotion filter changes the selected observation set before monthly aggregation.
- Derive statistics from observations rather than persisting chart results, so historical edits and category merges cannot leave stale aggregates.

### Durability and release requirements

- After first completed visit, request `navigator.storage.persist()` and show the returned state.
- Include a one-tap complete JSON backup and a restore dry-run that reports schema version and record counts.
- Generate CSV with one row per observation, including visit date, shop, category, paid pence/price, raw quantity/unit, normalized unit price/unit, promotion, and comment.
- Keep at least one fixture backup from each released schema version and test forward migration.
- Test install and first-run precache on a physical Android device, then enable airplane mode and verify cold launch, create/edit/delete, statistics, JSON export/import, and CSV export.
- Test clearing site data and uninstall/reinstall as destructive scenarios; the UI must never imply that installation itself protects the database.

## Limitations and unresolved questions

- Availability was checked through public web pages, not by signing into a UK Google Play account on a specific Android device. Regional/device install eligibility remains unverified.
- Product descriptions are self-reported. No candidate APK was installed, so undocumented features may exist and listed behavior may differ from the current binary.
- Price Cruncher’s current English and French listings materially differ; exact Android feature/entitlement behavior is uncertain.
- GroceryBudget’s official 2026 pricing page and its accessible Google Play description disagree about whether history/store comparison and CSV export are free or Premium.
- TillBook is a very recent first release with no first-party documentation beyond its Play listing; export, restore, pricing, promotion handling, and statistical details are unknown.
- My Price Log is verified through F-Droid/GitHub, not Google Play, and requires Android 11+ in its current F-Droid release.
- Trolley’s Google Play page was not reliably machine-readable during research, so feature claims rely on Trolley’s first-party site and help pages.
- Browser behavior can vary by Chrome version, Android vendor, browser profile, free storage, and whether WebAPK minting is available. Feature detection and a physical-device acceptance test remain necessary.
- The reviewed official sources do not promise Android system backup of Chrome IndexedDB/Cache Storage. The recommendation deliberately treats explicit JSON export as the only dependable backup.

## Final decision

Proceed with the local-first PWA. Before implementation is considered complete, run a short acceptance test of ShelfPenny, Product Price Tracker, and TillBook on the target Android device if they are installable in the UK; that test may refine interaction ideas, but the verified gaps mean it should not block the build.
