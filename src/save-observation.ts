import type { BookResult, StaplePriceWatch, UnitFamily } from "./staple-price-watch";

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
): BookResult<{ visitId: string; observationId: string }> {
  const name = input.name.trim();
  const currentCategoryId = input.observationId
    ? book.observations().find((item) => item.id === input.observationId)?.categoryId
    : undefined;
  const matched = book.categories().find(
    (category) =>
      category.name.toLowerCase() === name.toLowerCase() &&
      (!category.archivedAt || category.id === currentCategoryId),
  );
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
    const visitId = updated.book
      .observations()
      .find((item) => item.id === updated.value.observationId)?.visitId;
    if (!visitId) {
      return { ok: false, book, error: { code: "unknown-observation" } };
    }
    return {
      ok: true,
      book: updated.book,
      value: { visitId, observationId: updated.value.observationId },
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
  return saved;
}
