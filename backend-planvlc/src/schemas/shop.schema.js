import { z } from "zod";

// Esquemas de validación de la tienda pública (Zod).
// Los query params llegan siempre como texto: los números se convierten aquí.

// slug de la URL (minúsculas, números y guiones: ?category=tardeo)
const slug = (invalid) => z.string({ error: invalid }).trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, invalid).max(200, invalid);

// Uno o varios slugs: ?category=tardeo,concierto (o ?category=tardeo&category=concierto).
// Llega como lista sin repetidos
const slugList = (invalid) => z.preprocess(
  (value) => (value === undefined ? undefined : [value].flat().flatMap((v) => String(v).split(",")).filter((v) => v.trim() !== "")),
  z.array(slug(invalid)).max(20, invalid).transform((slugs) => [...new Set(slugs)])
);

// Número entero positivo que llega como texto en la URL (?page=2)
const positiveInt = (invalid) => z.coerce.number({ error: invalid }).int(invalid).min(1, invalid);

// Órdenes del listado (ver SORTS en repos/shop.repo.js). Por defecto, los más visitados
export const SHOP_SORTS = ["popular", "recent", "date", "price_asc", "price_desc", "name"];

// Precio en euros que llega como texto en la URL (?minPrice=10)
const price = (invalid) => z.coerce.number({ error: invalid }).min(0, invalid).max(100000, invalid);

// Filtros comunes del listado y del calendario.
// Todos son opcionales: la consulta solo filtra por los que lleguen.
// category, organizer y venue son slugs (es lo que ve el cliente en la URL), no ids.
// Se pueden elegir varios de cada (separados por comas): vale cualquiera de ellos
const filtersShape = {
  category: slugList("La categoría no es válida").optional(),
  organizer: slugList("El organizador no es válido").optional(),
  venue: slugList("El lugar no es válido").optional(),
  minPrice: price("El precio mínimo debe ser un número mayor o igual que 0").optional(),
  maxPrice: price("El precio máximo debe ser un número mayor o igual que 0").optional(),
  search: z.string({ error: "La búsqueda debe ser un texto" }).trim().max(100, "La búsqueda no puede superar los 100 caracteres").optional(),
};

const validPriceRange = [
  (q) => q.minPrice === undefined || q.maxPrice === undefined || q.minPrice <= q.maxPrice,
  { error: "El precio mínimo no puede ser mayor que el máximo", path: ["minPrice"] },
];

// GET /api/shop/plans?category=&organizer=&venue=&minPrice=&maxPrice=&search=&sort=&page=&limit=
export const shopPlansQuerySchema = z.object({
  ...filtersShape,
  sort: z.enum(SHOP_SORTS, { error: `El orden debe ser uno de: ${SHOP_SORTS.join(", ")}` }).optional(),
  page: positiveInt("La página debe ser un número mayor que 0").optional(),
  limit: positiveInt("El límite debe ser un número mayor que 0").max(50, "El límite no puede ser mayor que 50").optional(),
}).refine(...validPriceRange);

// GET /api/shop/sessions?month=2027-10&category=...: sesiones de un mes para el calendario.
// Sin month, el del primer plan que viene (o el mes actual si no hay ninguno)
export const shopSessionsQuerySchema = z.object({
  ...filtersShape,
  month: z.string({ error: "El mes no es válido" }).regex(/^\d{4}-(0[1-9]|1[0-2])$/, "El mes debe tener el formato AAAA-MM").optional(),
}).refine(...validPriceRange);

// GET /api/shop/plans/:slug y /api/shop/plans/:slug/sessions
export const slugParamsSchema = z.object({
  slug: z.string({ error: "El slug no es válido" }).trim().min(1, "El slug es obligatorio").max(200, "El slug no es válido"),
});
