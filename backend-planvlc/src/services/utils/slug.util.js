import slugify from "slugify";

export const generateSlug = (value) => {
  return slugify(value, {
    lower: true,
    strict: true,
    trim: true,
  });
};

// ---- Slugs únicos (los usan las colecciones con slug: categorías, organizadores...) ----

// ¿Este slug ya corresponde a ese texto? (el base o el base con sufijo: "fiesta" / "fiesta-2")
// Sirve para no cambiar el slug al editar sin cambiar el nombre
export const slugMatchesText = (slug, text, fallback) => {
  const base = generateSlug(text) || fallback;
  return slug === base || new RegExp(`^${base}-\\d+$`).test(slug);
};

// El índice único de MongoDB rechaza un slug repetido con el error 11000
const isDuplicateSlug = (error) =>
  error?.code === 11000 && (error.keyPattern?.slug !== undefined || error.keyValue?.slug !== undefined);

// Calcula un slug único a partir del texto (añade -1, -2... si ya existe) y ejecuta save(slug).
// slugExists(slug, excludeId) lo da el repositorio de cada colección. Si otra petición simultánea
// se queda con el mismo slug, el índice único lo rechaza: se recalcula y se reintenta (máx. 3 veces).
export const saveWithUniqueSlug = async ({ text, fallback, excludeId, slugExists, save }) => {
  for (let attempt = 1; ; attempt += 1) {
    const base = generateSlug(text) || fallback;
    let slug = base;
    for (let suffix = 1; await slugExists(slug, excludeId); suffix += 1) slug = `${base}-${suffix}`;
    try {
      return await save(slug);
    } catch (error) {
      if (!isDuplicateSlug(error) || attempt >= 3) throw error;
    }
  }
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
