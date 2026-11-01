# Deepen the record

Status: ready-for-agent

The product is Staple Price Watch. Use `GLOSSARY.md` terms. Read `docs/adr/0001-local-first-pwa.md` and `docs/adr/0002-the-book-is-the-only-record.md`. The book stays local-first: no account, no server, no cloud OCR. This work does not change what the Shopper can do.

## Problem Statement

The Shopper records a Tag and types an Observation through two screens that each decide the Category, the pack price, and the Unit Price. A fix on one screen leaves the other wrong. A Tag can fill 300 g and drop £12.50, or the Unit Price shown before save can differ from the Unit Price stored. The book is already the only record, but the path that prepares a save is split, so the Shopper cannot trust that both ways of recording a price are the same price.

## Solution

The Shopper still photographs a Tag, confirms the fields, and can still type the same Observation, including an edit. Both ways create a Category when the name is new and then save through one path into the book. A written amount becomes pence once, and that same rule produces the Unit Price shown before save and the Unit Price stored. Opening the book, saving it, and the sentence that names a refused duplicate live in one place. Visits, Observations, statistics, and Backup stay in the book.

## User Stories

1. As a Shopper, I want a seen price and a price I typed to become the same kind of Observation, so that the Trend stays about local prices.
2. As a Shopper, I want no record of whether I bought the staple, so that the book does not become a till receipt.
3. As a Shopper, I want a Tag to be the printed shelf label, so that it is not a Comment and not an Observation until I save.
4. As a Shopper, I want the photo thrown away after the confirm screen, so that the book does not keep pictures.
5. As a Shopper, I want the photo read on the phone, so that the Tag never leaves the device.
6. As a Shopper, I want a missed read to leave the confirm fields blank, so that I can type the Tag myself.
7. As a Shopper, I want a Tag that names a Category I already watch to select that Category, so that Milk on the label becomes Milk in the book.
8. As a Shopper, I want the longer Category name chosen when two names could fit, so that Cherry tomatoes wins over Tomatoes.
9. As a Shopper, I want a name that only sits inside another word left unmatched, so that Buttermilk does not become Milk.
10. As a Shopper, I want an unknown name filled in on the confirm screen, so that Cabbage is ready for me to add.
11. As a Shopper, I want to add that Category from the confirm screen the same way I add one while typing, so that I pick its Unit Family before it exists.
12. As a Shopper, I want an archived Category hidden from that picker, so that an old name does not return through a Tag.
13. As a Shopper, I want the camera confirm and the typed Observation to save the same pack fields, so that the two screens cannot disagree.
14. As a Shopper, I want a new Category created only when I save, so that abandoning the confirm screen adds nothing.
15. As a Shopper, I want an edit of an existing Observation to update that Observation, so that a correction does not create a second one.
16. As a Shopper, I want pack price and pack size required, so that Unit Price can still be computed.
17. As a Shopper, I want £12.50, whether typed or read, to be 1250 pence, so that the pounds and the pence both survive.
18. As a Shopper, I want £12.5 with the pound sign before or after the number to be 1250 pence, so that a Tag printed as `12.5 £` is the same amount.
19. As a Shopper, I want a gap or an odd dot in `£ 12 . 5` to stay 1250 pence, so that a photo which splits the decimal does not become £12.
20. As a Shopper, I want a third decimal rounded half-up, so that £12.505 is 1251 pence and £12.504 is 1250 pence, typed or read.
21. As a Shopper, I want a Tag that shows only £1.89/kg offered as £1.89 for 1 kg, so that a loose-produce label has a pack size.
22. As a Shopper, I want a printed unit rate such as £2.02/L ignored as a pack price, so that it is not stored as the Promotion.
23. As a Shopper, I want one printed price to be the pack price, so that I do not invent a previous price.
24. As a Shopper, I want a higher previous price and a lower price for the same pack recorded as pack price and Promotion, so that both numbers are kept.
25. As a Shopper, I want `2 for £3` together with `£1.80 each` left blank, so that I choose the pack and the app does not.
26. As a Shopper, I want `2 for £3` alone offered as 2 items at £3, so that a multibuy is a pack size.
27. As a Shopper, I want a new Promotion refused unless it is lower than the pack price, so that the previous price cannot be the cheaper number.
28. As a Shopper, I want an old tick whose two prices are equal to keep showing its Unit Price, so that opening history is not an error.
29. As a Shopper, I want that equal pair to stay valid until I change a price, so that a comment edit does not refuse the line.
30. As a Shopper, I want a later edit that sets the two prices equal to be refused, so that a new save still requires a lower Promotion.
31. As a Shopper, I want the Unit Price shown before save to be the Unit Price stored, so that the form cannot promise one figure and keep another.
32. As a Shopper, I want Unit Price to use the Promotion when one is recorded, and the pack price otherwise, so that the chart shows what I would pay.
33. As a Shopper, I want the pack price to stay on the Observation and not to add a second chart point, so that one Tag is one price in a day.
34. As a Shopper, I want a Draft kept off the chart until I complete the Visit, so that a half-checked Tag does not move the Trend.
35. As a Shopper, I want the first saved Tag to start the Visit, and later Tags to join it, so that one aisle pass is one Visit.
36. As a Shopper, I want Shop and date asked only when the camera has no current Visit, so that I am not picking the Shop on every Tag.
37. As a Shopper, I want the date to default to today and to be changeable before the first save, so that I can record yesterday’s receipt today.
38. As a Shopper, I want Retake to drop the photo and the unsaved choice of Draft, so that the next shot does not join a Visit the camera is not showing.
39. As a Shopper, I want switching tabs after a successful save to keep the camera’s current Visit, so that I can check statistics and come back.
40. As a Shopper, I want a reload to forget only that current Visit, so that I am asked for Shop and date again, while the Draft itself remains for me to choose.
41. As a Shopper, I want a duplicate refused when another Observation has the same Shop, date, Category, pack size, pack price, and Promotion price, so that the same Tag twice does not double the series.
42. As a Shopper, I want that refusal to name the existing Observation, so that I can see the Shop, date, pack price, quantity, and unit that blocked the save.
43. As a Shopper, I want the refusal to leave the book unchanged, so that a second scan cannot replace history.
44. As a Shopper, I want an edit refused when it would make two Observations identical, and an unchanged edit kept, so that saving a line I did not change still works.
45. As a Shopper, I want a second Visit at the same Shop on the same date kept when the price differs, so that completing it does not warn merely because the Category was already seen.
46. As a Shopper, I want include, exclude, and only to keep their current meaning, so that include shows every completed Observation at the pay price, exclude hides those with a Promotion, and only shows those at the Promotion price.
47. As a Shopper, I want Backup to restore an old tick as a Promotion equal to the pack price, and a missing tick as no Promotion, so that history does not jump and no higher price is invented.
48. As a Shopper, I want a bad Backup rejected, so that a broken file does not replace the book.
49. As a Shopper, I want the book I already have to open as that book, so that this work does not empty the device.
50. As a Shopper, I want CSV to keep pack price, Promotion price, and Unit Price, and to skip Drafts, so that the sheet still matches the chart.
51. As a Shopper, I want no spending total, so that the book stays a price record.

