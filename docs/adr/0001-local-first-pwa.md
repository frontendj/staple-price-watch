# Local-first installable web app, not a native Android app

The Shopper uses Android and wants an offline, account-free book. Receipt scanning was dropped from the MVP, so the remaining work is forms, local records, files, and charts. A React TypeScript PWA hosted at one HTTPS origin can do that without Play Store distribution or Kotlin. Native Android or a Capacitor wrapper remains possible later if browser storage or camera OCR becomes the bottleneck.

**Status:** accepted

## Considered options

- Native Android: stronger storage lifecycle, higher implementation cost for this scope.
- Capacitor wrapper: reuses the web UI but adds signing and sideload updates without helping the scan-free MVP.
- Local-first PWA: chosen. Browser storage can be cleared, so Backup is a core feature, not an extra.
