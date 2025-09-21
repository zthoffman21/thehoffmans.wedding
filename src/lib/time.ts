export const NY_TZ = "America/New_York";

export function formatNYDateTime(input: string | number | Date) {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: NY_TZ,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(input));
}

export function formatNYDate(input: string | number | Date) {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: NY_TZ,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(input));
}
