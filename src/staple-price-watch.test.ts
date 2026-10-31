import { expect, test } from "vitest";
import {
  createStaplePriceWatch,
  quoteUnitPrice,
  type BookResult,
  type StaplePriceWatch,
} from "./staple-price-watch";

function accept<T>(result: BookResult<T>): { book: StaplePriceWatch; value: T } {
  if (!result.ok) {
    throw new Error(result.error.code);
  }
  return result;
}

test("an empty book seeds the starter Categories and Shops", () => {
  const book = createStaplePriceWatch({ today: () => "2026-10-31" });

  expect(
    book.categories().map((category) => ({
      name: category.name,
      unitFamily: category.unitFamily,
    })),
  ).toEqual([
    { name: "Eggs", unitFamily: "count" },
    { name: "Milk", unitFamily: "volume" },
    { name: "Chicken wings", unitFamily: "mass" },
    { name: "Baking potatoes", unitFamily: "mass" },
    { name: "Cherry tomatoes", unitFamily: "mass" },
  ]);

  expect(book.shops().map((shop) => shop.name)).toEqual([
    "Tesco",
    "Sainsbury's",
    "Asda",
    "Morrisons",
    "Aldi",
    "Lidl",
    "Waitrose",
    "M&S",
    "Co-op",
    "Iceland",
    "Ocado",
    "Corner Shop",
  ]);
  expect(book.shops().every((shop) => shop.builtIn && shop.archivedAt === undefined)).toBe(
    true,
  );
});

test("completing a Visit with Eggs 12 items at £2.40 stores a Unit Price of 20 pence per item", () => {
  let book = createStaplePriceWatch({ today: () => "2026-10-31" });
  const eggs = book.categories().find((category) => category.name === "Eggs");
  const tesco = book.shops().find((shop) => shop.name === "Tesco");
  if (!eggs || !tesco) {
    throw new Error("starter Eggs or Tesco missing");
  }

  const started = book.startVisit({ date: "2026-10-31", shopId: tesco.id });
  expect(started.ok).toBe(true);
  if (!started.ok) {
    return;
  }
  book = started.book;

  const added = book.addObservation({
    visitId: started.value.visitId,
    categoryId: eggs.id,
    paidPence: 240,
    quantity: 12,
    unit: "item",
  });
  expect(added.ok).toBe(true);
  if (!added.ok) {
    return;
  }
  book = added.book;

  const completed = book.completeVisit(started.value.visitId);
  expect(completed.ok).toBe(true);
  if (!completed.ok) {
    return;
  }
  book = completed.book;

  expect(book.observations()).toEqual([
    expect.objectContaining({
      id: added.value.observationId,
      visitId: started.value.visitId,
      categoryId: eggs.id,
      paidPence: 240,
      enteredQuantity: 12,
      enteredUnit: "item",
      canonicalQuantity: 12,
      unitPricePence: 20,
      promotion: false,
    }),
  ]);
  expect(book.visit(started.value.visitId)?.status).toBe("complete");
});

test("Milk 568 ml at £1.15 stores 0.568 L and keeps full Unit Price precision until display", () => {
  let book = createStaplePriceWatch({ today: () => "2026-10-31" });
  const milk = book.categories().find((category) => category.name === "Milk");
  const tesco = book.shops().find((shop) => shop.name === "Tesco");
  if (!milk || !tesco) {
    throw new Error("starter Milk or Tesco missing");
  }

  const started = book.startVisit({ date: "2026-10-31", shopId: tesco.id });
  if (!started.ok) {
    throw new Error("visit did not start");
  }
  const added = started.book.addObservation({
    visitId: started.value.visitId,
    categoryId: milk.id,
    paidPence: 115,
    quantity: 568,
    unit: "ml",
  });
  expect(added.ok).toBe(true);
  if (!added.ok) {
    return;
  }
  book = added.book;

  const observation = book.observations()[0];
  expect(observation?.canonicalQuantity).toBe(0.568);
  expect(observation?.unitPricePence).toBe(202.4647887323944);
  expect(book.displayUnitPrice(observation.id)).toBe("£2.02/L");
});

