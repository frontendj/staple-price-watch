# 04: See a Trend

**What to build:** The Shopper can open one Category, filter by date, Shop, and Promotion, and see Observation points, Monthly Medians with sample counts, and a Trend only when the evidence gate passes.

**Blocked by:** 02: Log a Visit on the phone

**Status:** done

Read `.scratch/staple-price-watch/spec.md` User Stories 48–58 and Statistics. The screen renders the book's query. It does not recompute medians in the component.

- [x] Default view is one Category, all Shops, Promotions included
- [x] Months with no Observations are gaps
- [x] Below the evidence gate the screen says there is not enough evidence
- [x] When the gate passes, the sentence shows both months, both prices, the percentage, and the count
