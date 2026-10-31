# 01: Staple Price Watch

**What to build:** The Shopper can record Visits and Observations in memory, get correct Unit Prices, edit history, merge Categories, see Monthly Medians and a Trend only when the evidence gate passes, and round-trip a Backup and a CSV. No screens yet.

**Blocked by:** None (can start immediately)

**Status:** done

Read `.scratch/staple-price-watch/spec.md`, `GLOSSARY.md`, and `docs/adr/0001-local-first-pwa.md`. Implement the `StaplePriceWatch` module described under "The seam" and "Commands the book must support". Cover the "Required examples" in Testing Decisions. Use the TDD skill at `/Users/dmitriikuznetsov/.agents/skills/tdd/SKILL.md`. The only test seam is `StaplePriceWatch`.

- [x] Seed Categories and Shops match the spec
- [x] Unit Prices for eggs, 568 ml milk, and 350 g at 210 pence match the literal examples
- [x] Wrong Unit Family, zero price, and zero quantity are rejected
- [x] Drafts, repeated-entry defaults, and the duplicate-Visit warning behave as specified
- [x] Merge, archive, Monthly Median, evidence gate, Promotion filter, Backup replace, and CSV match the spec
