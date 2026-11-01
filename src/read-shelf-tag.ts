import { poundsToPence, type EnteredUnit } from "./staple-price-watch";

export type TagRead = {
  name?: string;
  paidPence?: number;
  promotionPricePence?: number;
  quantity?: number;
  unit?: EnteredUnit;
};

function pence(pounds: string, fraction: string | undefined): number {
  const written = fraction === undefined ? pounds : `${pounds}.${fraction}`;
  return poundsToPence(written) ?? 0;
}

function unitFrom(token: string): EnteredUnit {
  const lower = token.toLowerCase();
  if (lower === "kg") {
    return "kg";
  }
  if (lower === "g") {
    return "g";
  }
  if (lower === "ml") {
    return "ml";
  }
  if (lower === "l" || lower.startsWith("litre")) {
    return "L";
  }
  return "item";
}

const amount = "(\\d+)(?:\\s*[.,·•∙⋅．]\\s*(\\d{1,3}))?(?!\\d)";

function moneyPatterns(): { rates: RegExp; leading: RegExp; trailing: RegExp } {
  return {
    rates: new RegExp(`£\\s*${amount}\\s*(?:\\/|per)\\s*(?:100\\s*g|kg|g|ml|litres?|l)\\b`, "gi"),
    leading: new RegExp(`£\\s*${amount}`, "gi"),
    trailing: new RegExp(`${amount}\\s*£`, "gi"),
  };
}

function packPrices(source: string): number[] {
  const { rates, leading, trailing } = moneyPatterns();
  const rateSpans = [...source.matchAll(rates)].map(
    (match) => [match.index ?? 0, (match.index ?? 0) + match[0].length] as const,
  );
  const found = [...source.matchAll(leading), ...source.matchAll(trailing)].flatMap((match) => {
    const at = match.index ?? 0;
    if (rateSpans.some(([start, end]) => at >= start && at < end)) {
      return [];
    }
    const price = pence(match[1] ?? "0", match[2]);
    return price >= 1 ? [price] : [];
  });
  return [...new Set(found)];
}

function productLabel(text: string): string {
  const { rates, leading, trailing } = moneyPatterns();
  return text
    .replace(rates, " ")
    .replace(leading, " ")
    .replace(trailing, " ")
    .replace(/\d+(?:[.,]\d+)?\s*(kg|g|ml|l|litres?|packs?)\b/gi, " ")
    .replace(/\b(?:for|each|was|now|per|or|offer)\b/gi, " ")
    .replace(/[^A-Za-z&'’\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchCategoryName(text: string, names: readonly string[]): string | undefined {
  const hits = names.filter((name) => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      return false;
    }
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:^|[^A-Za-z0-9])${escaped}(?:$|[^A-Za-z0-9])`, "i").test(text);
  });
  hits.sort((left, right) => right.length - left.length);
  return hits[0];
}

function finish(read: TagRead, source: string, categoryNames: readonly string[]): TagRead {
  const label = productLabel(source);
  const matched = matchCategoryName(source, categoryNames);
  const name = matched ?? (label || undefined);
  if (name === undefined) {
    return read;
  }
  return { ...read, name };
}

function closeCurrencyGap(text: string): string {
  return text.replace(/£\s+(?=\d)/g, "£").replace(/(\d)\s+(?=£)/g, "$1");
}

export function readShelfTag(text: string, categoryNames: readonly string[] = []): TagRead {
  const source = closeCurrencyGap(text.replace(/\s+/g, " ").trim());
  const prices = packPrices(source);
  const multibuy = source.match(/(\d+)\s*for\s*£\s*(\d+)(?:[.,](\d{1,2}))?/i);
  const each = source.match(new RegExp(`£\\s*${amount}\\s*each\\b`, "i"));
  const sizes = [...source.matchAll(/(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|litres?|packs?)\b/gi)];
  const perKilogram = source.match(new RegExp(`£\\s*${amount}\\s*(?:\\/|per)\\s*kg\\b`, "i"));
  const competing = Boolean(multibuy && each) || sizes.length >= 2;
  if (competing) {
    return finish({}, source, categoryNames);
  }

  let quantity: number | undefined;
  let unit: EnteredUnit | undefined;
  if (multibuy) {
    quantity = Number(multibuy[1]);
    unit = "item";
  } else if (each) {
    quantity = 1;
    unit = "item";
  } else if (sizes[0]) {
    quantity = Number((sizes[0][1] ?? "").replace(",", "."));
    unit = unitFrom(sizes[0][2] ?? "");
  } else if (perKilogram && prices.length === 0) {
    return finish(
      {
        paidPence: pence(perKilogram[1] ?? "0", perKilogram[2]),
        quantity: 1,
        unit: "kg",
      },
      source,
      categoryNames,
    );
  }

  if (prices.length === 0) {
    return finish({ quantity, unit }, source, categoryNames);
  }
  const high = Math.max(...prices);
  const low = Math.min(...prices);
  if (prices.length >= 2 && low < high) {
    return finish(
      { paidPence: high, promotionPricePence: low, quantity, unit },
      source,
      categoryNames,
    );
  }
  return finish({ paidPence: high, quantity, unit }, source, categoryNames);
}
