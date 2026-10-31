import Dexie, { type Table } from "dexie";
import {
  createStaplePriceWatch,
  type Backup,
  type Clock,
  type StaplePriceWatch,
} from "./staple-price-watch";

class BookDatabase extends Dexie {
  snapshots!: Table<{ id: string; backup: Backup }, string>;

  constructor() {
    super("staple-price-watch");
    this.version(1).stores({ snapshots: "id" });
  }
}

const db = new BookDatabase();

export async function loadBook(clock: Clock): Promise<StaplePriceWatch> {
  const empty = createStaplePriceWatch(clock);
  const row =
    (await db.snapshots.get("book")) ?? (await readPreviousDatabase());
  if (!row) {
    return empty;
  }
  const restored = empty.restoreBackup(row.backup);
  if (!restored.ok) {
    return empty;
  }
  if (!(await db.snapshots.get("book"))) {
    await saveBook(restored.book);
  }
  return restored.book;
}

async function readPreviousDatabase(): Promise<
  { id: string; backup: Backup } | undefined
> {
  const listed = await indexedDB.databases?.();
  if (
    listed &&
    !listed.some((database) => database.name === "staple-price-watch")
  ) {
    return undefined;
  }
  const previous = new Dexie("staple-price-watch");
  previous.version(1).stores({ snapshots: "id" });
  const row = await previous
    .table<{ id: string; backup: Backup }, string>("snapshots")
    .get("book");
  previous.close();
  return row;
}

export async function saveBook(book: StaplePriceWatch): Promise<void> {
  await db.snapshots.put({ id: "book", backup: book.exportBackup() });
}
