# 02: Tag read

**What to build:** Recognised Tag text and the Category names return the confirm fields only. Nothing is saved, and the photo is never seen.

**Blocked by:** 01: Pay price

**Status:** resolved

- [x] `Cabbage 300g 12.5 £`, with no Cabbage Category, yields the name Cabbage, quantity 300, unit g, and 1250 pence, and does not save
- [x] Text that contains Milk selects the Category Milk. Cherry tomatoes wins over Tomatoes. Buttermilk does not select Milk
- [x] `£ 12 . 5` is 1250 pence. `£1.89/kg` is 189 pence for 1 kg
- [x] `568ml £1.15 £2.02/L` is pack price 115 pence for 568 ml and no Promotion
- [x] `2 for £3` together with `£1.80 each` yields no prices
- [x] A missed read leaves the confirm fields blank

## Comments

Resolved on `deepen-the-record`. Recognised text and watched Category names return the confirm fields, and nothing is saved.
