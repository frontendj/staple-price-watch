# Scan shelf prices

Status: ready-for-agent

The product is Staple Price Watch. Use `GLOSSARY.md` terms, with the meaning changes in Implementation Decisions. Read `docs/adr/0001-local-first-pwa.md`. The book stays local-first: no account, no server, no cloud OCR.

## Problem Statement

The Shopper wants to see how staple prices move at the shops around them. They do not buy every staple they watch, and they do not want a spending total. Today an Observation is a purchase they type after a trip, so a price on a shelf tag or on a receipt they keep as paper never enters the Trend unless they bought it and typed the line.

## Solution

A Camera tab in the middle of the bottom bar. The Shopper shoots a shelf tag first, then confirms the Category, pack price, and pack size. An optional promotion price records a lower previous-price offer. Saving the first confirmed tag starts a Visit for one Shop and one date. Later tags join that Visit until it is completed. The chart uses the price the Shopper would pay, and only after the Visit is completed. A receipt is paper the Shopper can record from later, through the same Visit and the same fields. The photo is not kept.

## User Stories

1. As a Shopper, I want a seen price and a price I paid to be the same Observation, so that the Trend is about local prices rather than my spending.
2. As a Shopper, I want no record of whether I bought the staple, so that the book does not become a till receipt.
3. As a Shopper, I want a receipt to be only paper I can record from later, so that I can enter the same prices at home.
4. As a Shopper, I want several Visits to the same Shop on the same date, so that a morning shelf pass and an evening receipt are both kept.
5. As a Shopper, I want a Visit to stay one Shop and one date, so that I am not picking the Shop on every tag.
6. As a Shopper, I want the Camera tab between Statistics and Categories, so that the bar reads Home, Statistics, Camera, Categories, Shops, Backup.
7. As a Shopper, I want the Camera tab to open the camera immediately, so that I can shoot before I fill in a form.
8. As a Shopper, I want the camera to work offline after the app shell is cached, so that the aisle does not need a signal.
9. As a Shopper, I want the photo read on the phone, so that the tag never leaves the device.
10. As a Shopper, I want the photo thrown away after the confirm screen, so that the book does not become a picture archive.
11. As a Shopper, I want a missed read to leave the confirm fields blank, so that I can type the tag myself.
12. As a Shopper, I want the camera to prefill pack price, pack size, and promotion price when it can read them, so that a clear tag is a correction rather than a blank form.
13. As a Shopper, I want to choose the Category myself, so that the product name on the label cannot become a Category.
14. As a Shopper, I want a tag saved only against a Category I already watch, so that a random label does not bury the series.
15. As a Shopper, I want an unknown product to wait until I add the Category myself, so that the scan never invents one.
16. As a Shopper, I want the confirm screen to ask for Category, pack price, pack size, and promotion price, so that I can correct the read before it is stored.
17. As a Shopper, I want nothing stored until I save that screen, so that a bad shot cannot enter the book.
18. As a Shopper, I want Retake to drop the photo and return to the camera, so that I can shoot again without saving.
19. As a Shopper, I want Retake on the first shot to avoid starting a Visit, so that a discarded photo does not leave an empty Draft.
20. As a Shopper, I want leaving the confirm screen without saving to store nothing, so that switching tabs mid-tag drops only the unsaved shot.
21. As a Shopper, I want Shop and date on the confirm screen only when the Camera tab has no current Visit, so that the first tag of a session also starts the Visit.
22. As a Shopper, I want the date to default to today, so that a shelf pass usually needs no date edit.
23. As a Shopper, I want to change that date before the first save, so that I can record yesterday’s receipt today.
24. As a Shopper, I want Save on that first screen to create the Draft and the Observation together, so that opening the camera alone does not leave an empty Visit.
25. As a Shopper, I want further shots to skip Shop and date and join that Draft, so that five tags are one Visit.
26. As a Shopper, I want the Camera tab to show which Visit the next shot will join, so that I can see the Shop and date before I shoot again.
27. As a Shopper, I want that current Visit to survive a switch to another tab, so that I can check Statistics and come back to the same Draft.
28. As a Shopper, I want a reload to forget only the Camera tab’s current Visit, so that I am asked for Shop and date again rather than being attached to an old Draft.
29. As a Shopper, I want the Draft itself to survive that reload, so that I can choose it on the confirm screen.
30. As a Shopper, I want the camera not to attach a photo to an older Draft unless I choose that Draft, so that a Home Draft is not filled by surprise.
31. As a Shopper, I want to choose a Draft I started from Home on the first confirm screen, so that a receipt session I already opened can receive the photo.
32. As a Shopper, I want choosing that Draft to hide a second set of Shop and date fields, so that the Observation uses the Draft’s Shop and date.
33. As a Shopper, I want Complete Visit on the Camera tab, so that I can finish the session where I scanned.
34. As a Shopper, I want Home to keep listing that Draft, so that I can complete it from Home as well.
35. As a Shopper, I want the next shot after completion to start a new Visit, so that a second trip is not mixed into the finished one.
36. As a Shopper, I want to discard a Draft from Home as I do today, so that a false start can still be thrown away.
37. As a Shopper, I want pack price and pack size to be required, so that Unit Price can still be computed.
38. As a Shopper, I want a tag that shows only £1.89/kg to be offered as £1.89 for 1 kg, so that a loose-produce label has a pack size.
39. As a Shopper, I want to correct that offered 1 kg before saving, so that a printed pack weight wins.
40. As a Shopper, I want a single printed price, including a red offer sticker with no previous price, to be the pack price, so that I do not invent a “was” price.
41. As a Shopper, I want the promotion price left empty in that case, so that a lone price is not marked as a promotion.
42. As a Shopper, I want to record a promotion price when the tag also shows a higher previous price, so that the offer and the previous price are both kept.
43. As a Shopper, I want both prices to be for the same pack, so that the promotion is not a different quantity.
44. As a Shopper, I want a new promotion price to be refused unless it is lower than the pack price, so that the previous price cannot be the cheaper number.
45. As a Shopper, I want the Promotion tick removed, so that the price itself is the record of an offer.
46. As a Shopper, I want a yellow sticker not to set the promotion price by itself, so that a bad guess cannot mark an offer.
47. As a Shopper, I want a “2 for £3” tag recorded as one pack of 2 at £3 when that is the offer I am watching, so that a multibuy is just a pack size.
48. As a Shopper, I want a tag that also shows £1.80 each recorded as whichever offer I choose, so that the app does not decide the best offer.
49. As a Shopper, I want one save to store one pack, so that the single and the multibuy are not forced into one Observation.
50. As a Shopper, I want a second Observation when I also save the other pack size, so that both offers can exist because the pack size differs.
51. As a Shopper, I want the optional Comment left for me to type, so that a brand on the label is not copied in unless I write it.
52. As a Shopper, I want the computed Unit Price shown before I save, so that I can catch a bad pack size.
53. As a Shopper, I want Unit Price to use the promotion price when I recorded one, so that the chart shows what I would pay.
54. As a Shopper, I want Unit Price to use the pack price otherwise, so that a tag with no offer still has a price.
55. As a Shopper, I want the pack price to stay visible on the Observation, so that the previous price is not lost.
56. As a Shopper, I want the pack price not to add a second point on the chart, so that one tag does not look like two prices in a day.
57. As a Shopper, I want a confirmed tag to sit on the Draft until I complete the Visit, so that a half-checked tag does not move the Trend.
58. As a Shopper, I want the Trend to update when I complete the Visit, so that finished sessions enter the chart immediately.
59. As a Shopper, I want a duplicate refused when another Observation has the same Shop, date, Category, pack size, pack price, and promotion price, so that scanning the same tag twice does not double the series.
60. As a Shopper, I want that refusal to cover Drafts and completed Visits, so that a second trip cannot store the identical record.
61. As a Shopper, I want a different price, pack size, or promotion price kept, so that a real change on the same day stays in the book.
62. As a Shopper, I want the duplicate’s existing Observation shown, so that I can see the record that blocked the save.
63. As a Shopper, I want the new Observation not to overwrite the old one, so that a second scan cannot silently replace history.
64. As a Shopper, I want to edit the existing Observation when the first price was wrong, so that a correction has one home.
65. As a Shopper, I want an edit refused when it would make two Observations identical under that rule, so that a correction cannot create the duplicate either.
66. As a Shopper, I want editing an Observation not to count as a duplicate of itself, so that saving an unchanged line still works.
67. As a Shopper, I want completing a Visit not to warn merely because that Shop and date already have the Category, so that a second trip is allowed.
68. As a Shopper, I want the statistics filter’s include mode to show every completed Observation at the price I would pay, so that the default chart is unchanged in spirit.
69. As a Shopper, I want exclude to hide Observations that have a promotion price, so that I can look at tags with no offer.
70. As a Shopper, I want only to show Observations that have a promotion price, at that promotion price, so that I can look at offers alone.
71. As a Shopper, I want the list under the chart to show pack price, promotion price when present, and the Unit Price used on the chart, so that I can see both numbers without opening the Visit.
72. As a Shopper, I want an Observation saved before this change to keep its chart price, so that history does not jump.
73. As a Shopper, I want an old Promotion tick to become a promotion price equal to that Observation’s pack price, so that the filter still finds it.
74. As a Shopper, I want an old Observation with no tick to have an empty promotion price, so that it is not treated as an offer.
75. As a Shopper, I want no invented higher “was” price on those old Observations, so that migration does not fabricate a previous price.
76. As a Shopper, I want a migrated Observation whose two prices are equal to remain valid until I change a price, so that opening history is not an error.
77. As a Shopper, I want a later edit that sets the promotion price equal to the pack price to be refused, so that new saves still require a lower offer.
78. As a Shopper, I want Backup to include the promotion price, so that a restore keeps offers.
79. As a Shopper, I want a Backup from before this change to restore through the same tick migration, so that an old file still loads.
80. As a Shopper, I want CSV to include pack price, promotion price, and Unit Price on each Observation row, so that the sheet matches the chart.
81. As a Shopper, I want manual entry on a Visit to use the same price fields, so that a receipt typed at home matches a scanned tag.
82. As a Shopper, I want the last pack size for a Category to prefill, and never the last price, so that a stale price cannot sneak in from the previous tag.
83. As a Shopper, I want the wrong Unit Family, a zero price, and a zero quantity still refused, so that a scan cannot save a broken line.
84. As a Shopper, I want an archived Category still hidden from the confirm screen’s picker, so that old names do not return through the camera.
85. As a Shopper, I want no spending total anywhere on this flow, so that the book stays a price record.

