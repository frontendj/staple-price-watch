import { expect, test } from "vitest";
import { saveObservation } from "./save-observation";
import {
  createStaplePriceWatch,
  type BookResult,
  type StaplePriceWatch,
} from "./staple-price-watch";

function accept<T>(result: BookResult<T>): { book: StaplePriceWatch; value: T } {
  if (!result.ok) {
    throw new Error(result.error.code);
  }
  return result;
}

test("saving a new name creates the Category and one Observation", () => {
  const book = createStaplePriceWatch({ today: () => "2026-10-31" });
  const tesco = book.shops().find((shop) => shop.name === "Tesco");
  if (!tesco) {
    throw new Error("starter Tesco missing");
  }
  const started = accept(book.startVisit({ date: "2026-10-31", shopId: tesco.id }));

  const saved = accept(
    saveObservation(started.book, {
      name: "Cabbage",
      unitFamily: "mass",
      visitId: started.value.visitId,
      paidPence: 1250,
      quantity: 300,
      unit: "g",
    }),
  );

  const cabbage = saved.book.categories().filter((category) => category.name === "Cabbage");
  expect(saved.value.categoryId).toBe(cabbage[0]?.id);
  expect(cabbage.map((category) => ({ name: category.name, unitFamily: category.unitFamily }))).toEqual([
    { name: "Cabbage", unitFamily: "mass" },
  ]);
  expect(saved.book.observations()).toEqual([
    expect.objectContaining({
      id: saved.value.observationId,
      visitId: started.value.visitId,
      categoryId: cabbage[0]?.id,
      paidPence: 1250,
      enteredQuantity: 300,
      enteredUnit: "g",
      promotionPricePence: undefined,
    }),
  ]);
});

test("the first save on a new Visit creates the Draft and the Observation together", () => {
  const book = createStaplePriceWatch({ today: () => "2026-10-31" });
  const milk = book.categories().find((category) => category.name === "Milk");
  const tesco = book.shops().find((shop) => shop.name === "Tesco");
  if (!milk || !tesco) {
    throw new Error("starter Milk or Tesco missing");
  }
  expect(book.visits()).toEqual([]);

  const saved = accept(
    saveObservation(book, {
      name: "Milk",
      unitFamily: "volume",
      date: "2026-10-31",
      shopId: tesco.id,
      paidPence: 115,
      quantity: 568,
      unit: "ml",
    }),
  );

  expect(saved.book.visits()).toEqual([
    expect.objectContaining({
      id: saved.value.visitId,
      date: "2026-10-31",
      shopId: tesco.id,
      status: "draft",
    }),
  ]);
  expect(saved.book.observations()).toEqual([
    expect.objectContaining({
      id: saved.value.observationId,
      visitId: saved.value.visitId,
      categoryId: milk.id,
      paidPence: 115,
      enteredQuantity: 568,
      enteredUnit: "ml",
    }),
  ]);
  expect(saved.book.categories().filter((category) => category.name === "Milk")).toHaveLength(1);
  expect(saved.value.categoryId).toBe(milk.id);
});

test("a second save of the same Shop, date, Category, pack size, pack price, and Promotion price is refused and leaves the book unchanged", () => {
  const book = createStaplePriceWatch({ today: () => "2026-10-31" });
  const tesco = book.shops().find((shop) => shop.name === "Tesco");
  if (!tesco) {
    throw new Error("starter Tesco missing");
  }
  const input = {
    name: "Cabbage",
    unitFamily: "mass" as const,
    date: "2026-10-31",
    shopId: tesco.id,
    paidPence: 1250,
    promotionPricePence: 1100,
    quantity: 300,
    unit: "g",
  };
  const saved = accept(saveObservation(book, input));
  const before = {
    categories: saved.book.categories(),
    visits: saved.book.visits(),
    observations: saved.book.observations(),
  };

  const again = saveObservation(saved.book, input);

  expect(again.ok).toBe(false);
  if (!again.ok) {
    expect(again.error.code).toBe("duplicate-observation");
    expect(again.error.observationId).toBe(saved.value.observationId);
  }
  expect(again.book.categories()).toEqual(before.categories);
  expect(again.book.visits()).toEqual(before.visits);
  expect(again.book.observations()).toEqual(before.observations);
});

