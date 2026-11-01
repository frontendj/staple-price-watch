import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { openTextFile, saveTextFile } from "./files";
import { localToday, monthLabel, poundsToPence, showDate, showMoney } from "./format";
import { loadBook, saveBook } from "./store";
import {
  canonicalUnit,
  quoteUnitPrice,
  unitsFor,
  type BookErrorCode,
  type BookResult,
  type StaplePriceWatch,
  type UnitFamily,
} from "./staple-price-watch";

type Screen =
  | { name: "home" }
  | { name: "new-visit" }
  | { name: "visit"; visitId: string }
  | { name: "observation"; visitId: string; observationId?: string }
  | { name: "statistics" }
  | { name: "categories" }
  | { name: "shops" }
  | { name: "backup" };

const clock = { today: localToday };

const errors: Record<BookErrorCode, string> = {
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
  "duplicate-warning": "A completed visit already has this shop, date, and category.",
  "not-draft": "Only a draft can be discarded.",
  "not-complete": "Only a completed visit can be deleted this way.",
  "empty-visit": "Deleting this item would leave the visit empty.",
  "category-in-use": "Move or delete its observations before archiving this category.",
  "incompatible-merge": "Merge only two active categories that share a unit.",
  "invalid-backup": "That file is not a Staple Price Watch backup.",
  "nothing-to-undo": "There is no restore to undo.",
};

