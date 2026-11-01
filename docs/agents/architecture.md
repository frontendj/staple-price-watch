# Architecture

Domain words are in [GLOSSARY.md](../../GLOSSARY.md). [ADR 0001](../adr/0001-local-first-pwa.md) covers the install shell. [ADR 0002](../adr/0002-the-book-is-the-only-record.md) covers where a price is stored.

Tests cover the book, tag read, shared save, and loaded book. The camera, the on-device reader, and the screen are checked on a phone.

## Book

The book is the module that owns Visits, Observations, Categories, Shops, Unit Price, Monthly Median, Trend, Backup, and the CSV report. It stores the price ([ADR 0002](../adr/0002-the-book-is-the-only-record.md)).

The seam is `StaplePriceWatch` together with `poundsToPence`, `quoteUnitPrice`, `unitsFor`, and `canonicalUnit`. A command returns a `BookResult`: the next book and a value, or the same book and a `BookErrorCode`. Callers pass a `Clock`. `StaplePriceWatch` is the adapter, in `src/staple-price-watch.ts`.

Open `src/staple-price-watch.ts` and `src/staple-price-watch.test.ts` for a price, a Visit, an Observation, a Category, a Shop, a Trend, Backup contents, the CSV columns, or a refusal code.

## Tag read

Tag read is the module that turns recognised Tag text into confirm fields.

The seam is `readShelfTag(text, categoryNames)`, returning a `TagRead`: name, pack price, Promotion price, quantity, and unit. The adapter is `src/read-shelf-tag.ts`. A written amount becomes pence through the book's `poundsToPence`.

Open `src/read-shelf-tag.ts` and `src/read-shelf-tag.test.ts` for what a Tag fills in before the Shopper saves.

## Shared save

Shared save is the module the camera confirm and the typed Observation both use to record one Observation.

The seam is `saveObservation(book, input)`. The adapter matches a Category by name or creates one, then updates an Observation or confirms a Tag on the book, and returns a `BookResult`. `categoryNamed` is the match the screen uses before save. The adapter is `src/save-observation.ts`.

Open `src/save-observation.ts` and `src/save-observation.test.ts` for the two ways of recording a price agreeing, a Category created on save, or an edit of an Observation.

## Loaded book

Loaded book is the module that opens the book, writes it after a successful command, and builds the sentence for a refusal.

The seam is `openLoadedBook` and `commitLoadedBook` for a snapshot and a `BookResult`, and `loadBook` and `saveBook` for the device. Loaded book is the adapter the screen uses. The Dexie store stays inside `src/loaded-book.ts`.

Open `src/loaded-book.ts` and `src/loaded-book.test.ts` for opening a Backup, the wording of a refused save, or the on-device store. Backup validity stays on the book.

## On-device reader

The on-device reader is the module that turns a photo into text.

The seam is `recogniseTag(image)`, returning the recognised text, or an empty string when the read fails. Tesseract is the adapter inside `src/recognise-tag.ts`. Language data is `public/tessdata/eng.traineddata.gz`.

Open `src/recognise-tag.ts` for the photo or a blank read. Tag read parses the text.

## Screen

The screen is the module the Shopper sees.

The seam is the `App` component in `src/App.tsx`. `src/main.tsx` mounts it and loads `src/styles.css`. The screen calls the seams above. The camera's current Visit and the persistence prompt live here; the book records that the prompt was shown. The chart draws the book's statistics.

Open `src/App.tsx` for a screen, a control, the camera, the chart, or a tab. Open `src/styles.css` for layout.

## Files

Files is the module that reads and writes a text file on the device.

The seam is `saveTextFile` and `openTextFile`. Files is the adapter for the browser save and open pickers, with a download link when the save picker is absent. The adapter is `src/files.ts`.

Open `src/files.ts` for downloading a Backup or a CSV, or for choosing a Backup file. The book owns the file contents.

## Format

Format is the module for on-screen date, money, and month text, and for today's date.

The seam is `showDate`, `showMoney`, `monthLabel`, and `localToday`. The adapter is `src/format.ts`. The screen passes `localToday` as the book's clock.

Open `src/format.ts` for how a date or a pound amount is written. Unit Price text comes from the book.

## Install shell

The install shell is the module that makes the app installable and available offline.

The seam is `vite.config.ts`: the service worker, the web manifest, and the Pages base path. The service worker plugin is the adapter. Icons live in `public/`. The document is `index.html`.

Open `vite.config.ts` for install, offline caching, or the hosted path. Read [ADR 0001](../adr/0001-local-first-pwa.md) before changing that choice.
