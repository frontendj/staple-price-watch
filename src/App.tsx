import { useEffect, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { openTextFile, saveTextFile } from "./files";
import { readShelfTag } from "./read-shelf-tag";
import { recogniseTag } from "./recognise-tag";
import { saveObservation } from "./save-observation";
import { localToday, monthLabel, poundsToPence, showDate, showMoney } from "./format";
import { commitLoadedBook, loadBook, saveBook } from "./loaded-book";
import {
  canonicalUnit,
  quoteUnitPrice,
  unitsFor,
  type BookResult,
  type StaplePriceWatch,
  type UnitFamily,
} from "./staple-price-watch";

type Screen =
  | { name: "home" }
  | { name: "new-visit" }
  | { name: "visit"; visitId: string }
  | { name: "observation"; visitId: string; observationId?: string }
  | { name: "camera" }
  | { name: "statistics" }
  | { name: "categories" }
  | { name: "shops" }
  | { name: "backup" };

const clock = { today: localToday };

export function App() {
  const [book, setBook] = useState<StaplePriceWatch | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const [cameraVisitId, setCameraVisitId] = useState<string | undefined>();
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
    const settled = commitLoadedBook(result);
    if (!result.ok) {
      setNotice(settled.sentence);
      return result;
    }
    setNotice("");
    setBook(settled.book);
    try {
      await saveBook(settled.book);
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
          onHome={() => {
            setCameraVisitId((current) => (current === screen.visitId ? undefined : current));
            setScreen({ name: "home" });
          }}
          onEdit={(observationId) =>
            setScreen({ name: "observation", visitId: screen.visitId, observationId })
          }
          onAdd={() => setScreen({ name: "observation", visitId: screen.visitId })}
          onCompleted={rememberPersistence}
        />
      ) : null}
      {screen.name === "camera" ? (
        <CameraScreen
          book={book}
          visitId={cameraVisitId}
          commit={commit}
          onVisit={setCameraVisitId}
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

function readPromotion(text: string): number | null | undefined {
  if (text.trim() === "") {
    return null;
  }
  return poundsToPence(text);
}

function familyForUnit(unit: string | undefined): UnitFamily {
  if (unit === "ml" || unit === "L") {
    return "volume";
  }
  if (unit === "item") {
    return "count";
  }
  return "mass";
}

function CameraScreen(props: {
  book: StaplePriceWatch;
  visitId?: string;
  commit: <T>(result: BookResult<T>) => Promise<BookResult<T>>;
  onVisit: (visitId: string | undefined) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | undefined>(undefined);
  const shotRef = useRef(0);
  const [phase, setPhase] = useState<"shoot" | "confirm">("shoot");
  const [cameraState, setCameraState] = useState<"starting" | "ready" | "unavailable">("starting");
  const [reading, setReading] = useState(false);
  const [price, setPrice] = useState("");
  const [promotion, setPromotion] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [newFamily, setNewFamily] = useState<UnitFamily>("mass");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [draftId, setDraftId] = useState("");
  const [date, setDate] = useState(props.book.today());
  const [shopId, setShopId] = useState(props.book.shopChoices()[0]?.id ?? "");
  const [comment, setComment] = useState("");
  const current = props.visitId ? props.book.visit(props.visitId) : undefined;
  const chosenDraft = draftId ? props.book.visit(draftId) : undefined;
  const joining = current ?? chosenDraft;
  const trimmedName = categoryName.trim();
  const matched = props.book.categories().find(
    (item) => item.name.toLowerCase() === trimmedName.toLowerCase() && !item.archivedAt,
  );
  const creating = trimmedName.length > 0 && !matched;
  const family = matched?.unitFamily ?? (trimmedName ? newFamily : undefined);
  const units = family ? unitsFor(family) : [];
  const selectedUnit = units.includes(unit as (typeof units)[number]) ? unit : "";
  const paidPence = poundsToPence(price);
  const promotionPrice = readPromotion(promotion);
  const quote =
    family && paidPence && Number(quantity) > 0 && selectedUnit && promotionPrice !== undefined
      ? quoteUnitPrice({
          unitFamily: family,
          paidPence,
          promotionPricePence: promotionPrice ?? undefined,
          quantity: Number(quantity),
          unit: selectedUnit,
        })
      : undefined;
  const needle = trimmedName.toLowerCase();
  const suggestions = props.book
    .categoryChoices()
    .filter((item) => needle.length === 0 || item.name.toLowerCase().includes(needle));

  useEffect(() => {
    if (phase !== "shoot") {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = undefined;
      setCameraState("starting");
      return;
    }
    let cancelled = false;
    setCameraState("starting");
    const request = navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment" } });
    if (!request) {
      setCameraState("unavailable");
      return;
    }
    void request
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraState("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setCameraState("unavailable");
        }
      });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = undefined;
    };
  }, [phase]);

  async function useShot(blob: Blob) {
    const shot = shotRef.current + 1;
    shotRef.current = shot;
    setReading(true);
    setPhase("confirm");
    const recognised = await recogniseTag(blob);
    if (shot !== shotRef.current) {
      return;
    }
    const read = readShelfTag(
      recognised.text ?? "",
      props.book.categoryChoices().map((item) => item.name),
    );
    const found = read.name
      ? props.book.categoryChoices().find((item) => item.name === read.name)
      : undefined;
    const nextFamily = found?.unitFamily ?? familyForUnit(read.unit);
    const readQuantity = read.quantity ? String(read.quantity) : "";
    const readUnit = read.unit ?? "";
    const familyUnits = unitsFor(nextFamily);
    setCategoryName(read.name ?? "");
    setNewFamily(nextFamily);
    setCategoryOpen(false);
    setPrice(read.paidPence ? (read.paidPence / 100).toFixed(2) : "");
    setPromotion(read.promotionPricePence ? (read.promotionPricePence / 100).toFixed(2) : "");
    if (readQuantity && readUnit && familyUnits.includes(readUnit as (typeof familyUnits)[number])) {
      setQuantity(readQuantity);
      setUnit(readUnit);
    } else if (found) {
      const preset = props.book.entryDefault(found.id);
      if (preset && familyUnits.includes(preset.unit)) {
        setQuantity(String(preset.quantity));
        setUnit(preset.unit);
      } else {
        setQuantity("");
        setUnit("");
      }
    } else {
      setQuantity(readQuantity);
      setUnit("");
    }
    setComment("");
    setReading(false);
  }

  function keepPackOrDefault(nextId: string, nextFamily: UnitFamily) {
    const familyUnits = unitsFor(nextFamily);
    if (quantity && unit && familyUnits.includes(unit as (typeof familyUnits)[number])) {
      return;
    }
    const preset = props.book.entryDefault(nextId);
    if (preset && familyUnits.includes(preset.unit)) {
      setQuantity(String(preset.quantity));
      setUnit(preset.unit);
      return;
    }
    setQuantity("");
    setUnit("");
  }

  function chooseCategory(next: { id: string; name: string; unitFamily: UnitFamily }) {
    setCategoryName(next.name);
    setNewFamily(next.unitFamily);
    setCategoryOpen(false);
    keepPackOrDefault(next.id, next.unitFamily);
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
      keepPackOrDefault(next.id, next.unitFamily);
      return;
    }
    if (wasKnown) {
      setNewFamily("mass");
      setUnit("");
      setQuantity("");
    }
  }

  function shoot() {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        void useShot(blob);
      }
    }, "image/jpeg");
  }

  function retake() {
    shotRef.current += 1;
    setReading(false);
    setPhase("shoot");
    setDraftId("");
    setCategoryName("");
    setNewFamily("mass");
    setCategoryOpen(false);
    setPrice("");
    setPromotion("");
    setQuantity("");
    setUnit("");
    setComment("");
  }

  async function save() {
    if (!trimmedName || !family || !paidPence || !selectedUnit || promotionPrice === undefined) {
      return;
    }
    const result = await props.commit(
      saveObservation(props.book, {
        name: trimmedName,
        unitFamily: family,
        visitId: joining?.id,
        date,
        shopId,
        paidPence,
        promotionPricePence: promotionPrice,
        quantity: Number(quantity),
        unit: selectedUnit,
        comment,
      }),
    );
    if (!result.ok) {
      return;
    }
    props.onVisit(result.value.visitId);
    setDraftId("");
    retake();
  }

  if (phase === "confirm") {
    return (
      <>
        <h1>Confirm tag</h1>
        {reading ? <p className="muted">Reading the tag…</p> : null}
        {current ? (
          <p>
            {shopName(props.book, current.shopId)} · {showDate(current.date)}
          </p>
        ) : (
          <label>
            <span>Add to a draft</span>
            <select value={draftId} onChange={(event) => setDraftId(event.target.value)}>
              <option value="">New visit</option>
              {props.book.drafts().map((visit) => (
                <option key={visit.id} value={visit.id}>
                  {showDate(visit.date)} · {shopName(props.book, visit.shopId)}
                </option>
              ))}
            </select>
          </label>
        )}
        {joining ? null : (
          <>
            <label>
              <span>Date</span>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
            <label>
              <span>Shop</span>
              <select value={shopId} onChange={(event) => setShopId(event.target.value)}>
                {props.book.shopChoices().map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
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
            <select
              value={newFamily}
              onChange={(event) => {
                const nextFamily = event.target.value as UnitFamily;
                setNewFamily(nextFamily);
                if (!unitsFor(nextFamily).includes(unit as (typeof units)[number])) {
                  setUnit("");
                }
              }}
            >
              <option value="count">per item</option>
              <option value="volume">per litre</option>
              <option value="mass">per kilogram</option>
            </select>
          </label>
        ) : null}
        <label>
          <span>Pack price (£)</span>
          <input inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} />
        </label>
        <label>
          <span>Quantity</span>
          <input inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
        </label>
        <div className="units">
          {units.map((choice) => (
            <button key={choice} type="button" aria-pressed={choice === selectedUnit} onClick={() => setUnit(choice)}>
              {choice}
            </button>
          ))}
        </div>
        <label>
          <span>Promotion price (£)</span>
          <input inputMode="decimal" value={promotion} onChange={(event) => setPromotion(event.target.value)} />
        </label>
        <label>
          <span>Comment</span>
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} />
        </label>
        <p>{quote ? `Unit price ${quote}` : "Enter a price and quantity to see the unit price."}</p>
        <button
          type="button"
          disabled={!paidPence || !(Number(quantity) > 0) || !trimmedName || !selectedUnit || promotionPrice === undefined}
          onClick={() => void save()}
        >
          Save
        </button>
        <button type="button" className="secondary" onClick={retake}>
          Retake
        </button>
      </>
    );
  }

  return (
    <>
      <h1>Camera</h1>
      {current ? (
        <p>
          Next tag joins {shopName(props.book, current.shopId)} · {showDate(current.date)}
        </p>
      ) : (
        <p className="muted">The first tag starts the visit.</p>
      )}
      <video ref={videoRef} autoPlay playsInline muted />
      {cameraState === "ready" ? (
        <button type="button" onClick={shoot}>
          Take photo
        </button>
      ) : null}
      {cameraState === "unavailable" ? (
        <>
          <p className="muted">The camera is unavailable. Choose a photo of the tag instead.</p>
          <label>
            <span>Photo of the tag</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) {
                  void useShot(file);
                }
              }}
            />
          </label>
        </>
      ) : null}
      {current ? (
        <button
          type="button"
          onClick={() => {
            void props.commit(props.book.completeVisit(current.id)).then(async (result) => {
              if (result.ok) {
                props.onVisit(undefined);
              }
            });
          }}
        >
          Complete visit
        </button>
      ) : null}
    </>
  );
}

