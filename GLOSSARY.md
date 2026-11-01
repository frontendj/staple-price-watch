# Staple Price Watch

A personal record of what staple groceries actually cost, used to observe inflation in a small repeated basket. It is not a budget, shopping list, or receipt archive.

## Language

**Staple Price Watch**:
The application. A local collection of Visits, Observations, Categories, and Shops plus the statistics derived from them.
_Avoid_: receipt scanner, expense tracker, budget app, price comparison site

**Shopper**:
The single person using the book on their own device.
_Avoid_: user, customer, household, account

**Category**:
A staple the Shopper wants to watch, such as milk or eggs. Every Category has exactly one Unit Family. Brand and quality are not part of a Category.
_Avoid_: product, item, product group, SKU, taxon

**Shop**:
A UK supermarket chain, the built-in Corner Shop, or a custom chain the Shopper added. Branch and location are not recorded.
_Avoid_: store, retailer, supermarket, location

**Visit**:
One shopping trip: a local calendar date, one Shop, and zero or more Observations. A Visit is a Draft until the Shopper completes it.
_Avoid_: trip, cart, receipt, transaction, basket

**Draft**:
A Visit that has not been completed. It is saved automatically and can be resumed or discarded.
_Avoid_: temporary scan, unsaved form, session

**Observation**:
One recorded price of one Category during one Visit: pack price, quantity, unit, optional Promotion price, optional Comment. It does not record whether the Shopper bought it.
_Avoid_: line item, purchase, price update, product, entry

**Unit Family**:
The measurement kind of a Category: mass, volume, or count. Families do not convert into each other.
_Avoid_: unit type, dimension, measure

**Canonical Unit**:
The unit used for comparison inside a Unit Family: kilogram for mass, litre for volume, item for count.
_Avoid_: base unit, display unit (unless talking about on-screen labels)

**Unit Price**:
The price the Shopper would pay, divided by quantity expressed in the Category's Canonical Unit. The price used is the Promotion price when one was recorded, otherwise the pack price. This is the only price used in statistics.
_Avoid_: shelf price, pack price, total, line total

**Promotion**:
An optional lower price for the same pack, recorded when the tag also shows a higher previous price. It replaces a yes/no tick. Promotions stay in the dataset and can be filtered later.
_Avoid_: offer flag, deal, sale, discount

**Comment**:
Optional free text on an Observation. It may mention brand or quality. It never changes grouping or statistics.
_Avoid_: note, tag, attribute, brand field

**Monthly Median**:
The median Unit Price of the Observations that fall in one calendar month after filters are applied.
_Avoid_: average (unless explicitly the arithmetic mean), index, CPI

**Trend**:
A claimed percentage change between the first and last valid Monthly Median in a filtered series. A Trend is shown only when the evidence gate is met.
_Avoid_: inflation rate, forecast, index, official inflation

**Backup**:
A complete JSON snapshot that can replace the book on restore.
_Avoid_: export (that word means the CSV report), sync, cloud save
