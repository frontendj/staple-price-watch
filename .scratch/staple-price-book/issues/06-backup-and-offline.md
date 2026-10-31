# 06: Backup and offline

**What to build:** The Shopper can save a JSON Backup, restore it after confirming the counts, export CSV, install the app, and keep using it after the shell is cached. The screen says when browser persistence was granted, and it does not call that a Backup.

**Blocked by:** 03: Keep the book on this device

**Status:** done

Read `.scratch/staple-price-book/spec.md` User Stories 59–68 and decisions 49–52 and 57–58. Also `docs/adr/0001-local-first-pwa.md`.

- [x] Backup JSON includes schema version and every record. Invalid JSON is rejected. Restore replaces the book
- [x] CSV has one row per completed Observation and no Draft rows
- [x] File System Access is used when present, with input/download fallback
- [x] "Ready offline" appears only after precache. Persistence is requested after the first completed Visit
