import slugify from "slugify";

export const generateSlug = (value) => {
  return slugify(value, {
    lower: true,
    strict: true,
    trim: true,
  });
};

// SKU de una sesión (la "variante" del plan): slug del plan + fecha y hora de inicio en hora de Valencia.
// Ej.: generateSku("tardeo-ruzafa", new Date("2025-10-12T17:00:00+02:00")) → "TARDEO-RUZAFA-20251012-1700"
export const generateSku = (planSlug, startDateTime) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(startDateTime))
      .map((part) => [part.type, part.value])
  );
  return `${planSlug}-${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}`.toUpperCase();
};
