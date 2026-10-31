import { z } from "zod";

export type UnitFamily = "mass" | "volume" | "count";

export type EnteredUnit = "g" | "kg" | "ml" | "L" | "item";

export type Category = {
  id: string;
  name: string;
  unitFamily: UnitFamily;
  archivedAt?: string;
  mergedInto?: string;
};

export type Shop = {
  id: string;
  name: string;
  archivedAt?: string;
  builtIn: boolean;
};

export type Visit = {
  id: string;
  date: string;
  shopId: string;
  status: "draft" | "complete";
  createdAt: string;
  updatedAt: string;
};

export type Observation = {
  id: string;
  visitId: string;
  categoryId: string;
  paidPence: number;
  enteredQuantity: number;
  enteredUnit: EnteredUnit;
  canonicalQuantity: number;
  unitPricePence: number;
  promotion: boolean;
  comment?: string;
  createdAt: string;
  updatedAt: string;
};

export type EntryDefault = {
  quantity: number;
  unit: EnteredUnit;
};

export type Settings = {
  recentCategoryIds: string[];
  lastEntryByCategoryId: Record<string, EntryDefault>;
  lastShopId?: string;
  persistencePrompted: boolean;
  revision: number;
};

export type BookErrorCode =
  | "unknown-shop"
  | "unknown-visit"
  | "unknown-category"
  | "unknown-observation"
  | "wrong-unit-family"
  | "invalid-price"
  | "invalid-quantity"
  | "invalid-name"
  | "duplicate-shop"
  | "archived-category"
  | "archived-shop"
  | "incomplete-visit"
  | "duplicate-warning"
  | "not-draft"
  | "not-complete"
  | "empty-visit"
  | "category-in-use"
  | "incompatible-merge"
  | "invalid-backup"
  | "nothing-to-undo";

export type BookSuccess<T> = {
  ok: true;
  book: StaplePriceBook;
  value: T;
};

export type BookFailure = {
  ok: false;
  book: StaplePriceBook;
  error: { code: BookErrorCode };
};

export type BookResult<T> = BookSuccess<T> | BookFailure;

export type Clock = {
  today: () => string;
};

export type MonthMedian = {
  month: string;
  medianPence: number;
  count: number;
};

export type Trend =
  | { status: "insufficient"; label: "Not enough evidence for a trend yet" }
  | {
      status: "trend";
      firstMonth: string;
      lastMonth: string;
      firstMedianPence: number;
      lastMedianPence: number;
      percentChange: number;
      observationCount: number;
    };

export type StatisticsPoint = {
  observationId: string;
  visitId: string;
  date: string;
  shopId: string;
  unitPricePence: number;
  promotion: boolean;
};

export type Statistics = {
  points: StatisticsPoint[];
  months: MonthMedian[];
  trend: Trend;
};

export type BackupCounts = {
  shops: number;
  categories: number;
  visits: number;
  observations: number;
};

export type Backup = {
  schemaVersion: 1;
  exportedAt: string;
  shops: Shop[];
  categories: Category[];
  visits: Visit[];
  observations: Observation[];
  settings: Settings;
};

type BookState = {
  shops: Shop[];
  categories: Category[];
  visits: Visit[];
  observations: Observation[];
  settings: Settings;
};

const SEED_CATEGORIES: ReadonlyArray<{ name: string; unitFamily: UnitFamily }> = [
  { name: "Eggs", unitFamily: "count" },
  { name: "Milk", unitFamily: "volume" },
  { name: "Chicken wings", unitFamily: "mass" },
  { name: "Baking potatoes", unitFamily: "mass" },
  { name: "Cherry tomatoes", unitFamily: "mass" },
];

const SEED_SHOPS = [
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
] as const;

const unitSchema = z.enum(["g", "kg", "ml", "L", "item"]);
const familySchema = z.enum(["mass", "volume", "count"]);

const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  unitFamily: familySchema,
  archivedAt: z.string().optional(),
  mergedInto: z.string().optional(),
});

const shopSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  archivedAt: z.string().optional(),
  builtIn: z.boolean(),
});

const visitSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  shopId: z.string().min(1),
  status: z.enum(["draft", "complete"]),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