test("350 g at 210 pence stores a Unit Price of 600 pence per kg", () => {
  let book = createStaplePriceWatch({ today: () => "2026-10-31" });
  const chicken = book.categories().find((category) => category.name === "Chicken wings");
  const tesco = book.shops().find((shop) => shop.name === "Tesco");
  if (!chicken || !tesco) {
    throw new Error("starter Chicken wings or Tesco missing");
  }

  const started = book.startVisit({ date: "2026-10-31", shopId: tesco.id });
  if (!started.ok) {
    throw new Error("visit did not start");
  }
  const added = started.book.addObservation({
    visitId: started.value.visitId,
    categoryId: chicken.id,
    paidPence: 210,
    quantity: 350,
    unit: "g",
  });
  expect(added.ok).toBe(true);
  if (!added.ok) {
    return;
  }
  book = added.book;

  const observation = book.observations()[0];
  expect(observation?.canonicalQuantity).toBe(0.35);
  expect(observation?.unitPricePence).toBe(600);
  expect(book.displayUnitPrice(observation.id)).toBe("£6.00/kg");
});

test("Milk cannot be saved in items, and zero price or quantity is rejected", () => {
  const book = createStaplePriceWatch({ today: () => "2026-10-31" });
  const milk = book.categories().find((category) => category.name === "Milk");
  const tesco = book.shops().find((shop) => shop.name === "Tesco");
  if (!milk || !tesco) {
    throw new Error("starter Milk or Tesco missing");
  }
  const started = accept(book.startVisit({ date: "2026-10-31", shopId: tesco.id }));

  const wrongUnit = started.book.addObservation({
    visitId: started.value.visitId,
    categoryId: milk.id,
    paidPence: 115,
    quantity: 1,
    unit: "item",
  });
  expect(wrongUnit.ok).toBe(false);
  if (!wrongUnit.ok) {
    expect(wrongUnit.error.code).toBe("wrong-unit-family");
  }

  const zeroPrice = started.book.addObservation({
    visitId: started.value.visitId,
    categoryId: milk.id,
    paidPence: 0,
    quantity: 1,
    unit: "L",
  });
  expect(zeroPrice.ok).toBe(false);
  if (!zeroPrice.ok) {
    expect(zeroPrice.error.code).toBe("invalid-price");
  }

  const zeroQuantity = started.book.addObservation({
    visitId: started.value.visitId,
    categoryId: milk.id,
    paidPence: 115,
    quantity: 0,
    unit: "L",
  });
  expect(zeroQuantity.ok).toBe(false);
  if (!zeroQuantity.ok) {
    expect(zeroQuantity.error.code).toBe("invalid-quantity");
  }
  expect(started.book.observations()).toEqual([]);
});

test("the next entry prefills the last quantity and unit, never the price", () => {
  let book = createStaplePriceWatch({ today: () => "2026-10-31" });
  const eggs = book.categories().find((category) => category.name === "Eggs");
  const tesco = book.shops().find((shop) => shop.name === "Tesco");
  if (!eggs || !tesco) {
    throw new Error("starter Eggs or Tesco missing");
  }
  const started = accept(book.startVisit({ date: "2026-10-31", shopId: tesco.id }));
  book = accept(
    started.book.addObservation({
      visitId: started.value.visitId,
      categoryId: eggs.id,
      paidPence: 240,
      quantity: 12,
      unit: "item",
      promotion: true,
      comment: "free range",
    }),
  ).book;

  expect(book.entryDefault(eggs.id)).toEqual({ quantity: 12, unit: "item" });
  expect(book.entryDefault(eggs.id)).not.toHaveProperty("paidPence");
  expect(book.entryDefault(eggs.id)).not.toHaveProperty("promotion");
  expect(book.entryDefault(eggs.id)).not.toHaveProperty("comment");
});