export function App() {
  const [book, setBook] = useState<StaplePriceWatch | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const [notice, setNotice] = useState("");
  const [persistence, setPersistence] = useState<"unknown" | "granted" | "not-granted">("unknown");
  const {
    offlineReady: [offlineReady],
  } = useRegisterSW();

  useEffect(() => {
    let cancelled = false;
    void loadBook(clock).then((loaded) => {
      if (cancelled) {
        return;
      }
      setBook(loaded);
      if (loaded.persistenceWasPrompted()) {
        void navigator.storage?.persisted?.().then((granted) => {
          setPersistence(granted ? "granted" : "not-granted");
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function commit<T>(result: BookResult<T>): Promise<BookResult<T>> {
    if (!result.ok) {
      setNotice(errors[result.error.code]);
      return result;
    }
    setNotice("");
    setBook(result.book);
    try {
      await saveBook(result.book);
    } catch {
      setNotice("The change is on screen, but it could not be saved on this device.");
    }
    return result;
  }

  async function rememberPersistence(next: StaplePriceWatch): Promise<void> {
    if (next.persistenceWasPrompted()) {
      return;
    }
    const granted = (await navigator.storage?.persist?.()) ?? false;
    setPersistence(granted ? "granted" : "not-granted");
    const marked = next.markPersistencePrompted();
    if (marked.ok) {
      setBook(marked.book);
      await saveBook(marked.book);
    }
  }

  if (!book) {
    return (
      <main className="screen">
        <p>Opening the book…</p>
      </main>
    );
  }

  return (
    <>
    <main className="screen">
      {notice ? <p className="notice">{notice}</p> : null}
      {screen.name === "home" ? (
        <Home
          book={book}
          offlineReady={offlineReady}
          persistence={persistence}
          onOpen={setScreen}
        />
      ) : null}
      {screen.name === "new-visit" ? (
        <NewVisit
          book={book}
          onCancel={() => setScreen({ name: "home" })}
          onCreate={async (date, shopId) => {
            const result = await commit(book.startVisit({ date, shopId }));
            if (result.ok) {
              setScreen({ name: "visit", visitId: result.value.visitId });
            }
          }}
        />
      ) : null}
      {screen.name === "visit" ? (
        <VisitScreen
          book={book}
          visitId={screen.visitId}
          commit={commit}
          onHome={() => setScreen({ name: "home" })}
          onEdit={(observationId) =>
            setScreen({ name: "observation", visitId: screen.visitId, observationId })
          }
          onAdd={() => setScreen({ name: "observation", visitId: screen.visitId })}
          onCompleted={rememberPersistence}
        />
      ) : null}
      {screen.name === "observation" ? (
        <ObservationScreen
          book={book}
          visitId={screen.visitId}
          observationId={screen.observationId}
          commit={commit}
          onClose={() => setScreen({ name: "visit", visitId: screen.visitId })}
        />
      ) : null}
      {screen.name === "statistics" ? (
        <StatisticsScreen book={book} onOpen={setScreen} />
      ) : null}
      {screen.name === "categories" ? (
        <CategoriesScreen book={book} commit={commit} />
      ) : null}
      {screen.name === "shops" ? (
        <ShopsScreen book={book} commit={commit} />
      ) : null}
      {screen.name === "backup" ? (
        <BackupScreen book={book} persistence={persistence} commit={commit} />
      ) : null}
    </main>
    <TabBar screen={screen} onOpen={setScreen} />
    </>
  );
}

const tabs = [
  { name: "home", label: "Home" },
  { name: "statistics", label: "Statistics" },
  { name: "categories", label: "Categories" },
  { name: "shops", label: "Shops" },
  { name: "backup", label: "Backup" },
] as const;

function tabFor(screen: Screen): (typeof tabs)[number]["name"] {
  if (
    screen.name === "statistics" ||
    screen.name === "categories" ||
    screen.name === "shops" ||
    screen.name === "backup"
  ) {
    return screen.name;
  }
  return "home";
}

function TabBar(props: { screen: Screen; onOpen: (screen: Screen) => void }) {
  const current = tabFor(props.screen);
  return (
    <nav className="tabbar" aria-label="Sections">
      {tabs.map((tab) => (
        <button
          key={tab.name}
          type="button"
          aria-current={current === tab.name ? "page" : undefined}
          onClick={() => props.onOpen({ name: tab.name })}
        >
          <TabIcon name={tab.name} />
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

function TabIcon(props: { name: (typeof tabs)[number]["name"] }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  if (props.name === "home") {
    return (
      <svg {...common}>
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
      </svg>
    );
  }
  if (props.name === "statistics") {
    return (
      <svg {...common}>
        <path d="M4 19h16" />
        <path d="M7 16v-4" />
        <path d="M12 16V8" />
        <path d="M17 16v-7" />
      </svg>
    );
  }
  if (props.name === "categories") {
    return (
      <svg {...common}>
        <path d="M4 7h7l2 2h7v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
      </svg>
    );
  }
  if (props.name === "shops") {
    return (
      <svg {...common}>
        <path d="M4 10h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
        <path d="M3 10 6 5h12l3 5" />
        <path d="M9 20v-5h6v5" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 4v10" />
      <path d="m8 10 4 4 4-4" />
      <path d="M5 20h14" />
    </svg>
  );
}

function Home(props: {
  book: StaplePriceWatch;
  offlineReady: boolean;
  persistence: "unknown" | "granted" | "not-granted";
  onOpen: (screen: Screen) => void;
}) {
  const completed = props.book
    .visits()
    .filter((visit) => visit.status === "complete")
    .sort((left, right) => right.date.localeCompare(left.date) || right.updatedAt.localeCompare(left.updatedAt));
  return (
    <>
      <h1>Staple Price Watch</h1>
      {props.offlineReady ? <p>Ready offline</p> : <p className="muted">Waiting for the app shell to cache.</p>}
      {props.persistence === "granted" ? (
        <p className="muted">Browser storage persistence is granted. This is not a backup.</p>
      ) : null}
      {props.persistence === "not-granted" ? (
        <p className="muted">
          Browser storage persistence was not granted. Export a JSON backup. Installing the app does not keep the
          book.
        </p>
      ) : null}
      <button type="button" onClick={() => props.onOpen({ name: "new-visit" })}>
        New visit
      </button>
      <h2>Drafts</h2>
      {props.book.drafts().length === 0 ? <p className="muted">No unfinished visits.</p> : null}
      <ul>
        {props.book.drafts().map((visit) => (
          <li key={visit.id}>
            <button type="button" className="secondary" onClick={() => props.onOpen({ name: "visit", visitId: visit.id })}>
              {showDate(visit.date)} · {shopName(props.book, visit.shopId)} · {props.book.observations(visit.id).length}{" "}
              observations
            </button>
          </li>
        ))}
      </ul>
      <h2>Recent visits</h2>
      <ul>
        {completed.map((visit) => (
          <li key={visit.id}>
            <button type="button" className="secondary" onClick={() => props.onOpen({ name: "visit", visitId: visit.id })}>
              {showDate(visit.date)} · {shopName(props.book, visit.shopId)} · {props.book.observations(visit.id).length}{" "}
              observations
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function NewVisit(props: {
  book: StaplePriceWatch;
  onCancel: () => void;
  onCreate: (date: string, shopId: string) => void;
}) {
  const shops = props.book.shopChoices();
  const [date, setDate] = useState(props.book.today());
  const [shopId, setShopId] = useState(shops[0]?.id ?? "");
  return (
    <>
      <h1>New visit</h1>
      <label>
        <span>Date</span>
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </label>
      <label>
        <span>Shop</span>
        <select value={shopId} onChange={(event) => setShopId(event.target.value)}>
          {shops.map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.name}
            </option>
          ))}
        </select>
      </label>
      <button type="button" disabled={!shopId || !date} onClick={() => props.onCreate(date, shopId)}>
        Start visit
      </button>
      <button type="button" className="secondary" onClick={props.onCancel}>
        Cancel
      </button>
    </>
  );
}

function VisitScreen(props: {
  book: StaplePriceWatch;
  visitId: string;
  commit: <T>(result: BookResult<T>) => Promise<BookResult<T>>;
  onHome: () => void;
  onAdd: () => void;
  onEdit: (observationId: string) => void;
  onCompleted: (book: StaplePriceWatch) => Promise<void>;
}) {
  const visit = props.book.visit(props.visitId);
  const [duplicate, setDuplicate] = useState(false);
  if (!visit) {
    return (
      <>
        <p>That visit is gone.</p>
        <button type="button" onClick={props.onHome}>
          Home
        </button>
      </>
    );
  }
  const observations = props.book.observations(visit.id);
  const shopOptions = props.book.shopChoices();
  const currentShop = props.book.shops().find((shop) => shop.id === visit.shopId);
  const shops =
    currentShop && !shopOptions.some((shop) => shop.id === currentShop.id)
      ? [currentShop, ...shopOptions]
      : shopOptions;
  return (
    <>
      <h1>{visit.status === "draft" ? "Draft visit" : "Visit"}</h1>
      <label>
        <span>Date</span>
        <input
          type="date"
          value={visit.date}
          onChange={(event) => void props.commit(props.book.updateVisit({ visitId: visit.id, date: event.target.value }))}
        />
      </label>
      <label>
        <span>Shop</span>
        <select
          value={visit.shopId}
          onChange={(event) =>
            void props.commit(props.book.updateVisit({ visitId: visit.id, shopId: event.target.value }))
          }
        >
          {shops.map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.name}
            </option>
          ))}
        </select>
      </label>
      <ul>
        {observations.map((observation) => {
          const category = props.book.categories().find((item) => item.id === observation.categoryId);
          return (
            <li key={observation.id}>
              <button type="button" className="secondary" onClick={() => props.onEdit(observation.id)}>
                {category?.name ?? "Category"} · {showMoney(observation.paidPence)} ·{" "}
                {props.book.displayUnitPrice(observation.id)}
                {observation.promotion ? " · promotion" : ""}
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" onClick={props.onAdd}>
        Add observation
      </button>
      {duplicate ? (
        <div className="notice">
          <p>A completed visit already has this shop, date, and one of these categories.</p>
          <button
            type="button"
            onClick={() => {
              void props.commit(props.book.completeVisit(visit.id, { acknowledgeDuplicate: true })).then(async (result) => {
                if (result.ok) {
                  await props.onCompleted(result.book);
                  props.onHome();
                }
              });
            }}
          >
            Complete anyway
          </button>
        </div>
      ) : null}
      {visit.status === "draft" ? (
        <button
          type="button"
          onClick={() => {
            const result = props.book.completeVisit(visit.id);
            if (!result.ok && result.error.code === "duplicate-warning") {
              setDuplicate(true);
              return;
            }
            void props.commit(result).then(async (completed) => {
              if (completed.ok) {
                await props.onCompleted(completed.book);
                props.onHome();
              }
            });
          }}
        >
          Complete visit
        </button>
      ) : null}
      {visit.status === "draft" ? (
        <button
          type="button"
          className="secondary"
          onClick={() => {
            if (window.confirm("Discard this draft?")) {
              void props.commit(props.book.discardVisit(visit.id)).then((result) => {
                if (result.ok) {
                  props.onHome();
                }
              });
            }
          }}
        >
          Discard draft
        </button>
      ) : (
        <button
          type="button"
          className="secondary"
          onClick={() => {
            if (window.confirm("Delete this completed visit?")) {
              void props.commit(props.book.deleteVisit(visit.id)).then((result) => {
                if (result.ok) {
                  props.onHome();
                }
              });
            }
          }}
        >
          Delete visit
        </button>
      )}
    </>
  );
}

function ObservationScreen(props: {
  book: StaplePriceWatch;
  visitId: string;
  observationId?: string;
  commit: <T>(result: BookResult<T>) => Promise<BookResult<T>>;
  onClose: () => void;
}) {
  const existing = props.observationId
    ? props.book.observations().find((item) => item.id === props.observationId)
    : undefined;
  const choices = props.book.categoryChoices();
  const initialCategory =
    props.book.categories().find((item) => item.id === existing?.categoryId) ?? choices[0];
  const preset = initialCategory ? props.book.entryDefault(initialCategory.id) : undefined;
  const [categoryName, setCategoryName] = useState(initialCategory?.name ?? "");
  const [newFamily, setNewFamily] = useState<UnitFamily>(initialCategory?.unitFamily ?? "mass");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [price, setPrice] = useState(existing ? (existing.paidPence / 100).toFixed(2) : "");
  const [quantity, setQuantity] = useState(
    existing ? String(existing.enteredQuantity) : preset ? String(preset.quantity) : "",
  );
  const [unit, setUnit] = useState(existing?.enteredUnit ?? preset?.unit ?? "item");
  const [promotion, setPromotion] = useState(existing?.promotion ?? false);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const trimmedName = categoryName.trim();
  const matched = props.book.categories().find(
    (item) =>
      item.name.toLowerCase() === trimmedName.toLowerCase() &&
      (!item.archivedAt || item.id === existing?.categoryId),
  );
  const creating = trimmedName.length > 0 && !matched;
  const family = matched?.unitFamily ?? newFamily;
  const units = unitsFor(family);
  const selectedUnit = units.includes(unit) ? unit : (units[0] ?? "item");
  const paidPence = poundsToPence(price);
  const quote =
    trimmedName && paidPence && Number(quantity) > 0
      ? quoteUnitPrice({
          unitFamily: family,
          paidPence,
          quantity: Number(quantity),
          unit: selectedUnit,
        })
      : undefined;
  const needle = trimmedName.toLowerCase();
  const suggestions = choices.filter((item) => needle.length === 0 || item.name.toLowerCase().includes(needle));

  function applyKnownCategory(nextId: string, nextFamily: UnitFamily) {
    if (existing) {
      return;
    }
    const nextDefault = props.book.entryDefault(nextId);
    if (nextDefault && unitsFor(nextFamily).includes(nextDefault.unit)) {
      setQuantity(String(nextDefault.quantity));
      setUnit(nextDefault.unit);
      return;
    }
    setUnit(unitsFor(nextFamily)[0] ?? "item");
  }

  function chooseCategory(next: { id: string; name: string; unitFamily: UnitFamily }) {
    setCategoryName(next.name);
    setNewFamily(next.unitFamily);
    setCategoryOpen(false);
    applyKnownCategory(next.id, next.unitFamily);
  }

  function typeCategory(value: string) {
    const wasKnown = Boolean(matched);
    setCategoryName(value);
    setCategoryOpen(true);
    const next = props.book.categories().find(
      (item) => item.name.toLowerCase() === value.trim().toLowerCase() && !item.archivedAt,
    );
    if (next) {
      setNewFamily(next.unitFamily);
      applyKnownCategory(next.id, next.unitFamily);
      return;
    }
    if (wasKnown) {
      setNewFamily("mass");
      setUnit("g");
    }
  }

  async function save(andAnother: boolean) {
    let book = props.book;
    let categoryId = matched?.id;
    if (!categoryId) {
      const created = await props.commit(book.addCategory({ name: trimmedName, unitFamily: newFamily }));
      if (!created.ok) {
        return;
      }
      book = created.book;
      categoryId = created.value.categoryId;
    }
    const input = {
      categoryId,
      paidPence: paidPence ?? 0,
      quantity: Number(quantity),
      unit: selectedUnit,
      promotion,
      comment,
    };
    const result = existing
      ? await props.commit(book.updateObservation({ observationId: existing.id, ...input }))
      : await props.commit(book.addObservation({ visitId: props.visitId, ...input }));
    if (!result.ok) {
      return;
    }
    if (andAnother && !existing) {
      setPrice("");
      setPromotion(false);
      setComment("");
      const fresh = result.book.entryDefault(categoryId);
      if (fresh) {
        setQuantity(String(fresh.quantity));
        setUnit(fresh.unit);
      }
      return;
    }
    props.onClose();
  }

  return (
    <>
      <h1>{existing ? "Edit observation" : "Add observation"}</h1>
      <label>
        <span>Category</span>
        <div className="combo">
          <input
            value={categoryName}
            aria-autocomplete="list"
            aria-expanded={categoryOpen}
            onChange={(event) => typeCategory(event.target.value)}
            onFocus={() => setCategoryOpen(true)}
            onBlur={() => window.setTimeout(() => setCategoryOpen(false), 150)}
          />
          {categoryOpen ? (
            <ul className="combo-list" role="listbox">
              {suggestions.map((item) => (
                <li key={item.id}>
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => chooseCategory(item)}>
                    {item.name}
                  </button>
                </li>
              ))}
              {creating ? <li className="muted">Add “{trimmedName}” as a new category</li> : null}
            </ul>
          ) : null}
        </div>
      </label>
      {creating ? (
        <label>
          <span>Unit for {trimmedName}</span>
          <select value={newFamily} onChange={(event) => setNewFamily(event.target.value as UnitFamily)}>
            <option value="count">per item</option>
            <option value="volume">per litre</option>
            <option value="mass">per kilogram</option>
          </select>
        </label>
      ) : null}
      <label>
        <span>Paid price (£)</span>
        <input inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} />
      </label>
      <label>
        <span>Quantity</span>
        <input inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
      </label>
      <div className="units">
        {units.map((choice) => (
          <button
            key={choice}
            type="button"
            aria-pressed={choice === selectedUnit}
            onClick={() => setUnit(choice)}
          >
            {choice}
          </button>
        ))}
      </div>
      <label>
        <span>Promotion</span>
        <input
          type="checkbox"
          checked={promotion}
          onChange={(event) => setPromotion(event.target.checked)}
          style={{ width: "auto" }}
        />
      </label>
      <label>
        <span>Comment</span>
        <textarea value={comment} onChange={(event) => setComment(event.target.value)} />
      </label>
      <p>{quote ? `Unit price ${quote}` : "Enter a price and quantity to see the unit price."}</p>
      <button type="button" onClick={() => void save(false)}>
        Save
      </button>
      {existing ? null : (
        <button type="button" className="secondary" onClick={() => void save(true)}>
          Save and add another
        </button>
      )}
      {existing ? (
        <button
          type="button"
          className="secondary"
          onClick={() => {
            const visit = props.book.visit(props.visitId);
            const last = props.book.observations(props.visitId).length === 1 && visit?.status === "complete";
              const deleteVisitIfEmpty = last
              ? window.confirm("This is the last observation. Delete the whole visit?")
              : false;
            if (last && !deleteVisitIfEmpty) {
              return;
            }
            void props
              .commit(props.book.removeObservation({ observationId: existing.id, deleteVisitIfEmpty }))
              .then((result) => {
                if (result.ok) {
                  props.onClose();
                }
              });
          }}
        >
          Delete observation
        </button>
      ) : null}
      <button type="button" className="secondary" onClick={props.onClose}>
        Back
      </button>
    </>
  );
}

function StatisticsScreen(props: { book: StaplePriceWatch; onOpen: (screen: Screen) => void }) {
  const categories = props.book.categories();
  const [categoryId, setCategoryId] = useState(props.book.categoryChoices()[0]?.id ?? categories[0]?.id ?? "");
  const [shopId, setShopId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [promotion, setPromotion] = useState<"include" | "exclude" | "only">("include");
  const category = categories.find((item) => item.id === categoryId);
  const report = categoryId
    ? props.book.statistics({
        categoryId,
        shopId: shopId || undefined,
        from: from || undefined,
        to: to || undefined,
        promotion,
      })
    : undefined;
  return (
    <>
      <h1>Statistics</h1>
      <label>
        <span>Category</span>
        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
              {item.archivedAt ? " (archived)" : ""}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Shop</span>
        <select value={shopId} onChange={(event) => setShopId(event.target.value)}>
          <option value="">All shops</option>
          {props.book.shops().map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.name}
            </option>
          ))}
        </select>
      </label>
      <div className="row">
        <label>
          <span>From</span>
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label>
          <span>To</span>
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
      </div>
      <label>
        <span>Promotions</span>
        <select
          value={promotion}
          onChange={(event) => setPromotion(event.target.value as "include" | "exclude" | "only")}
        >
          <option value="include">Include</option>
          <option value="exclude">Exclude</option>
          <option value="only">Only promotions</option>
        </select>
      </label>
      {report && category ? <PriceChart report={report} unitLabel={canonicalUnit(category.unitFamily)} /> : null}
      {report?.trend.status === "insufficient" ? <p>{report.trend.label}</p> : null}
      {report?.trend.status === "trend" ? (
        <p>
          From {monthLabel(report.trend.firstMonth)} to {monthLabel(report.trend.lastMonth)},{" "}
          {showMoney(report.trend.firstMedianPence)} to {showMoney(report.trend.lastMedianPence)} per{" "}
          {category ? canonicalUnit(category.unitFamily) : "unit"}, {report.trend.percentChange.toFixed(1)}% across{" "}
          {report.trend.observationCount} observations.
        </p>
      ) : null}
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Shop</th>
            <th>Pack</th>
            <th>Paid</th>
            <th>Unit</th>
          </tr>
        </thead>
        <tbody>
          {report?.points.map((point) => (
              <tr key={point.observationId} onClick={() => props.onOpen({ name: "visit", visitId: point.visitId })}>
                <td>{showDate(point.date)}</td>
                <td>{shopName(props.book, point.shopId)}</td>
                <td>
                  {point.enteredQuantity} {point.enteredUnit}
                  {point.promotion ? " promo" : ""}
                </td>
                <td>{showMoney(point.paidPence)}</td>
                <td>{props.book.displayUnitPrice(point.observationId)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </>
  );
}

function PriceChart(props: {
  report: ReturnType<StaplePriceWatch["statistics"]>;
  unitLabel: string;
}) {
  const prices = [
    ...props.report.points.map((point) => point.unitPricePence),
    ...props.report.months.map((month) => month.medianPence),
  ];
  if (prices.length === 0) {
    return null;
  }
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  const width = 320;
  const height = 180;
  const days = props.report.points.map((point) => Date.parse(`${point.date}T00:00:00Z`));
  const firstDay = Math.min(...days);
  const lastDay = Math.max(...days);
  const daySpan = lastDay - firstDay || 1;
  const xOfDate = (date: string) => 24 + ((Date.parse(`${date}T00:00:00Z`) - firstDay) / daySpan) * (width - 48);
  const yOf = (price: number) => 16 + ((max - price) / span) * (height - 36);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Unit price chart">
      {props.report.points.map((point) => (
        <circle key={point.observationId} cx={xOfDate(point.date)} cy={yOf(point.unitPricePence)} r="4" fill="#1c1915" />
      ))}
      {props.report.months.map((month) => {
        const inMonth = props.report.points.filter((point) => point.date.startsWith(month.month));
        const first = inMonth[0];
        const last = inMonth[inMonth.length - 1];
        if (!first || !last) {
          return null;
        }
        const x = (xOfDate(first.date) + xOfDate(last.date)) / 2;
        const y = yOf(month.medianPence);
        return (
          <g key={month.month}>
            <rect x={x - 5} y={y - 5} width="10" height="10" fill="#9a3412" />
            <text x={x + 8} y={y - 6} fontSize="11" fill="#5c564c">
              {month.count} · {showMoney(month.medianPence)}/{props.unitLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function CategoriesScreen(props: {
  book: StaplePriceWatch;
  commit: <T>(result: BookResult<T>) => Promise<BookResult<T>>;
}) {
  const [name, setName] = useState("");
  const [unitFamily, setUnitFamily] = useState<UnitFamily>("mass");
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const active = props.book.categories().filter((category) => !category.archivedAt);
  return (
    <>
      <h1>Categories</h1>
      <ul>
        {props.book.categories().map((category) => (
          <li key={category.id} className="card">
            <strong>
              {category.name}
              {category.archivedAt ? " (archived)" : ""}
            </strong>
            <p className="muted">{category.unitFamily}</p>
            {category.archivedAt ? null : (
              <div className="row">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    const next = window.prompt("New name", category.name);
                    if (next) {
                      void props.commit(props.book.renameCategory({ categoryId: category.id, name: next }));
                    }
                  }}
                >
                  Rename
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => void props.commit(props.book.archiveCategory(category.id))}
                >
                  Archive
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <h2>Add</h2>
      <label>
        <span>Name</span>
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label>
        <span>Unit</span>
        <select value={unitFamily} onChange={(event) => setUnitFamily(event.target.value as UnitFamily)}>
          <option value="count">per item</option>
          <option value="volume">per litre</option>
          <option value="mass">per kilogram</option>
        </select>
      </label>
      <button
        type="button"
        onClick={() => {
          void props.commit(props.book.addCategory({ name, unitFamily })).then((result) => {
            if (result.ok) {
              setName("");
            }
          });
        }}
      >
        Add category
      </button>
      <h2>Merge</h2>
      <label>
        <span>From</span>
        <select value={sourceId} onChange={(event) => setSourceId(event.target.value)}>
          <option value="">Choose</option>
          {active.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Into</span>
        <select value={targetId} onChange={(event) => setTargetId(event.target.value)}>
          <option value="">Choose</option>
          {active.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="secondary"
        disabled={!sourceId || !targetId}
        onClick={() => void props.commit(props.book.mergeCategories({ sourceId, targetId }))}
      >
        Merge
      </button>
    </>
  );
}

function ShopsScreen(props: {
  book: StaplePriceWatch;
  commit: <T>(result: BookResult<T>) => Promise<BookResult<T>>;
}) {
  const [name, setName] = useState("");
  return (
    <>
      <h1>Shops</h1>
      <ul>
        {props.book.shops().map((shop) => (
          <li key={shop.id} className="card">
            <strong>
              {shop.name}
              {shop.archivedAt ? " (archived)" : ""}
            </strong>
            {shop.archivedAt ? null : (
              <div className="row">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    const next = window.prompt("New name", shop.name);
                    if (next) {
                      void props.commit(props.book.renameShop({ shopId: shop.id, name: next }));
                    }
                  }}
                >
                  Rename
                </button>
                <button type="button" className="secondary" onClick={() => void props.commit(props.book.archiveShop(shop.id))}>
                  Archive
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <label>
        <span>New shop</span>
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <button
        type="button"
        onClick={() => {
          void props.commit(props.book.addShop({ name })).then((result) => {
            if (result.ok) {
              setName("");
            }
          });
        }}
      >
        Add shop
      </button>
    </>
  );
}

function BackupScreen(props: {
  book: StaplePriceWatch;
  persistence: "unknown" | "granted" | "not-granted";
  commit: <T>(result: BookResult<T>) => Promise<BookResult<T>>;
}) {
  return (
    <>
      <h1>Backup</h1>
      <p className="muted">
        Clearing the browser site data empties this book. Installing it, or granting storage persistence, is not a
        backup.
      </p>
      {props.persistence === "granted" ? <p>Browser storage persistence is granted.</p> : null}
      {props.persistence === "not-granted" ? <p>Browser storage persistence was not granted.</p> : null}
      <button
        type="button"
        onClick={() => {
          const backup = props.book.exportBackup();
          void saveTextFile(
            `staple-price-watch-${backup.exportedAt.slice(0, 10)}.json`,
            JSON.stringify(backup, null, 2),
            "application/json",
          );
        }}
      >
        Save JSON backup
      </button>
      <button
        type="button"
        className="secondary"
        onClick={() => void saveTextFile(`staple-prices-${props.book.today()}.csv`, props.book.toCsv(), "text/csv")}
      >
        Export CSV
      </button>
      <button
        type="button"
        className="secondary"
        onClick={() => {
          void openTextFile().then((text) => {
            if (!text) {
              return;
            }
            const preview = props.book.previewBackup(text);
            if (!preview.ok) {
              void props.commit(props.book.restoreBackup(text));
              return;
            }
            const confirmed = window.confirm(
              `Replace this book with ${preview.counts.shops} shops, ${preview.counts.categories} categories, ${preview.counts.visits} visits, and ${preview.counts.observations} observations?`,
            );
            if (!confirmed) {
              return;
            }
            void props.commit(props.book.restoreBackup(text));
          });
        }}
      >
        Restore JSON backup
      </button>
      {props.book.canUndoRestore() ? (
        <button type="button" className="secondary" onClick={() => void props.commit(props.book.undoRestore())}>
          Undo restore
        </button>
      ) : null}
    </>
  );
}

function shopName(book: StaplePriceWatch, shopId: string): string {
  return book.shops().find((shop) => shop.id === shopId)?.name ?? "Shop";
}