const observationSchema = z.object({
  id: z.string().min(1),
  visitId: z.string().min(1),
  categoryId: z.string().min(1),
  paidPence: z.number().int().min(1),
  enteredQuantity: z.number().positive(),
  enteredUnit: unitSchema,
  canonicalQuantity: z.number().positive(),
  unitPricePence: z.number().positive(),
  promotion: z.boolean(),
  comment: z.string().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

const settingsSchema = z.object({
  recentCategoryIds: z.array(z.string()),
  lastEntryByCategoryId: z.record(
    z.string(),
    z.object({ quantity: z.number().positive(), unit: unitSchema }),
  ),
  lastShopId: z.string().optional(),
  persistencePrompted: z.boolean(),
  revision: z.number().int().nonnegative(),
});

const backupSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.string().min(1),
  shops: z.array(shopSchema),
  categories: z.array(categorySchema),
  visits: z.array(visitSchema),
  observations: z.array(observationSchema),
  settings: settingsSchema,
});

function emptySettings(): Settings {
  return {
    recentCategoryIds: [],
    lastEntryByCategoryId: {},
    persistencePrompted: false,
    revision: 0,
  };
}

function stamp(today: string, revision: number): string {
  return `${today}T00:00:00.${String(revision).padStart(6, "0")}Z`;
}

function normaliseUnit(raw: string): string {
  const token = raw.trim().toLowerCase();
  if (token === "l") {
    return "L";
  }
  if (token === "pc" || token === "pcs" || token === "each" || token === "item") {
    return "item";
  }
  return token;
}

function enteredUnitFor(family: UnitFamily, raw: string): EnteredUnit | undefined {
  const unit = normaliseUnit(raw);
  if (family === "count" && unit === "item") {
    return "item";
  }
  if (family === "volume" && (unit === "ml" || unit === "L")) {
    return unit;
  }
  if (family === "mass" && (unit === "g" || unit === "kg")) {
    return unit;
  }
  return undefined;
}

function decimalPlaces(quantity: number): number {
  if (!Number.isFinite(quantity)) {
    return 99;
  }
  const text = quantity.toString();
  if (text.includes("e") || text.includes("E")) {
    return 99;
  }
  const dot = text.indexOf(".");
  return dot === -1 ? 0 : text.length - dot - 1;
}

function validQuantity(quantity: number): boolean {
  return Number.isFinite(quantity) && quantity > 0 && decimalPlaces(quantity) <= 3;
}

function validPrice(paidPence: number): boolean {
  return Number.isInteger(paidPence) && paidPence >= 1;
}

function canonicalOf(quantity: number, unit: EnteredUnit): number {
  if (unit === "g" || unit === "ml") {
    return quantity / 1000;
  }
  return quantity;
}

function roundHalfUp(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  const shifted = value * factor;
  return (Math.sign(shifted) * Math.floor(Math.abs(shifted) + 0.5)) / factor;
}

function formatUnitPrice(unitPricePence: number, family: UnitFamily): string {
  const displayPence = roundHalfUp(unitPricePence, 0);
  const negative = displayPence < 0;
  const absolute = Math.abs(displayPence);
  const pounds = Math.trunc(absolute / 100);
  const pennies = absolute % 100;
  const canonical = family === "mass" ? "kg" : family === "volume" ? "L" : "item";
  return `${negative ? "-" : ""}£${pounds}.${String(pennies).padStart(2, "0")}/${canonical}`;
}

function canonicalUnit(family: UnitFamily): string {
  if (family === "mass") {
    return "kg";
  }
  if (family === "volume") {
    return "L";
  }
  return "item";
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function pounds(pence: number): string {
  return (pence / 100).toFixed(2);
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid] ?? 0;
  }
  return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

function unique(ids: string[]): boolean {
  return new Set(ids).size === ids.length;
}

function backupReferencesHold(backup: Backup): boolean {
  if (!unique(backup.shops.map((shop) => shop.id))) {
    return false;
  }
  if (!unique(backup.categories.map((category) => category.id))) {
    return false;
  }
  if (!unique(backup.visits.map((visit) => visit.id))) {
    return false;
  }
  if (!unique(backup.observations.map((observation) => observation.id))) {
    return false;
  }
  const shops = new Set(backup.shops.map((shop) => shop.id));
  const categories = new Set(backup.categories.map((category) => category.id));
  const visits = new Set(backup.visits.map((visit) => visit.id));
  if (backup.visits.some((visit) => !shops.has(visit.shopId))) {
    return false;
  }
  if (
    backup.observations.some(
      (observation) => !visits.has(observation.visitId) || !categories.has(observation.categoryId),
    )
  ) {
    return false;
  }
  if (backup.settings.lastShopId && !shops.has(backup.settings.lastShopId)) {
    return false;
  }
  if (backup.settings.recentCategoryIds.some((id) => !categories.has(id))) {
    return false;
  }
  if (Object.keys(backup.settings.lastEntryByCategoryId).some((id) => !categories.has(id))) {
    return false;
  }
  return backup.categories.every(
    (category) => !category.mergedInto || categories.has(category.mergedInto),
  );
}