test("a started Visit with an Observation stays a Draft until it is completed", () => {
  let book = createStaplePriceWatch({ today: () => "2026-10-31" });
  const eggs = book.categories().find((category) => category.name === "Eggs");
  const tesco = book.shops().find((shop) => shop.name === "Tesco");
  if (!eggs || !tesco) {
    throw new Error("starter Eggs or Tesco missing");
  }
  const started = accept(book.startVisit({ date: "2026-10-31", shopId: tesco.id }));
  book = accept(
    started.book.addObservation({
      visitId: started.value.visitId,
      categoryId: eggs.id,
      paidPence: 240,
      quantity: 6,
      unit: "item",
    }),
  ).book;

  expect(book.drafts().map((visit) => visit.id)).toEqual([started.value.visitId]);
  expect(book.visit(started.value.visitId)?.status).toBe("draft");
});

test("completing a second Visit for the same date, Shop, and Category warns, then can be acknowledged", () => {
  let book = createStaplePriceWatch({ today: () => "2026-10-31" });
  const eggs = book.categories().find((category) => category.name === "Eggs");
  const tesco = book.shops().find((shop) => shop.name === "Tesco");
  if (!eggs || !tesco) {
    throw new Error("starter Eggs or Tesco missing");
  }

  const first = accept(book.startVisit({ date: "2026-10-31", shopId: tesco.id }));
  book = accept(
    first.book.addObservation({
      visitId: first.value.visitId,
      categoryId: eggs.id,
      paidPence: 200,
      quantity: 10,
      unit: "item",
    }),
  ).book;
  book = accept(book.completeVisit(first.value.visitId)).book;

  const second = accept(book.startVisit({ date: "2026-10-31", shopId: tesco.id }));
  book = accept(
    second.book.addObservation({
      visitId: second.value.visitId,
      categoryId: eggs.id,
      paidPence: 220,
      quantity: 10,
      unit: "item",
    }),
  ).book;

  const warned = book.completeVisit(second.value.visitId);
  expect(warned.ok).toBe(false);
  if (!warned.ok) {
    expect(warned.error.code).toBe("duplicate-warning");
  }
  expect(book.visit(second.value.visitId)?.status).toBe("draft");

  book = accept(book.completeVisit(second.value.visitId, { acknowledgeDuplicate: true })).book;
  expect(book.visit(second.value.visitId)?.status).toBe("complete");
});

test("merging Baking potatoes into a renamed Category keeps its Unit Price in that Category", () => {
  let book = createStaplePriceWatch({ today: () => "2026-10-31" });
  const potatoes = book.categories().find((category) => category.name === "Baking potatoes");
  const tesco = book.shops().find((shop) => shop.name === "Tesco");
  if (!potatoes || !tesco) {
    throw new Error("starter Baking potatoes or Tesco missing");
  }

  const started = accept(book.startVisit({ date: "2026-01-15", shopId: tesco.id }));
  book = accept(
    started.book.addObservation({
      visitId: started.value.visitId,
      categoryId: potatoes.id,
      paidPence: 210,
      quantity: 350,
      unit: "g",
    }),
  ).book;
  book = accept(book.completeVisit(started.value.visitId)).book;

  const added = accept(book.addCategory({ name: "Spuds", unitFamily: "mass" }));
  book = added.book;
  const renamed = accept(book.renameCategory({ categoryId: added.value.categoryId, name: "Potatoes" }));
  book = renamed.book;
  book = accept(
    book.mergeCategories({ sourceId: potatoes.id, targetId: added.value.categoryId }),
  ).book;

  expect(book.categories().find((category) => category.id === potatoes.id)).toMatchObject({
    mergedInto: added.value.categoryId,
  });
  expect(book.categories().find((category) => category.id === potatoes.id)?.archivedAt).toContain(
    "2026-10-31",
  );
  expect(book.categoryChoices().map((category) => category.name)).not.toContain("Baking potatoes");
  expect(book.statistics({ categoryId: added.value.categoryId }).points).toEqual([
    expect.objectContaining({ unitPricePence: 600 }),
  ]);
  expect(book.statistics({ categoryId: potatoes.id }).points).toEqual([]);
});