test("an edit that changes only the Comment is kept", () => {
  const book = createStaplePriceWatch({ today: () => "2026-10-31" });
  const tesco = book.shops().find((shop) => shop.name === "Tesco");
  if (!tesco) {
    throw new Error("starter Tesco missing");
  }
  const saved = accept(
    saveObservation(book, {
      name: "Milk",
      unitFamily: "volume",
      date: "2026-10-31",
      shopId: tesco.id,
      paidPence: 115,
      promotionPricePence: 99,
      quantity: 568,
      unit: "ml",
      comment: "semi-skimmed",
    }),
  );

  const edited = accept(
    saveObservation(saved.book, {
      name: "Milk",
      unitFamily: "volume",
      visitId: saved.value.visitId,
      observationId: saved.value.observationId,
      paidPence: 115,
      promotionPricePence: 99,
      quantity: 568,
      unit: "ml",
      comment: "whole",
    }),
  );

  expect(edited.book.observations()).toHaveLength(1);
  expect(edited.value.observationId).toBe(saved.value.observationId);
  expect(edited.value.visitId).toBe(saved.value.visitId);
  expect(edited.value.categoryId).toBe(saved.book.categories().find((category) => category.name === "Milk")?.id);
  expect(edited.book.observations()[0]).toEqual(
    expect.objectContaining({
      id: saved.value.observationId,
      paidPence: 115,
      promotionPricePence: 99,
      enteredQuantity: 568,
      enteredUnit: "ml",
      comment: "whole",
    }),
  );
});

test("an edit that would make two Observations identical is refused", () => {
  const book = createStaplePriceWatch({ today: () => "2026-10-31" });
  const tesco = book.shops().find((shop) => shop.name === "Tesco");
  if (!tesco) {
    throw new Error("starter Tesco missing");
  }
  const first = accept(
    saveObservation(book, {
      name: "Milk",
      unitFamily: "volume",
      date: "2026-10-31",
      shopId: tesco.id,
      paidPence: 115,
      promotionPricePence: 99,
      quantity: 1,
      unit: "L",
    }),
  );
  const second = accept(
    saveObservation(first.book, {
      name: "Milk",
      unitFamily: "volume",
      visitId: first.value.visitId,
      paidPence: 130,
      promotionPricePence: 110,
      quantity: 1,
      unit: "L",
    }),
  );
  const before = {
    categories: second.book.categories(),
    visits: second.book.visits(),
    observations: second.book.observations(),
  };

  const collided = saveObservation(second.book, {
    name: "Milk",
    unitFamily: "volume",
    observationId: second.value.observationId,
    paidPence: 115,
    promotionPricePence: 99,
    quantity: 1,
    unit: "L",
  });

  expect(collided.ok).toBe(false);
  if (!collided.ok) {
    expect(collided.error.code).toBe("duplicate-observation");
    expect(collided.error.observationId).toBe(first.value.observationId);
  }
  expect(collided.book.categories()).toEqual(before.categories);
  expect(collided.book.visits()).toEqual(before.visits);
  expect(collided.book.observations()).toEqual(before.observations);
});

test("an edit to a new name creates the Category and keeps the same Observation", () => {
  const book = createStaplePriceWatch({ today: () => "2026-10-31" });
  const tesco = book.shops().find((shop) => shop.name === "Tesco");
  if (!tesco) {
    throw new Error("starter Tesco missing");
  }
  const saved = accept(
    saveObservation(book, {
      name: "Milk",
      unitFamily: "volume",
      date: "2026-10-31",
      shopId: tesco.id,
      paidPence: 115,
      quantity: 1,
      unit: "L",
    }),
  );

  const edited = accept(
    saveObservation(saved.book, {
      name: "Cabbage",
      unitFamily: "mass",
      observationId: saved.value.observationId,
      paidPence: 1250,
      quantity: 300,
      unit: "g",
    }),
  );

  const cabbage = edited.book.categories().find((category) => category.name === "Cabbage");
  expect(edited.value.observationId).toBe(saved.value.observationId);
  expect(edited.value.visitId).toBe(saved.value.visitId);
  expect(edited.value.categoryId).toBe(cabbage?.id);
  expect(edited.book.observations()).toEqual([
    expect.objectContaining({
      id: saved.value.observationId,
      visitId: saved.value.visitId,
      categoryId: cabbage?.id,
      paidPence: 1250,
      enteredQuantity: 300,
      enteredUnit: "g",
    }),
  ]);
  expect(cabbage?.unitFamily).toBe("mass");
});