function readBackup(input: unknown): Backup | undefined {
  let value = input;
  if (typeof input === "string") {
    try {
      value = JSON.parse(input) as unknown;
    } catch {
      return undefined;
    }
  }
  const parsed = backupSchema.safeParse(value);
  if (!parsed.success || !backupReferencesHold(parsed.data)) {
    return undefined;
  }
  return parsed.data;
}

function countsOf(backup: Backup): BackupCounts {
  return {
    shops: backup.shops.length,
    categories: backup.categories.length,
    visits: backup.visits.length,
    observations: backup.observations.length,
  };
}

export class StaplePriceBook {
  private constructor(
    private readonly state: BookState,
    private readonly clock: Clock,
    private readonly previousBackup: Backup | null,
  ) {}

  static empty(clock: Clock): StaplePriceBook {
    return new StaplePriceBook(
      {
        shops: SEED_SHOPS.map((name) => ({
          id: crypto.randomUUID(),
          name,
          builtIn: true,
        })),
        categories: SEED_CATEGORIES.map((category) => ({
          id: crypto.randomUUID(),
          name: category.name,
          unitFamily: category.unitFamily,
        })),
        visits: [],
        observations: [],
        settings: emptySettings(),
      },
      clock,
      null,
    );
  }

  shops(): Shop[] {
    return this.state.shops.map((shop) => ({ ...shop }));
  }

  shopChoices(): Shop[] {
    const latest = new Map<string, string>();
    for (const visit of this.state.visits) {
      const previous = latest.get(visit.shopId);
      if (!previous || visit.updatedAt > previous) {
        latest.set(visit.shopId, visit.updatedAt);
      }
    }
    return this.state.shops
      .map((shop, index) => ({ shop, index }))
      .filter((item) => item.shop.archivedAt === undefined)
      .sort((left, right) => {
        const leftAt = latest.get(left.shop.id) ?? "";
        const rightAt = latest.get(right.shop.id) ?? "";
        if (leftAt !== rightAt) {
          return rightAt.localeCompare(leftAt);
        }
        return left.index - right.index;
      })
      .map((item) => ({ ...item.shop }));
  }

  categories(): Category[] {
    return this.state.categories.map((category) => ({ ...category }));
  }

  categoryChoices(): Category[] {
    const active = this.state.categories.filter((category) => category.archivedAt === undefined);
    const remaining = new Map(active.map((category) => [category.id, category]));
    const recent: Category[] = [];
    for (const id of this.state.settings.recentCategoryIds) {
      const category = remaining.get(id);
      if (category && recent.length < 8) {
        recent.push(category);
        remaining.delete(id);
      }
    }
    const rest = [...remaining.values()].sort((left, right) =>
      left.name.localeCompare(right.name, "en-GB"),
    );
    return [...recent, ...rest].map((category) => ({ ...category }));
  }

  visits(): Visit[] {
    return this.state.visits.map((visit) => ({ ...visit }));
  }

