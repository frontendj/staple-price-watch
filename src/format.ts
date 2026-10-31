export function showDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) {
    return iso;
  }
  return `${day}/${month}/${year}`;
}

export function showMoney(pence: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

export function poundsToPence(text: string): number | undefined {
  const trimmed = text.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return undefined;
  }
  const [whole, fraction = ""] = trimmed.split(".");
  const digits = fraction.padEnd(3, "0");
  let pennies = Number(digits.slice(0, 2));
  if (Number(digits[2] ?? "0") >= 5) {
    pennies += 1;
  }
  let pounds = Number(whole);
  if (pennies >= 100) {
    pounds += Math.floor(pennies / 100);
    pennies %= 100;
  }
  return pounds * 100 + pennies;
}

export function localToday(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function monthLabel(month: string): string {
  const [year, raw] = month.split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const name = names[Number(raw) - 1];
  return name && year ? `${name} ${year}` : month;
}