test("three Observations in one month are not a Trend until another month is added", () => {
  let book = createStaplePriceWatch({ today: () => "2026-02-01" });
  const eggs = book.categories().find((category) => category.name === "Eggs");
  const tesco = book.shops().find((shop) => shop.name === "Tesco");
  if (!eggs || !tesco) {
    throw new Error("starter Eggs or Tesco missing");
  }

  for (const purchase of [
    { date: "2026-01-02", paidPence: 100 },
    { date: "2026-01-10", paidPence: 300 },
    { date: "2026-01-20", paidPence: 200 },
  ]) {
    const started = accept(book.startVisit({ date: purchase.date, shopId: tesco.id }));
    book = accept(
      started.book.addObservation({
        visitId: started.value.visitId,
        categoryId: eggs.id,
        paidPence: purchase.paidPence,
        quantity: 1,
        unit: "item",
      }),
    ).book;
    book = accept(book.completeVisit(started.value.visitId)).book;
  }

  const early = book.statistics({ categoryId: eggs.id });
  expect(early.months).toEqual([{ month: "2026-01", medianPence: 200, count: 3 }]);
  expect(early.trend).toEqual({
    status: "insufficient",
    label: "Not enough evidence for a trend yet",
  });

  const later = accept(book.startVisit({ date: "2026-02-01", shopId: tesco.id }));
  book = accept(
    later.book.addObservation({
      visitId: later.value.visitId,
      categoryId: eggs.id,
      paidPence: 400,
      quantity: 1,
      unit: "item",
    }),
  ).book;
  book = accept(book.completeVisit(later.value.visitId)).book;

  expect(book.statistics({ categoryId: eggs.id }).trend).toEqual({
    status: "trend",
    firstMonth: "2026-01",
    lastMonth: "2026-02",
    firstMedianPence: 200,
    lastMedianPence: 400,
    percentChange: 100,
    observationCount: 4,
  });
});

test("an even number of Unit Prices uses the mean of the two middle values", () => {
  let book = createStaplePriceWatch({ today: () => "2026-01-31" });
  const eggs = book.categories().find((category) => category.name === "Eggs");
  const tesco = book.shops().find((shop) => shop.name === "Tesco");
  if (!eggs || !tesco) {
    throw new Error("starter Eggs or Tesco missing");
  }

  for (const [index, paidPence] of [10, 40, 20, 30].entries()) {
    const started = accept(book.startVisit({ date: `2026-01-${String(index + 1).padStart(2, "0")}`, shopId: tesco.id }));
    book = accept(
      started.book.addObservation({
        visitId: started.value.visitId,
        categoryId: eggs.id,
        paidPence,
        quantity: 1,
        unit: "item",
      }),
    ).book;
    book = accept(book.completeVisit(started.value.visitId)).book;
  }

  expect(book.statistics({ categoryId: eggs.id }).months).toEqual([
    { month: "2026-01", medianPence: 25, count: 4 },
  ]);
});

test("excluding Promotions drops them from the Monthly Median and the sample count", () => {
  let book = createStaplePriceWatch({ today: () => "2026-01-31" });
  const milk = book.categories().find((category) => category.name === "Milk");
  const tesco = book.shops().find((shop) => shop.name === "Tesco");
  if (!milk || !tesco) {
    throw new Error("starter Milk or Tesco missing");
  }

  const full = accept(book.startVisit({ date: "2026-01-05", shopId: tesco.id }));
  book = accept(
    full.book.addObservation({
      visitId: full.value.visitId,
      categoryId: milk.id,
      paidPence: 100,
      quantity: 1,
      unit: "L",
    }),
  ).book;
  book = accept(book.completeVisit(full.value.visitId)).book;

  const offer = accept(book.startVisit({ date: "2026-01-12", shopId: tesco.id }));
  book = accept(
    offer.book.addObservation({
      visitId: offer.value.visitId,
      categoryId: milk.id,
      paidPence: 300,
      quantity: 1,
      unit: "L",
      promotion: true,
    }),
  ).book;
  book = accept(book.completeVisit(offer.value.visitId)).book;

  expect(book.statistics({ categoryId: milk.id }).months).toEqual([
    { month: "2026-01", medianPence: 200, count: 2 },
  ]);
  expect(book.statistics({ categoryId: milk.id, promotion: "exclude" }).months).toEqual([
    { month: "2026-01", medianPence: 100, count: 1 },
  ]);
});