  drafts(): Visit[] {
    return this.visits()
      .filter((visit) => visit.status === "draft")
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  visit(visitId: string): Visit | undefined {
    return this.visits().find((visit) => visit.id === visitId);
  }

  observations(visitId?: string): Observation[] {
    return this.state.observations
      .filter((observation) => visitId === undefined || observation.visitId === visitId)
      .map((observation) => ({ ...observation }));
  }

  entryDefault(categoryId: string): EntryDefault | undefined {
    const entry = this.state.settings.lastEntryByCategoryId[categoryId];
    return entry ? { ...entry } : undefined;
  }

  today(): string {
    return this.clock.today();
  }

  displayUnitPrice(observationId: string): string | undefined {
    const observation = this.state.observations.find((item) => item.id === observationId);
    const category = this.state.categories.find((item) => item.id === observation?.categoryId);
    if (!observation || !category) {
      return undefined;
    }
    return formatUnitPrice(observation.unitPricePence, category.unitFamily);
  }

  addShop(input: { name: string }): BookResult<{ shopId: string }> {
    const name = input.name.trim();
    if (name.length === 0) {
      return this.fail("invalid-name");
    }
    if (this.state.shops.some((shop) => shop.name.toLowerCase() === name.toLowerCase())) {
      return this.fail("duplicate-shop");
    }
    const shopId = crypto.randomUUID();
    return this.succeed(
      {
        ...this.state,
        shops: [...this.state.shops, { id: shopId, name, builtIn: false }],
      },
      { shopId },
    );
  }

  renameShop(input: { shopId: string; name: string }): BookResult<{ shopId: string }> {
    const shop = this.state.shops.find((item) => item.id === input.shopId);
    if (!shop) {
      return this.fail("unknown-shop");
    }
    const name = input.name.trim();
    if (name.length === 0) {
      return this.fail("invalid-name");
    }
    if (
      this.state.shops.some(
        (item) => item.id !== shop.id && item.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      return this.fail("duplicate-shop");
    }
    return this.succeed(
      {
        ...this.state,
        shops: this.state.shops.map((item) => (item.id === shop.id ? { ...item, name } : item)),
      },
      { shopId: shop.id },
    );
  }

  archiveShop(shopId: string): BookResult<{ shopId: string }> {
    const shop = this.state.shops.find((item) => item.id === shopId);
    if (!shop) {
      return this.fail("unknown-shop");
    }
    return this.succeed(
      {
        ...this.state,
        shops: this.state.shops.map((item) =>
          item.id === shop.id ? { ...item, archivedAt: item.archivedAt ?? this.stamp() } : item,
        ),
      },
      { shopId: shop.id },
    );
  }

  addCategory(input: { name: string; unitFamily: UnitFamily }): BookResult<{ categoryId: string }> {
    const name = input.name.trim();
    if (name.length === 0) {
      return this.fail("invalid-name");
    }
    if (!familySchema.safeParse(input.unitFamily).success) {
      return this.fail("invalid-name");
    }
    const categoryId = crypto.randomUUID();
    return this.succeed(
      {
        ...this.state,
        categories: [
          ...this.state.categories,
          { id: categoryId, name, unitFamily: input.unitFamily },
        ],
      },
      { categoryId },
    );
  }

  renameCategory(input: { categoryId: string; name: string }): BookResult<{ categoryId: string }> {
    const category = this.state.categories.find((item) => item.id === input.categoryId);
    if (!category) {
      return this.fail("unknown-category");
    }
    const name = input.name.trim();
    if (name.length === 0) {
      return this.fail("invalid-name");
    }
    return this.succeed(
      {
        ...this.state,
        categories: this.state.categories.map((item) =>
          item.id === category.id ? { ...item, name } : item,
        ),
      },
      { categoryId: category.id },
    );
  }

  archiveCategory(categoryId: string): BookResult<{ categoryId: string }> {
    const category = this.state.categories.find((item) => item.id === categoryId);
    if (!category) {
      return this.fail("unknown-category");
    }
    if (this.state.observations.some((item) => item.categoryId === category.id)) {
      return this.fail("category-in-use");
    }
    return this.succeed(
      {
        ...this.state,
        categories: this.state.categories.map((item) =>
          item.id === category.id
            ? { ...item, archivedAt: item.archivedAt ?? this.stamp() }
            : item,
        ),
      },
      { categoryId: category.id },
    );
  }

  mergeCategories(input: { sourceId: string; targetId: string }): BookResult<{ categoryId: string }> {
    const source = this.state.categories.find((item) => item.id === input.sourceId);
    const target = this.state.categories.find((item) => item.id === input.targetId);
    if (!source || !target) {
      return this.fail("unknown-category");
    }
    if (
      source.id === target.id ||
      source.unitFamily !== target.unitFamily ||
      source.mergedInto ||
      target.mergedInto ||
      source.archivedAt ||
      target.archivedAt
    ) {
      return this.fail("incompatible-merge");
    }
    const at = this.stamp();
    const defaults = { ...this.state.settings.lastEntryByCategoryId };
    if (!defaults[target.id] && defaults[source.id]) {
      defaults[target.id] = defaults[source.id];
    }
    delete defaults[source.id];
    const recent: string[] = [];
    for (const id of this.state.settings.recentCategoryIds) {
      const next = id === source.id ? target.id : id;
      if (!recent.includes(next)) {
        recent.push(next);
      }
    }
    return this.succeed(
      {
        ...this.state,
        categories: this.state.categories.map((item) =>
          item.id === source.id ? { ...item, archivedAt: at, mergedInto: target.id } : item,
        ),
        observations: this.state.observations.map((item) =>
          item.categoryId === source.id ? { ...item, categoryId: target.id, updatedAt: at } : item,
        ),
        settings: {
          ...this.state.settings,
          recentCategoryIds: recent.slice(0, 8),
          lastEntryByCategoryId: defaults,
          revision: this.state.settings.revision + 1,
        },
      },
      { categoryId: target.id },
    );
  }

  startVisit(input: { date: string; shopId: string }): BookResult<{ visitId: string }> {
    const shop = this.state.shops.find((item) => item.id === input.shopId);
    if (!shop) {
      return this.fail("unknown-shop");
    }
    if (shop.archivedAt) {
      return this.fail("archived-shop");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
      return this.fail("incomplete-visit");
    }
    const at = this.stamp();
    const visitId = crypto.randomUUID();
    return this.succeed(
      {
        ...this.state,
        visits: [
          ...this.state.visits,
          {
            id: visitId,
            date: input.date,
            shopId: shop.id,
            status: "draft",
            createdAt: at,
            updatedAt: at,
          },
        ],
        settings: { ...this.state.settings, lastShopId: shop.id, revision: this.state.settings.revision + 1 },
      },
      { visitId },
    );
  }

  updateVisit(input: {
    visitId: string;
    date?: string;
    shopId?: string;
  }): BookResult<{ visitId: string }> {
    const visit = this.state.visits.find((item) => item.id === input.visitId);
    if (!visit) {
      return this.fail("unknown-visit");
    }
    const date = input.date ?? visit.date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return this.fail("incomplete-visit");
    }
    const shopId = input.shopId ?? visit.shopId;
    const shop = this.state.shops.find((item) => item.id === shopId);
    if (!shop) {
      return this.fail("unknown-shop");
    }
    if (input.shopId && shop.archivedAt) {
      return this.fail("archived-shop");
    }
    const at = this.stamp();
    return this.succeed(
      {
        ...this.state,
        visits: this.state.visits.map((item) =>
          item.id === visit.id ? { ...item, date, shopId: shop.id, updatedAt: at } : item,
        ),
        settings: { ...this.state.settings, lastShopId: shop.id, revision: this.state.settings.revision + 1 },
      },
      { visitId: visit.id },
    );
  }

  addObservation(input: {
    visitId: string;
    categoryId: string;
    paidPence: number;
    quantity: number;
    unit: string;
    promotion?: boolean;
    comment?: string;
  }): BookResult<{ observationId: string }> {
    const built = this.buildObservation(input, undefined);
    if (!built.ok) {
      return this.fail(built.error);
    }
    const at = this.stamp();
    const observationId = crypto.randomUUID();
    const defaults = {
      ...this.state.settings.lastEntryByCategoryId,
      [built.category.id]: { quantity: input.quantity, unit: built.unit },
    };
    const recent = [
      built.category.id,
      ...this.state.settings.recentCategoryIds.filter((id) => id !== built.category.id),
    ].slice(0, 8);
    return this.succeed(
      {
        ...this.state,
        visits: this.state.visits.map((item) =>
          item.id === built.visit.id ? { ...item, updatedAt: at } : item,
        ),
        observations: [
          ...this.state.observations,
          {
            id: observationId,
            visitId: built.visit.id,
            categoryId: built.category.id,
            paidPence: input.paidPence,
            enteredQuantity: input.quantity,
            enteredUnit: built.unit,
            canonicalQuantity: built.canonicalQuantity,
            unitPricePence: built.unitPricePence,
            promotion: input.promotion ?? false,
            comment: blankToUndefined(input.comment),
            createdAt: at,
            updatedAt: at,
          },
        ],
        settings: {
          ...this.state.settings,
          recentCategoryIds: recent,
          lastEntryByCategoryId: defaults,
          revision: this.state.settings.revision + 1,
        },
      },
      { observationId },
    );
  }

  updateObservation(input: {
    observationId: string;
    categoryId?: string;
    paidPence?: number;
    quantity?: number;
    unit?: string;
    promotion?: boolean;
    comment?: string;
  }): BookResult<{ observationId: string }> {
    const current = this.state.observations.find((item) => item.id === input.observationId);
    if (!current) {
      return this.fail("unknown-observation");
    }
    const built = this.buildObservation(
      {
        visitId: current.visitId,
        categoryId: input.categoryId ?? current.categoryId,
        paidPence: input.paidPence ?? current.paidPence,
        quantity: input.quantity ?? current.enteredQuantity,
        unit: input.unit ?? current.enteredUnit,
        promotion: input.promotion ?? current.promotion,
        comment: input.comment === undefined ? current.comment : input.comment,
      },
      current.categoryId,
    );
    if (!built.ok) {
      return this.fail(built.error);
    }
    const at = this.stamp();
    return this.succeed(
      {
        ...this.state,
        visits: this.state.visits.map((item) =>
          item.id === current.visitId ? { ...item, updatedAt: at } : item,
        ),
        observations: this.state.observations.map((item) =>
          item.id === current.id
            ? {
                ...item,
                categoryId: built.category.id,
                paidPence: input.paidPence ?? current.paidPence,
                enteredQuantity: input.quantity ?? current.enteredQuantity,
                enteredUnit: built.unit,
                canonicalQuantity: built.canonicalQuantity,
                unitPricePence: built.unitPricePence,
                promotion: input.promotion ?? current.promotion,
                comment: input.comment === undefined ? current.comment : blankToUndefined(input.comment),
                updatedAt: at,
              }
            : item,
        ),
        settings: { ...this.state.settings, revision: this.state.settings.revision + 1 },
      },
      { observationId: current.id },
    );
  }

  removeObservation(input: {
    observationId: string;
    deleteVisitIfEmpty?: boolean;
  }): BookResult<{ observationId: string }> {
    const observation = this.state.observations.find((item) => item.id === input.observationId);
    if (!observation) {
      return this.fail("unknown-observation");
    }
    const visit = this.state.visits.find((item) => item.id === observation.visitId);
    if (!visit) {
      return this.fail("unknown-visit");
    }
    const remaining = this.state.observations.filter((item) => item.id !== observation.id);
    const visitCount = remaining.filter((item) => item.visitId === visit.id).length;
    if (visit.status === "complete" && visitCount === 0 && !input.deleteVisitIfEmpty) {
      return this.fail("empty-visit");
    }
    return this.succeed(
      {
        ...this.state,
        visits:
          visit.status === "complete" && visitCount === 0
            ? this.state.visits.filter((item) => item.id !== visit.id)
            : this.state.visits.map((item) =>
                item.id === visit.id ? { ...item, updatedAt: this.stamp() } : item,
              ),
        observations: remaining,
        settings: { ...this.state.settings, revision: this.state.settings.revision + 1 },
      },
      { observationId: observation.id },
    );
  }

  completeVisit(
    visitId: string,
    options?: { acknowledgeDuplicate?: boolean },
  ): BookResult<{ visitId: string }> {
    const visit = this.state.visits.find((item) => item.id === visitId);
    if (!visit) {
      return this.fail("unknown-visit");
    }
    if (!this.state.shops.some((shop) => shop.id === visit.shopId)) {
      return this.fail("unknown-shop");
    }
    const mine = this.state.observations.filter((item) => item.visitId === visit.id);
    if (mine.length < 1) {
      return this.fail("incomplete-visit");
    }
    if (visit.status === "complete") {
      return this.succeed(this.state, { visitId: visit.id });
    }
    const categories = new Set(mine.map((item) => item.categoryId));
    const duplicate = this.state.visits.some(
      (other) =>
        other.id !== visit.id &&
        other.status === "complete" &&
        other.date === visit.date &&
        other.shopId === visit.shopId &&
        this.state.observations.some(
          (item) => item.visitId === other.id && categories.has(item.categoryId),
        ),
    );
    if (duplicate && !options?.acknowledgeDuplicate) {
      return this.fail("duplicate-warning");
    }
    const at = this.stamp();
    return this.succeed(
      {
        ...this.state,
        visits: this.state.visits.map((item) =>
          item.id === visit.id ? { ...item, status: "complete", updatedAt: at } : item,
        ),
        settings: { ...this.state.settings, revision: this.state.settings.revision + 1 },
      },
      { visitId: visit.id },
    );
  }

  discardVisit(visitId: string): BookResult<{ visitId: string }> {
    const visit = this.state.visits.find((item) => item.id === visitId);
    if (!visit) {
      return this.fail("unknown-visit");
    }
    if (visit.status !== "draft") {
      return this.fail("not-draft");
    }
    return this.succeed(
      {
        ...this.state,
        visits: this.state.visits.filter((item) => item.id !== visit.id),
        observations: this.state.observations.filter((item) => item.visitId !== visit.id),
        settings: { ...this.state.settings, revision: this.state.settings.revision + 1 },
      },
      { visitId: visit.id },
    );
  }

  deleteVisit(visitId: string): BookResult<{ visitId: string }> {
    const visit = this.state.visits.find((item) => item.id === visitId);
    if (!visit) {
      return this.fail("unknown-visit");
    }
    if (visit.status !== "complete") {
      return this.fail("not-complete");
    }
    return this.succeed(
      {
        ...this.state,
        visits: this.state.visits.filter((item) => item.id !== visit.id),
        observations: this.state.observations.filter((item) => item.visitId !== visit.id),
        settings: { ...this.state.settings, revision: this.state.settings.revision + 1 },
      },
      { visitId: visit.id },
    );
  }

  markPersistencePrompted(): BookResult<{ prompted: true }> {
    return this.succeed(
      {
        ...this.state,
        settings: { ...this.state.settings, persistencePrompted: true },
      },
      { prompted: true },
    );
  }

  statistics(query: {
    categoryId: string;
    from?: string;
    to?: string;
    shopId?: string;
    promotion?: "include" | "exclude" | "only";
  }): Statistics {
    const promotion = query.promotion ?? "include";
    const points = this.state.observations.flatMap((observation) => {
      if (observation.categoryId !== query.categoryId) {
        return [];
      }
      const visit = this.state.visits.find((item) => item.id === observation.visitId);
      if (!visit || visit.status !== "complete") {
        return [];
      }
      if (query.shopId && visit.shopId !== query.shopId) {
        return [];
      }
      if (query.from && visit.date < query.from) {
        return [];
      }
      if (query.to && visit.date > query.to) {
        return [];
      }
      if (promotion === "exclude" && observation.promotion) {
        return [];
      }
      if (promotion === "only" && !observation.promotion) {
        return [];
      }
      return [
        {
          observationId: observation.id,
          visitId: visit.id,
          date: visit.date,
          shopId: visit.shopId,
          unitPricePence: observation.unitPricePence,
          promotion: observation.promotion,
        },
      ];
    });
    points.sort((left, right) => left.date.localeCompare(right.date) || left.observationId.localeCompare(right.observationId));
    const byMonth = new Map<string, number[]>();
    for (const point of points) {
      const month = point.date.slice(0, 7);
      const prices = byMonth.get(month) ?? [];
      prices.push(point.unitPricePence);
      byMonth.set(month, prices);
    }
    const months = [...byMonth.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([month, prices]) => ({ month, medianPence: median(prices), count: prices.length }));
    const first = months[0];
    const last = months[months.length - 1];
    const enough = points.length >= 3 && months.length >= 2 && first && last && first.medianPence !== 0;
    return {
      points,
      months,
      trend: enough
        ? {
            status: "trend",
            firstMonth: first.month,
            lastMonth: last.month,
            firstMedianPence: first.medianPence,
            lastMedianPence: last.medianPence,
            percentChange: roundHalfUp(((last.medianPence - first.medianPence) / first.medianPence) * 100, 1),
            observationCount: points.length,
          }
        : { status: "insufficient", label: "Not enough evidence for a trend yet" },
    };
  }

  exportBackup(): Backup {
    return {
      schemaVersion: 1,
      exportedAt: this.stamp(),
      shops: this.shops(),
      categories: this.categories(),
      visits: this.visits(),
      observations: this.observations(),
      settings: {
        ...this.state.settings,
        lastEntryByCategoryId: { ...this.state.settings.lastEntryByCategoryId },
        recentCategoryIds: [...this.state.settings.recentCategoryIds],
      },
    };
  }

  previewBackup(input: unknown): { ok: true; counts: BackupCounts } | { ok: false; error: { code: "invalid-backup" } } {
    const backup = readBackup(input);
    if (!backup) {
      return { ok: false, error: { code: "invalid-backup" } };
    }
    return { ok: true, counts: countsOf(backup) };
  }

  restoreBackup(input: unknown): BookResult<BackupCounts> {
    const backup = readBackup(input);
    if (!backup) {
      return this.fail("invalid-backup");
    }
    const restored = new StaplePriceBook(
      {
        shops: backup.shops.map((shop) => ({ ...shop })),
        categories: backup.categories.map((category) => ({ ...category })),
        visits: backup.visits.map((visit) => ({ ...visit })),
        observations: backup.observations.map((observation) => ({ ...observation })),
        settings: {
          ...backup.settings,
          recentCategoryIds: [...backup.settings.recentCategoryIds],
          lastEntryByCategoryId: { ...backup.settings.lastEntryByCategoryId },
        },
      },
      this.clock,
      this.exportBackup(),
    );
    return { ok: true, book: restored, value: countsOf(backup) };
  }

  undoRestore(): BookResult<BackupCounts> {
    if (!this.previousBackup) {
      return this.fail("nothing-to-undo");
    }
    const backup = this.previousBackup;
    const undone = new StaplePriceBook(
      {
        shops: backup.shops.map((shop) => ({ ...shop })),
        categories: backup.categories.map((category) => ({ ...category })),
        visits: backup.visits.map((visit) => ({ ...visit })),
        observations: backup.observations.map((observation) => ({ ...observation })),
        settings: {
          ...backup.settings,
          recentCategoryIds: [...backup.settings.recentCategoryIds],
          lastEntryByCategoryId: { ...backup.settings.lastEntryByCategoryId },
        },
      },
      this.clock,
      null,
    );
    return { ok: true, book: undone, value: countsOf(backup) };
  }

  toCsv(): string {
    const header = [
      "visit date",
      "shop name",
      "category name",
      "paid pounds",
      "entered quantity",
      "entered unit",
      "unit price pounds",
      "canonical unit",
      "promotion",
      "comment",
      "visit id",
      "observation id",
    ].join(",");
    const rows = this.state.observations.flatMap((observation) => {
      const visit = this.state.visits.find((item) => item.id === observation.visitId);
      const shop = this.state.shops.find((item) => item.id === visit?.shopId);
      const category = this.state.categories.find((item) => item.id === observation.categoryId);
      if (!visit || visit.status !== "complete" || !shop || !category) {
        return [];
      }
      return [
        [
          visit.date,
          shop.name,
          category.name,
          pounds(observation.paidPence),
          String(observation.enteredQuantity),
          observation.enteredUnit,
          pounds(observation.unitPricePence),
          canonicalUnit(category.unitFamily),
          observation.promotion ? "true" : "false",
          observation.comment ?? "",
          visit.id,
          observation.id,
        ]
          .map(csvCell)
          .join(","),
      ];
    });
    return [header, ...rows].join("\n");
  }

  private stamp(): string {
    return stamp(this.clock.today(), this.state.settings.revision + 1);
  }

  private buildObservation(
    input: {
      visitId: string;
      categoryId: string;
      paidPence: number;
      quantity: number;
      unit: string;
    },
    currentCategoryId: string | undefined,
  ):
    | { ok: true; visit: Visit; category: Category; unit: EnteredUnit; canonicalQuantity: number; unitPricePence: number }
    | { ok: false; error: BookErrorCode } {
    const visit = this.state.visits.find((item) => item.id === input.visitId);
    if (!visit) {
      return { ok: false, error: "unknown-visit" };
    }
    const category = this.state.categories.find((item) => item.id === input.categoryId);
    if (!category) {
      return { ok: false, error: "unknown-category" };
    }
    if (category.archivedAt && category.id !== currentCategoryId) {
      return { ok: false, error: "archived-category" };
    }
    const unit = enteredUnitFor(category.unitFamily, input.unit);
    if (!unit) {
      return { ok: false, error: "wrong-unit-family" };
    }
    if (!validPrice(input.paidPence)) {
      return { ok: false, error: "invalid-price" };
    }
    if (!validQuantity(input.quantity)) {
      return { ok: false, error: "invalid-quantity" };
    }
    const canonicalQuantity = canonicalOf(input.quantity, unit);
    return {
      ok: true,
      visit,
      category,
      unit,
      canonicalQuantity,
      unitPricePence: input.paidPence / canonicalQuantity,
    };
  }

  private fail(code: BookErrorCode): BookFailure {
    return { ok: false, book: this, error: { code } };
  }

  private succeed<T>(state: BookState, value: T): BookSuccess<T> {
    return { ok: true, book: new StaplePriceBook(state, this.clock, null), value };
  }
}

function blankToUndefined(comment: string | undefined): string | undefined {
  const trimmed = comment?.trim();
  return trimmed ? trimmed : undefined;
}

export function createStaplePriceBook(clock: Clock): StaplePriceBook {
  return StaplePriceBook.empty(clock);
}
