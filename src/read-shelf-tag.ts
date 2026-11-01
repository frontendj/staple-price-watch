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

export function readShelfTag(text: string): TagRead {
  const source = text.replace(/\s+/g, " ");
  const prices = [
    ...new Set(
      [...source.matchAll(/£\s*(\d+)(?:[.,](\d{1,2}))?/gi)].map((match) => pence(match[1] ?? "0", match[2])),
    ),
  ].filter((price) => price >= 1);
  const multibuy = source.match(/(\d+)\s*for\s*£\s*(\d+)(?:[.,](\d{1,2}))?/i);
  const each = source.match(/£\s*(\d+)(?:[.,](\d{1,2}))?\s*each\b/i);
  const sizes = [...source.matchAll(/(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|litres?|packs?)\b/gi)];
  const perKilogram = /£\s*\d+(?:[.,]\d{1,2})?\s*(?:\/|per)\s*kg\b/i.test(source);
  const twoPacks =
    Boolean(multibuy && (each || perKilogram || sizes.length > 0)) ||
    Boolean(each && (perKilogram || sizes.length > 0)) ||
    Boolean(perKilogram && sizes.length > 0) ||
    sizes.length >= 2;
  if (twoPacks) {
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
  } else if (perKilogram && prices.length >= 1) {
    quantity = 1;
    unit = "kg";
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