const tabs = [
  { name: "home", label: "Home" },
  { name: "statistics", label: "Statistics" },
  { name: "camera", label: "Camera" },
  { name: "categories", label: "Categories" },
  { name: "shops", label: "Shops" },
  { name: "backup", label: "Backup" },
] as const;

function tabFor(screen: Screen): (typeof tabs)[number]["name"] {
  if (
    screen.name === "statistics" ||
    screen.name === "camera" ||
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
  if (props.name === "camera") {
    return (
      <svg {...common}>
        <path d="M4 8h3l2-2h6l2 2h3v11H4z" />
        <circle cx="12" cy="13" r="3" />
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
                {category?.name ?? "Category"} · {showMoney(observation.paidPence)}
                {observation.promotionPricePence ? ` · offer ${showMoney(observation.promotionPricePence)}` : ""} ·{" "}
                {props.book.displayUnitPrice(observation.id)}
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" onClick={props.onAdd}>
        Add observation
      </button>
      {visit.status === "draft" ? (
        <button
          type="button"
          onClick={() => {
            void props.commit(props.book.completeVisit(visit.id)).then(async (completed) => {
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
  const [promotion, setPromotion] = useState(
    existing?.promotionPricePence ? (existing.promotionPricePence / 100).toFixed(2) : "",
  );
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
  const promotionPrice = readPromotion(promotion);
  const quote =
    trimmedName && paidPence && Number(quantity) > 0 && promotionPrice !== undefined
      ? quoteUnitPrice({
          unitFamily: family,
          paidPence,
          promotionPricePence: promotionPrice ?? undefined,
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
    if (promotionPrice === undefined) {
      return;
    }
    const result = await props.commit(
      saveObservation(props.book, {
        name: trimmedName,
        unitFamily: family,
        visitId: props.visitId,
        observationId: existing?.id,
        paidPence: paidPence ?? 0,
        quantity: Number(quantity),
        unit: selectedUnit,
        promotionPricePence: promotionPrice,
        comment,
      }),
    );
    if (!result.ok) {
      return;
    }
    if (andAnother && !existing) {
      setPrice("");
      setPromotion("");
      setComment("");
      const categoryId = result.book.observations().find((item) => item.id === result.value.observationId)
        ?.categoryId;
      const fresh = categoryId ? result.book.entryDefault(categoryId) : undefined;
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
        <span>Pack price (£)</span>
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
        <span>Promotion price (£)</span>
        <input inputMode="decimal" value={promotion} onChange={(event) => setPromotion(event.target.value)} />
      </label>
      <label>
        <span>Comment</span>
        <textarea value={comment} onChange={(event) => setComment(event.target.value)} />
      </label>
      <p>{quote ? `Unit price ${quote}` : "Enter a price and quantity to see the unit price."}</p>
      <button type="button" disabled={promotionPrice === undefined} onClick={() => void save(false)}>
        Save
      </button>
      {existing ? null : (
        <button type="button" className="secondary" disabled={promotionPrice === undefined} onClick={() => void save(true)}>
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
            <th>Price</th>
            <th>Offer</th>
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
                </td>
                <td>{showMoney(point.paidPence)}</td>
                <td>{point.promotionPricePence ? showMoney(point.promotionPricePence) : ""}</td>
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

