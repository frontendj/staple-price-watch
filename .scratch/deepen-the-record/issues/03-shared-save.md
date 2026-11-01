# 03: Shared save

**What to build:** The camera confirm and the typed Observation save one Observation the same way. A new Category is created when the name is new. An edit updates the existing Observation.

**Blocked by:** 01: Pay price

**Status:** resolved

- [x] Saving a new name creates the Category and one Observation
- [x] The first save on a new Visit creates the Draft and the Observation together
- [x] A second save of the same Shop, date, Category, pack size, pack price, and Promotion price is refused and leaves the book unchanged
- [x] An edit that changes only the Comment is kept
- [x] An edit that would make two Observations identical is refused

## Comments

Resolved on `deepen-the-record`. The camera confirm and the typed Observation share one save.