## Implementation Decisions

- Keep one write model. The camera does not create a new kind of record. A confirmed tag is an Observation on a Visit.
- Replace the Observation’s Promotion tick with an optional promotion price in whole pence. The existing paid price is the pack price. Both prices are for the same entered quantity and unit.
- The pay price is the promotion price when it is present, otherwise the pack price. Unit Price is the pay price divided by the canonical quantity, using the book’s existing division. Display rounding stays at the edge.
- A newly saved promotion price is a positive whole number of pence and must be strictly lower than the pack price. Absence means there is no promotion price.
- Rows migrated from a tick may store a promotion price equal to the pack price. They stay valid until the Shopper changes either price. An edit that would leave the two prices equal is refused.
- Identity of a duplicate is the Visit’s Shop, the Visit’s date, the Category, the entered quantity, the entered unit, the pack price, and the promotion price, treating two empty promotion prices as the same. Compare across Drafts and completed Visits. The Observation being edited is not compared with itself.
- Refusing a duplicate does not change the book. The failure identifies the existing Observation so the screen can show it.
- Remove the Visit-level duplicate warning. Completing a Visit no longer fails because another Visit shares the Shop, the date, and a Category. Two different prices on that day are two Observations.
- Statistics keep ignoring Drafts. Points use the pay price’s Unit Price. Include shows every matching completed Observation. Exclude drops Observations that have a promotion price. Only keeps those Observations. The pack price is not a second point.
- Each statistics row exposes the pack price, the promotion price when present, and the Unit Price.
- Backup schema moves forward one version. New exports write the promotion price and do not write the tick. Restoring the previous version migrates ticks as above and then behaves as the new version. Invalid files are still rejected.
- CSV gains the promotion price beside the pack price and the Unit Price. Drafts stay out of the CSV.
- The book does not see photos, OCR text, or “£/kg” as a special case. The confirm screen is responsible for offering 1 kg when the read is only a per-kilogram price. The Shopper can change the quantity and unit before save.
- The book does not rank multibuy against single price. The Shopper saves the pack they want. A second save with a different pack size is a different Observation.
- The Camera tab’s current Visit is interface state, not a field on the Visit. It is cleared by Retake of an unsaved first shot, by leaving an unsaved confirm screen, by completing the Visit, by discarding it, and by a reload. It is not cleared by switching to another tab after a successful save. A reload does not auto-select a remaining Draft.
- The first save creates the Visit and the Observation in one successful command. A failed save, including a duplicate refusal, creates neither when the Visit did not already exist.
- Choosing an existing Draft on the confirm screen adds the Observation to that Draft and makes it the Camera tab’s current Visit.
- OCR runs on the device. No image, no recognised text, and no price is sent off the phone. No photo is written into the book or into Backup.
- Update the glossary so an Observation is a recorded price rather than a purchase, and so Promotion is the optional lower price rather than a tick. Unit Price stays the pay price divided by the canonical quantity.
- Keep the accepted local-first ADR. Do not add a native wrapper to reach the camera.