test("Backup replace restores the previous book and invalid JSON is rejected", () => {
  let book = createStaplePriceWatch({ today: () => "2026-10-31" });
  const backup = book.exportBackup();
  const eggs = book.categories().find((category) => category.name === "Eggs");
  const tesco = book.shops().find((shop) => shop.name === "Tesco");
  if (!eggs || !tesco) {
    throw new Error("starter Eggs or Tesco missing");
  }
  const started = accept(book.startVisit({ date: "2026-10-31", shopId: tesco.id }));
  book = accept(
    started.book.addObservation({
      visitId: started.value.visitId,
      categoryId: eggs.id,
      paidPence: 240,
      quantity: 12,
      unit: "item",
    }),
  ).book;
  book = accept(book.completeVisit(started.value.visitId)).book;

  const rejected = book.restoreBackup("{");
  expect(rejected.ok).toBe(false);
  if (!rejected.ok) {
    expect(rejected.error.code).toBe("invalid-backup");
  }
  expect(book.observations()).toHaveLength(1);

  const restored = accept(book.restoreBackup(backup));
  expect(restored.book.observations()).toEqual([]);
  expect(restored.value).toMatchObject({ shops: 12, categories: 5, visits: 0, observations: 0 });
  const afterRestore = accept(restored.book.startVisit({ date: "2026-11-01", shopId: tesco.id }));
  expect(accept(afterRestore.book.undoRestore()).book.observations()).toHaveLength(1);

  const withoutRevision = { ...backup, settings: { ...backup.settings } };
  delete (withoutRevision.settings as { revision?: number }).revision;
  expect(accept(book.restoreBackup(withoutRevision)).book.categories()).toHaveLength(5);
});

test("CSV has one row per completed Observation and skips Drafts", () => {
  let book = createStaplePriceWatch({ today: () => "2026-10-31" });
  const eggs = book.categories().find((category) => category.name === "Eggs");
  const milk = book.categories().find((category) => category.name === "Milk");
  const tesco = book.shops().find((shop) => shop.name === "Tesco");
  if (!eggs || !milk || !tesco) {
    throw new Error("starter categories or Tesco missing");
  }

  const done = accept(book.startVisit({ date: "2026-10-31", shopId: tesco.id }));
  const added = accept(
    done.book.addObservation({
      visitId: done.value.visitId,
      categoryId: eggs.id,
      paidPence: 240,
      quantity: 12,
      unit: "item",
      comment: "large",
    }),
  );
  book = accept(added.book.completeVisit(done.value.visitId)).book;

  const draft = accept(book.startVisit({ date: "2026-10-30", shopId: tesco.id }));
  book = accept(
    draft.book.addObservation({
      visitId: draft.value.visitId,
      categoryId: milk.id,
      paidPence: 115,
      quantity: 1,
      unit: "L",
    }),
  ).book;

  const rows = book.toCsv().trim().split("\n");
  expect(rows).toHaveLength(2);
  expect(rows[1]).toContain("2026-10-31");
  expect(rows[1]).toContain("Tesco");
  expect(rows[1]).toContain("Eggs");
  expect(rows[1]).toContain("2.40");
  expect(rows[1]).toContain("12");
  expect(rows[1]).toContain("item");
  expect(rows[1]).toContain("false");
  expect(rows[1]).toContain("large");
  expect(rows[1]).toContain(done.value.visitId);
  expect(rows[1]).toContain(added.value.observationId);
  expect(book.toCsv()).not.toContain("Milk");
});

test("a price quote shows £6.00/kg for 350 g at 210 pence before it is saved", () => {
  expect(
    quoteUnitPrice({ unitFamily: "mass", paidPence: 210, quantity: 350, unit: "g" }),
  ).toBe("£6.00/kg");
  expect(quoteUnitPrice({ unitFamily: "volume", paidPence: 0, quantity: 1, unit: "L" })).toBe(
    undefined,
  );
});
