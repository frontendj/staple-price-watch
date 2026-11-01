import { expect, test } from "vitest";
import { readShelfTag } from "./read-shelf-tag";
import { createStaplePriceWatch } from "./staple-price-watch";

test("Cabbage 300g 12.5 £ with no Cabbage Category yields the name Cabbage, quantity 300, unit g, and 1250 pence, and does not save", () => {
  const book = createStaplePriceWatch({ today: () => "2026-10-31" });
  const fields = readShelfTag(
    "Cabbage 300g 12.5 £",
    book.categoryChoices().map((category) => category.name),
  );

  expect(fields.name).toBe("Cabbage");
  expect(fields.quantity).toBe(300);
  expect(fields.unit).toBe("g");
  expect(fields.paidPence).toBe(1250);
  expect(book.observations()).toEqual([]);
  expect(book.categories().some((category) => category.name === "Cabbage")).toBe(false);
});

test("text that contains Milk selects the Category Milk", () => {
  const fields = readShelfTag("Organic Milk 2L £1.45", ["Eggs", "Milk"]);

  expect(fields.name).toBe("Milk");
});

test("Cherry tomatoes wins over Tomatoes", () => {
  const fields = readShelfTag("Cherry tomatoes 250g £2.00", ["Tomatoes", "Cherry tomatoes"]);

  expect(fields.name).toBe("Cherry tomatoes");
});

test("Buttermilk does not select Milk", () => {
  const fields = readShelfTag("Buttermilk 1L £1.20", ["Milk"]);

  expect(fields.name).toBe("Buttermilk");
});

test("£ 12 . 5 is 1250 pence", () => {
  const fields = readShelfTag("£ 12 . 5", ["Milk"]);

  expect(fields.paidPence).toBe(1250);
});

test("£1.89/kg is 189 pence for 1 kg", () => {
  const fields = readShelfTag("£1.89/kg", ["Cherry tomatoes"]);

  expect(fields.paidPence).toBe(189);
  expect(fields.quantity).toBe(1);
  expect(fields.unit).toBe("kg");
});

test("568ml £1.15 £2.02/L is pack price 115 pence for 568 ml and no Promotion", () => {
  const fields = readShelfTag("568ml £1.15 £2.02/L", ["Milk"]);

  expect(fields.paidPence).toBe(115);
  expect(fields.quantity).toBe(568);
  expect(fields.unit).toBe("ml");
  expect(fields.promotionPricePence).toBeUndefined();
});

test("2 for £3 together with £1.80 each yields no prices", () => {
  const fields = readShelfTag("2 for £3 £1.80 each", ["Eggs"]);

  expect(fields.paidPence).toBeUndefined();
  expect(fields.promotionPricePence).toBeUndefined();
});

test("a missed read leaves the confirm fields blank", () => {
  const fields = readShelfTag("", ["Milk", "Eggs", "Cherry tomatoes"]);

  expect(fields.name).toBeUndefined();
  expect(fields.paidPence).toBeUndefined();
  expect(fields.promotionPricePence).toBeUndefined();
  expect(fields.quantity).toBeUndefined();
  expect(fields.unit).toBeUndefined();
});
