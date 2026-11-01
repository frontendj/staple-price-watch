import Dexie, { type Table } from "dexie";
import { showDate, showMoney } from "./format";
import {
  createStaplePriceWatch,
  type Backup,
  type BookErrorCode,
  type BookResult,
  type Clock,
  type StaplePriceWatch,
} from "./staple-price-watch";

const refusalSentences: Record<BookErrorCode, string> = {
  "unknown-shop": "Choose a shop.",
  "unknown-visit": "That visit is no longer in the book.",
  "unknown-category": "Choose a category.",
  "unknown-observation": "That observation is no longer in the book.",
  "wrong-unit-family": "That unit does not match this category.",
  "invalid-price": "Enter a price of at least £0.01.",
  "invalid-quantity": "Enter a quantity greater than zero.",
  "invalid-name": "Enter a name.",
  "duplicate-shop": "That shop is already in the list.",
  "archived-category": "That category is archived.",
  "archived-shop": "That shop is archived.",
  "incomplete-visit": "Add a date, a shop, and at least one item before completing.",
  "duplicate-observation": "That price is already recorded.",
  "promotion-not-lower": "The promotion price has to be lower than the pack price.",
  "not-draft": "Only a draft can be discarded.",
  "not-complete": "Only a completed visit can be deleted this way.",
  "empty-visit": "Deleting this item would leave the visit empty.",
  "category-in-use": "Move or delete its observations before archiving this category.",
  "incompatible-merge": "Merge only two active categories that share a unit.",
  "invalid-backup": "That file is not a Staple Price Watch backup.",
  "nothing-to-undo": "There is no restore to undo.",
};

class BookDatabase extends Dexie {
  snapshots!: Table<{ id: string; backup: Backup }, string>;

  constructor() {
    super("staple-price-watch");
    this.version(1).stores({ snapshots: "id" });
  }
}

let stored: BookDatabase | undefined;

function database(): BookDatabase {
  stored ??= new BookDatabase();
  return stored;
}

export function openLoadedBook(
  snapshot: unknown,
  clock: Clock,
): { book: StaplePriceWatch; saved: Backup | null } {
  const book = createStaplePriceWatch(clock);
  const restored = book.restoreBackup(snapshot);
  if (!restored.ok) {
    return { book, saved: null };
  }
  return { book: restored.book, saved: restored.book.exportBackup() };
}

export function commitLoadedBook<T>(result: BookResult<T>): {
  book: StaplePriceWatch;
  saved: Backup | null;
  sentence: string;
} {
  if (!result.ok) {
    return { book: result.book, saved: null, sentence: refusalSentence(result) };
  }
  return { book: result.book, saved: result.book.exportBackup(), sentence: "" };
}

function refusalSentence(result: Extract<BookResult<unknown>, { ok: false }>): string {
  if (result.error.code !== "duplicate-observation") {
    return refusalSentences[result.error.code];
  }
  const existing = result.error.observationId
    ? result.book.observations().find((observation) => observation.id === result.error.observationId)
    : undefined;
  const visit = existing ? result.book.visit(existing.visitId) : undefined;
  if (!existing || !visit) {
    return refusalSentences["duplicate-observation"];
  }
  const shop = result.book.shops().find((item) => item.id === visit.shopId)?.name ?? "Shop";
  return `That price is already recorded. ${shop} ${showDate(visit.date)}, ${showMoney(existing.paidPence)} for ${existing.enteredQuantity} ${existing.enteredUnit}.`;
}

export async function loadBook(clock: Clock): Promise<StaplePriceWatch> {
  const db = database();
  const row = (await db.snapshots.get("book")) ?? (await readPreviousDatabase());
  if (!row) {
    return openLoadedBook(undefined, clock).book;
  }
  const opened = openLoadedBook(row.backup, clock);
  if (!opened.saved) {
    return opened.book;
  }
  if (!(await db.snapshots.get("book"))) {
    await db.snapshots.put({ id: "book", backup: opened.saved });
  }
  return opened.book;
}

async function readPreviousDatabase(): Promise<{ id: string; backup: Backup } | undefined> {
  const listed = await indexedDB.databases?.();
  if (listed && !listed.some((listedDatabase) => listedDatabase.name === "staple-price-watch")) {
    return undefined;
  }
  const previous = new Dexie("staple-price-watch");
  previous.version(1).stores({ snapshots: "id" });
  const row = await previous.table<{ id: string; backup: Backup }, string>("snapshots").get("book");
  previous.close();
  return row;
}

export async function saveBook(book: StaplePriceWatch): Promise<void> {
  await database().snapshots.put({ id: "book", backup: book.exportBackup() });
}
