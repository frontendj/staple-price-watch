# 03: Keep the book on this device

**What to build:** The Shopper can close the app and reopen it with the same Visits, Drafts, Categories, Shops, and settings still there.

**Blocked by:** 02: Log a Visit on the phone

**Status:** done

Read `.scratch/staple-price-watch/spec.md` decisions 2 and the Dexie note in Further Notes. Persistence loads and saves a snapshot. Rules stay in `StaplePriceWatch`.

- [x] A completed Visit is still there after a reload
- [x] A Draft is still there after a reload
- [x] A failed command does not write a partial snapshot