## Implementation Decisions

- One plan. Pay price is built first. Tag read and the shared save follow and can land side by side. The loaded book can start at any time. Pay price blocks the other two. Tag read does not block the shared save. The loaded book blocks nothing.
- The book remains the only record of Visits, Observations, statistics, and Backup, as in ADR 0002. None of the new modules store a price.
- Pay price lives inside the book. The amount the Shopper would pay is the Promotion when one is present, otherwise the pack price. Unit Price is that amount divided by the canonical quantity. Display rounding stays at the edge.
- A written amount, typed or read from a Tag, becomes whole pence once. Two digits are exact. A third decimal rounds half-up. £12.50 is 1250 pence. £12.505 is 1251 pence. £12.504 is 1250 pence. £12.5 is 1250 pence with the pound sign before or after the number, and with a gap or a non-standard dot around the decimal.
- A newly saved Promotion is a positive whole number of pence and must be strictly lower than the pack price. An equal pair kept from an old tick stays valid until a price changes, and its Unit Price is still shown. An edit that would leave the two prices equal is refused.
- The quote shown before save and the Unit Price stored on save use that one rule. They cannot disagree.
- Tag read accepts the recognised text and the names of Categories the Shopper already watches. It returns the confirm fields only: Category name or the matched Category, pack price, quantity, unit, and Promotion price. It does not see the photo, and it does not save.
- A missed read returns blank fields. A Category name found in the text is selected, longest name first, and a name that only occurs inside another word does not match. An unknown product name is returned as text so the Shopper can add it. Pack size is kept when it fits the Category’s Unit Family. A lone £/kg price is offered as 1 kg. A unit rate beside a pack price is not a Promotion. Two priced packs, including a multibuy beside an each price, return no prices.
- The on-device reader stays the only thing that turns a photo into text. There is one such reader. No second reader is introduced.
- The camera confirm and the typed Observation share one save. That save creates a Category when the name is new, then hands the pack fields to the book. A new Visit’s first Observation and an Observation added to an existing Visit both go through it. An edit updates the existing Observation. Retake, the camera’s current Visit, and the choice of an existing Draft stay on the screen.
- The loaded book opens the book, saves it after a successful command, and produces the sentence for a refused save. A duplicate sentence names the existing Observation’s Shop, date, pack price, quantity, and unit. The on-device database stays inside this module. There is no second seam in front of it.
- A bad Backup is rejected. A previous-version Backup still migrates ticks as it does today. An empty store still opens the seeded book.
- Update the glossary so Tag is the printed shelf label. Leave the scan spec as the history of the shelf-price behaviour. This spec wins only where structure was undecided. Shopper-facing behaviour stays the behaviour that spec already shipped.

