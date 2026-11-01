import type { EnteredUnit } from "./staple-price-watch";

export type TagRead = {
  paidPence?: number;
  promotionPricePence?: number;
  quantity?: number;
  unit?: EnteredUnit;
};

function pence(pounds: string, fraction: string | undefined): number {
  const whole = Number(pounds);
  const digits = (fraction ?? "").padEnd(2, "0").slice(0, 2);
  return whole * 100 + Number(digits || "0");
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

function packPrices(source: string): number[] {
  const rates = [
    ...source.matchAll(/£\s*\d+(?:[.,]\d{1,2})?\s*(?:\/|per)\s*(?:100\s*g|kg|g|ml|litres?|l)\b/gi),
  ].map((match) => [match.index ?? 0, (match.index ?? 0) + match[0].length] as const);
  const found = [...source.matchAll(/£\s*(\d+)(?:[.,](\d{1,2}))?/gi)].flatMap((match) => {
    const at = match.index ?? 0;
    if (rates.some(([start, end]) => at >= start && at < end)) {
      return [];
    }
    const price = pence(match[1] ?? "0", match[2]);
    return price >= 1 ? [price] : [];
  });
  return [...new Set(found)];
}

export function readShelfTag(text: string): TagRead {
  const source = text.replace(/\s+/g, " ");
  const prices = packPrices(source);
  const multibuy = source.match(/(\d+)\s*for\s*£\s*(\d+)(?:[.,](\d{1,2}))?/i);
  const each = source.match(/£\s*(\d+)(?:[.,](\d{1,2}))?\s*each\b/i);
  const sizes = [...source.matchAll(/(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|litres?|packs?)\b/gi)];
  const perKilogram = source.match(/£\s*(\d+)(?:[.,](\d{1,2}))?\s*(?:\/|per)\s*kg\b/i);
  const competing = Boolean(multibuy && each) || sizes.length >= 2;
  if (competing) {
    return {};
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
    return {
      paidPence: pence(perKilogram[1] ?? "0", perKilogram[2]),
      quantity: 1,
      unit: "kg",
    };
  }

  if (prices.length === 0) {
    return { quantity, unit };
  }
  const high = Math.max(...prices);
  const low = Math.min(...prices);
  if (prices.length >= 2 && low < high) {
    return { paidPence: high, promotionPricePence: low, quantity, unit };
  }
  return { paidPence: high, quantity, unit };
}
