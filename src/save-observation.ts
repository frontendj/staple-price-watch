import type { BookResult, Category, StaplePriceWatch, UnitFamily } from "./staple-price-watch";

export function categoryNamed(
  categories: readonly Category[],
  name: string,
  currentCategoryId?: string,
): Category | undefined {
  const trimmed = name.trim().toLowerCase();
  return categories.find(
    (category) =>
      category.name.toLowerCase() === trimmed &&
      (!category.archivedAt || category.id === currentCategoryId),
  );
}

export function saveObservation(
  book: StaplePriceWatch,
  input: {
    name: string;
    unitFamily: UnitFamily;
    visitId?: string;
    date?: string;
    shopId?: string;
    observationId?: string;
    paidPence: number;
    quantity: number;
    unit: string;
    promotionPricePence?: number | null;
    comment?: string;
  },
): BookResult<{ visitId: string; observationId: string; categoryId: string }> {
  const name = input.name.trim();
  const editing = input.observationId
    ? book.observations().find((item) => item.id === input.observationId)
    : undefined;
  const matched = categoryNamed(book.categories(), name, editing?.categoryId);
  let next = book;
  let categoryId = matched?.id;
  if (!categoryId) {
    const created = next.addCategory({ name, unitFamily: input.unitFamily });
    if (!created.ok) {
      return { ok: false, book, error: created.error };
    }
    next = created.book;
    categoryId = created.value.categoryId;
  }
  if (input.observationId) {
    const updated = next.updateObservation({
      observationId: input.observationId,
      categoryId,
      paidPence: input.paidPence,
      quantity: input.quantity,
      unit: input.unit,
      promotionPricePence: input.promotionPricePence,
      comment: input.comment,
    });
    if (!updated.ok) {
      return { ok: false, book, error: updated.error };
    }
    if (!editing) {
      throw new Error("Observation missing after update");
    }
    return {
      ok: true,
      book: updated.book,
      value: {
        visitId: editing.visitId,
        observationId: updated.value.observationId,
        categoryId,
      },
    };
  }
  const saved = next.confirmTag({
    visitId: input.visitId,
    date: input.date,
    shopId: input.shopId,
    categoryId,
    paidPence: input.paidPence,
    quantity: input.quantity,
    unit: input.unit,
    promotionPricePence: input.promotionPricePence,
    comment: input.comment,
  });
  if (!saved.ok) {
    return { ok: false, book, error: saved.error };
  }
  return {
    ok: true,
    book: saved.book,
    value: {
      visitId: saved.value.visitId,
      observationId: saved.value.observationId,
      categoryId,
    },
  };
}
