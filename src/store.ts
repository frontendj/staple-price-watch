import Dexie, { type Table } from "dexie";
import {
  createStaplePriceBook,
  type Backup,
  type Clock,
  type StaplePriceBook,
} from "./staple-price-book";

class BookDatabase extends Dexie {
  snapshots!: Table<{ id: string; backup: Backup }, string>;

  constructor() {
    super("staple-price-book");
    this.version(1).stores({ snapshots: "id" });
  }
}

const db = new BookDatabase();

export async function loadBook(clock: Clock): Promise<StaplePriceBook> {
  const empty = createStaplePriceBook(clock);
  const row = await db.snapshots.get("book");
  if (!row) {
    return empty;
  }
  const restored = empty.restoreBackup(row.backup);
  return restored.ok ? restored.book : empty;
}

export async function saveBook(book: StaplePriceBook): Promise<void> {
  await db.snapshots.put({ id: "book", backup: book.exportBackup() });
}