## Testing Decisions

A good test names a Shopper-visible rule, drives StaplePriceWatch through its commands, and asserts on queries or returned errors. It does not open the camera, React, Dexie, or the DOM. Expected numbers are literals, never recomputed with the same helper the production code uses.

### Seam under test

**StaplePriceWatch** (in-memory, injected `today`).

This is the only required seam. It is the seam the existing book tests already use. It covers promotion price, pay-price Unit Price, the duplicate refusal, the removed Visit warning, statistics filters, Draft exclusion, migration of old ticks, Backup, and CSV.

It does not cover the camera, OCR quality, Retake, tab order, or the confirm screen. Those are checked once on a physical Android phone: shoot a tag, correct the fields, save, Retake, complete the Visit, and confirm the photo is not retained.

### Prior art

The existing StaplePriceWatch examples. Follow that style. Where an old example asserted the Visit-level duplicate warning or a Promotion tick, change the example to the rule in this spec.

### Required examples

- Milk, pack price 115 pence for 568 ml, no promotion price, stores Unit Price 115 / 0.568 pence per litre.
- The same pack with promotion price 99 pence stores Unit Price 99 / 0.568, and the pack price remains 115.
- A promotion price equal to or higher than the pack price is refused on a new save.
- A lone pack price has no promotion price.
- Two Visits at the same Shop on the same date can each hold Milk when the prices differ. Completing the second does not warn.
- The same Shop, date, Category, pack size, pack price, and promotion price is refused on the second save, whether the first Observation is on a Draft or a completed Visit, and the failure identifies the first Observation.
- A different pack size at the same price is kept.
- Editing an Observation onto an identical sibling is refused. Saving it unchanged is kept.
- A Draft Observation is absent from statistics. Completing the Visit makes its pay-price Unit Price appear.
- Include shows an offer and a non-offer. Exclude drops the offer. Only keeps the offer and uses the promotion price. The pack price is not an extra point.
- A previous-version Backup Observation with the tick set restores with promotion price equal to its pack price and the same Unit Price as before. A tick that was off restores with no promotion price.
- That migrated equal pair remains valid. Changing the promotion price to the pack price on purpose is refused.
- CSV includes the promotion price and excludes Draft rows.

## Out of Scope

- Cloud OCR, a hosted vision API, or sending the photo anywhere
- Keeping the photo, the raw OCR text, or a scan history
- Barcode scanning, product databases, and creating a Category from a label
- Ranking or auto-selecting the best of two offers
- A multibuy type that is not a pack size
- Detecting yellow stickers, loyalty prices, or meal deals
- Spending totals, baskets, or a bought-versus-seen flag
- Shop branches
- Replacing typed entry
- A second automated test seam for the screen

## Further Notes

The phone check is part of calling the feature done. The automated seam cannot see the camera.

The glossary and the previous MVP spec still call an Observation a purchase and Promotion a tick. This spec wins where they disagree. Update the glossary as part of the work. Leave the MVP spec as the history of the first book.

## Comments

*This spec was synthesised from the shelf-price grilling session on 2026-11-01. The agreed test seam is StaplePriceWatch.*
