# 01: Pay price

**What to build:** A written amount becomes the same pence whether the Shopper types it or a Tag is read, and the Unit Price shown before save is the Unit Price stored on the Observation.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] £12.50 and £12.5 are 1250 pence, typed or read
- [ ] £12.505 is 1251 pence and £12.504 is 1250 pence, typed or read
- [ ] Milk at 115 pence for 568 ml quotes and stores the same Unit Price
- [ ] Promotion 99 pence on that pack stores Unit Price 99 / 0.568 and keeps the pack price at 115
- [ ] An equal Promotion of 115 pence still quotes £2.02/L, and saving the line unchanged keeps 115
- [ ] Setting the Promotion equal to the pack price on purpose is refused
