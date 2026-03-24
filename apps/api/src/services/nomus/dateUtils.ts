export function parseBrDateTime(value: unknown): Date | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const [datePart, timePart] = normalized.split(" ");
  const dateItems = datePart.split("/");

  if (dateItems.length !== 3) {
    return null;
  }

  const day = Number(dateItems[0]);
  const month = Number(dateItems[1]);
  const year = Number(dateItems[2]);

  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return null;
  }

  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (timePart) {
    const timeItems = timePart.split(":");
    hours = Number(timeItems[0] ?? 0);
    minutes = Number(timeItems[1] ?? 0);
    seconds = Number(timeItems[2] ?? 0);
  }

  const parsed = new Date(year, month - 1, day, hours, minutes, seconds);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function parseCurrencyPtBr(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== "string") {
    return 0;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  const normalized = trimmed.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatPeriodoPtBr(date: Date): string {
  const formatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
  const formatted = formatter.format(date).replace(" de ", " ");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function diffDays(start: Date, end: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
}
