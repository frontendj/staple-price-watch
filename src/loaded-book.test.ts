import { expect, test } from "vitest";
import { commitLoadedBook, openLoadedBook } from "./loaded-book";
import { createStaplePriceWatch, type BookResult, type StaplePriceWatch } from "./staple-price-watch";

const clock = { today: () => "2026-10-31" };

function accept<T>(result: BookResult<T>): { book: StaplePriceWatch; value: T } {
  if (!result.ok) {
    throw new Error(result.error.code);
  }
  return result;
}

test("a bad Backup does not replace the book", () => {
  const opened = openLoadedBook(
    {
      schemaVersion: 2,
      exportedAt: "2026-10-31T00:00:00.000000Z",
      shops: [],
      categories: [],
      visits: [],
      observations: [
        {
          id: "obs-1",
          visitId: "visit-1",
          categoryId: "cat-1",
          paidPence: 115,
          enteredQuantity: 568,
          enteredUnit: "ml",
          canonicalQuantity: 0.568,
          unitPricePence: 202,
          createdAt: "2026-10-31T00:00:00.000000Z",
          updatedAt: "2026-10-31T00:00:00.000000Z",
        },
      ],
      settings: {
        recentCategoryIds: [],
        lastEntryByCategoryId: {},
        persistencePrompted: false,
        revision: 0,
      },
    },
    clock,
  );

  expect(opened.saved).toBeNull();
  expect(opened.book.observations()).toEqual([]);
  expect(opened.book.categories().map((category) => category.name)).toEqual([
    "Eggs",
    "Milk",
    "Chicken wings",
    "Baking potatoes",
    "Cherry tomatoes",
  ]);
  expect(opened.book.shops().map((shop) => shop.name)).toEqual([
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
});

test("an empty store opens the seeded book", () => {
  const opened = openLoadedBook(undefined, clock);

  expect(opened.saved).toBeNull();
  expect(opened.book.observations()).toEqual([]);
  expect(opened.book.visits()).toEqual([]);
  expect(opened.book.categories().map((category) => category.name)).toEqual([
    "Eggs",
    "Milk",
    "Chicken wings",
    "Baking potatoes",
    "Cherry tomatoes",
  ]);
  expect(opened.book.shops().map((shop) => shop.name)).toEqual([
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
});

test("a previous-version Backup with the tick set restores a Promotion equal to the pack price", () => {
  const opened = openLoadedBook(
    {
      schemaVersion: 1,
      exportedAt: "2026-10-31T00:00:00.000000Z",
      shops: [{ id: "shop-tesco", name: "Tesco", builtIn: true }],
      categories: [{ id: "cat-milk", name: "Milk", unitFamily: "volume" }],
      visits: [
        {
          id: "visit-1",
          date: "2026-10-31",
          shopId: "shop-tesco",
          status: "complete",
          createdAt: "2026-10-31T00:00:00.000000Z",
          updatedAt: "2026-10-31T00:00:00.000000Z",
        },
      ],
      observations: [
        {
          id: "obs-milk",
          visitId: "visit-1",
          categoryId: "cat-milk",
          paidPence: 115,
          enteredQuantity: 568,
          enteredUnit: "ml",
          canonicalQuantity: 0.568,
          unitPricePence: 202,
          promotion: true,
          createdAt: "2026-10-31T00:00:00.000000Z",
          updatedAt: "2026-10-31T00:00:00.000000Z",
        },
        {
          id: "obs-plain",
          visitId: "visit-1",
          categoryId: "cat-milk",
          paidPence: 130,
          enteredQuantity: 1,
          enteredUnit: "L",
          canonicalQuantity: 1,
          unitPricePence: 130,
          promotion: false,
          createdAt: "2026-10-31T00:00:00.000000Z",
          updatedAt: "2026-10-31T00:00:00.000000Z",
        },
      ],
      settings: {
        recentCategoryIds: [],
        lastEntryByCategoryId: {},
        persistencePrompted: false,
        revision: 0,
      },
    },
    clock,
  );

  const ticked = opened.book.observations().find((observation) => observation.id === "obs-milk");
  const plain = opened.book.observations().find((observation) => observation.id === "obs-plain");
  expect(ticked?.paidPence).toBe(115);
  expect(ticked?.promotionPricePence).toBe(115);
  expect(plain?.paidPence).toBe(130);
  expect(plain?.promotionPricePence).toBeUndefined();

  expect(opened.saved?.schemaVersion).toBe(2);
  expect(opened.saved?.observations.find((observation) => observation.id === "obs-milk")?.promotionPricePence).toBe(
    115,
  );
  expect(opened.saved?.observations.find((observation) => observation.id === "obs-plain")?.promotionPricePence).toBe(
    undefined,
  );
});

test("a refused duplicate names the existing Observation's Shop, date, pack price, quantity, and unit", () => {
  let book = createStaplePriceWatch(clock);
  const milk = book.categories().find((category) => category.name === "Milk");
  const tesco = book.shops().find((shop) => shop.name === "Tesco");
  if (!milk || !tesco) {
    throw new Error("starter Milk or Tesco missing");
  }
  book = accept(
    book.confirmTag({
      date: "2026-10-31",
      shopId: tesco.id,
      categoryId: milk.id,
      paidPence: 115,
      quantity: 568,
      unit: "ml",
    }),
  ).book;
  const duplicate = book.confirmTag({
    date: "2026-10-31",
    shopId: tesco.id,
    categoryId: milk.id,
    paidPence: 115,
    quantity: 568,
    unit: "ml",
  });
  if (duplicate.ok) {
    throw new Error("duplicate was recorded");
  }

  const refused = commitLoadedBook(duplicate);

  expect(refused.sentence).toBe("That price is already recorded. Tesco 31/10/2026, £1.15 for 568 ml.");
  expect(refused.saved).toBeNull();
  expect(refused.book.observations()).toHaveLength(1);
  expect(refused.book.observations()[0]?.paidPence).toBe(115);
});

test("a successful command saves that book", () => {
  let book = createStaplePriceWatch(clock);
  const milk = book.categories().find((category) => category.name === "Milk");
  const tesco = book.shops().find((shop) => shop.name === "Tesco");
  if (!milk || !tesco) {
    throw new Error("starter Milk or Tesco missing");
  }
  const recorded = book.confirmTag({
    date: "2026-10-31",
    shopId: tesco.id,
    categoryId: milk.id,
    paidPence: 115,
    quantity: 568,
    unit: "ml",
  });
  if (!recorded.ok) {
    throw new Error(recorded.error.code);
  }

  const committed = commitLoadedBook(recorded);

  expect(committed.sentence).toBe("");
  expect(committed.book.observations()).toHaveLength(1);
  expect(committed.saved?.schemaVersion).toBe(2);
  expect(committed.saved?.observations).toHaveLength(1);
  expect(committed.saved?.observations[0]?.paidPence).toBe(115);
  expect(committed.saved?.observations[0]?.enteredQuantity).toBe(568);
  expect(committed.saved?.observations[0]?.enteredUnit).toBe("ml");
  expect(committed.saved?.observations[0]?.promotionPricePence).toBeUndefined();
  const savedShop = committed.saved?.shops.find((shop) => shop.id === tesco.id);
  expect(savedShop?.name).toBe("Tesco");
});

test("a refused save names the rule and does not save the book", () => {
  const book = createStaplePriceWatch(clock);
  const refused = book.restoreBackup("{");
  if (refused.ok) {
    throw new Error("bad backup was accepted");
  }

  const settled = commitLoadedBook(refused);

  expect(settled.sentence).toBe("That file is not a Staple Price Watch backup.");
  expect(settled.saved).toBeNull();
  expect(settled.book.observations()).toEqual([]);
  expect(settled.book.categories().map((category) => category.name)).toEqual([
    "Eggs",
    "Milk",
    "Chicken wings",
    "Baking potatoes",
    "Cherry tomatoes",
  ]);
});