## Testing Decisions

A good test names a Shopper-visible rule, drives one of the seams below, and asserts on the result. It does not open the camera, the on-device reader, React, or the DOM. Expected amounts are literals.

The Shopper already confirmed these seams.

### Seams under test

**The book.** Pay price, the shared pounds-to-pence rule, Unit Price shown and stored, Promotion rules, Visits, Observations, statistics, CSV, and Backup contents. This is the existing book seam. Prefer it for anything the book already answers.

**Tag read.** Recognised text and Category names in. Confirm fields out. No photo and no save. This is the highest seam that can see a Tag without the camera.

**Shared save.** A Category name and pack fields in. A Category is created when needed, then the book holds the Observation, including an edit. No screen.

**Loaded book.** A snapshot or a bad Backup in. The book that opens, the book that is saved, and the refusal sentence out. No screen.

The screen, the camera, and the on-device reader are not automated seams. A phone check still confirms a real shot, Retake, and that the photo is not kept.

### Prior art

The existing book examples. Follow that style. Do not replace them with tests that recompute the expected Unit Price.

### Required examples

- £12.50 and £12.5 are 1250 pence. £12.505 is 1251 pence. £12.504 is 1250 pence. The same literals hold for a Tag and for a typed amount.
- The Unit Price quoted before save for milk at 115 pence for 568 ml is the Unit Price stored. With Promotion 99 pence it is 99 / 0.568, and the pack price remains 115.
- An equal Promotion of 115 pence on that pack still quotes £2.02/L. Saving the line unchanged keeps 115. Setting the Promotion to the pack price on purpose is refused.
- Text `Cabbage 300g 12.5 £` with no Cabbage Category yields the name Cabbage, quantity 300, unit g, and 1250 pence, and does not save.
- Text that contains Milk, and a Category named Milk, selects Milk. Cherry tomatoes wins over Tomatoes. Buttermilk does not select Milk.
- Text `£ 12 . 5` is 1250 pence. Text `£1.89/kg` is 189 pence for 1 kg. Text `568ml £1.15 £2.02/L` is pack price 115 pence for 568 ml and no Promotion. Text `2 for £3` together with `£1.80 each` yields no prices.
- A shared save of a new name creates the Category and one Observation. A second save of the same Shop, date, Category, pack, and prices is refused and leaves the book unchanged. An edit that changes only the Comment is kept.
- A bad Backup does not replace the book. A previous-version Backup with the tick set restores a Promotion equal to the pack price.

## Out of Scope

- Any Shopper-facing behaviour that the shipped shelf-price spec did not already describe
- Cloud OCR, a second on-device reader, or keeping the photo
- Splitting statistics, Backup, or duplicate checks out of the book
- A seam in front of the on-device database
- Automated tests of the screen, the camera, or the reader
- A native wrapper

## Further Notes

The phone check remains part of calling a camera change done. This spec does not require a camera change. It requires the confirm fields and the saved Observation to stay the ones the Shopper already has.

## Comments

*This spec was synthesised from the deepening grill on 2026-11-01. The Shopper confirmed one plan, unchanged behaviour, the book as the only record, the four seams, the ticket order, half-up pence, the word Tag, and ADR 0002.*
