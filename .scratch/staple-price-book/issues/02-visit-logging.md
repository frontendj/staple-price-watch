# 02: Log a Visit on the phone

**What to build:** The Shopper can open the app, start a Visit, add Observations with a live Unit Price, save and add another, complete the Visit, and edit or delete it afterwards.

**Blocked by:** 01: Staple Price Book

**Status:** ready-for-agent

Read `.scratch/staple-price-book/spec.md` (User Stories 3–39, 69–72, 75 and UI behaviour). The screen calls `StaplePriceBook`. Do not retest domain rules through the DOM.

- [ ] Home shows new Visit, Drafts, and recent completed Visits
- [ ] Visit editor sets date and Shop once, prefills last quantity and unit, and never prefills price
- [ ] Complete is blocked until the Visit is valid, and the duplicate warning can be acknowledged
- [ ] A completed Visit can be edited or deleted, and Unit Price updates from price and quantity
