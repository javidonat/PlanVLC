import { Category, Organizer, Venue, Plan, Session } from "../models/index.js";

// Consultas de la tienda pública. Solo devuelve lo que se puede enseñar:
// activo, no eliminado y publicado (o en un estado que se pueda mostrar)

// Planes visibles en la tienda (usa los índices de models/plan.model.js)
const VISIBLE_PLAN = { status: "published", isActive: true, deletedAt: null };

// Datos de las relaciones y las imágenes que pintan las cards y el detalle
const PLAN_POPULATE = [
  { path: "categoryIds", select: "name slug" },
  { path: "organizerId", select: "name slug" },
  { path: "venueId", select: "name slug address city neighborhood" },
  { path: "coverImage", select: "url alt entityId" },
];
const PLAN_DETAIL_POPULATE = [...PLAN_POPULATE, { path: "galleryImages", select: "url alt position entityId" }];

// ---------- Carruseles y filtros ----------

const findCategories = () => {
  return Category.find({ status: "published", isActive: true, deletedAt: null })
    .select("name slug icon group")
    .populate({ path: "coverImage", select: "url alt entityId" })
    .sort({ name: 1 })
    .lean();
};

// Los organizadores suspendidos no se muestran (tampoco pueden tener planes nuevos)
const findOrganizers = () => {
  return Organizer.find({ status: { $ne: "suspended" }, isActive: true, deletedAt: null })
    .select("name slug type description")
    .populate({ path: "logo", select: "url alt entityId" })
    .sort({ name: 1 })
    .lean();
};

// Los lugares cerrados definitivamente no se muestran
const findVenues = () => {
  return Venue.find({ status: { $ne: "permanently_closed" }, isActive: true, deletedAt: null })
    .select("name slug city neighborhood")
    .populate({ path: "coverImage", select: "url alt entityId" })
    .sort({ name: 1 })
    .lean();
};

// ---------- Listado de planes (filtros + búsqueda + paginación) ----------

// Slugs de la URL → lista de _id. Solo los que se pueden mostrar en la tienda (los demás no salen).
// Usan el índice único de slug
const findCategoryIdsBySlugs = (slugs) => {
  return Category.distinct("_id", { slug: { $in: slugs }, status: "published", isActive: true, deletedAt: null });
};

const findOrganizerIdsBySlugs = (slugs) => {
  return Organizer.distinct("_id", { slug: { $in: slugs }, status: { $ne: "suspended" }, isActive: true, deletedAt: null });
};

const findVenueIdsBySlugs = (slugs) => {
  return Venue.distinct("_id", { slug: { $in: slugs }, status: { $ne: "permanently_closed" }, isActive: true, deletedAt: null });
};

// Escapa los caracteres especiales para que la búsqueda sea texto literal y no una expresión regular
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Query dinámica: parte de los planes visibles y solo añade las condiciones de los filtros que lleguen
// (category, organizer y venue ya llegan como listas de _id: el servicio traduce los slugs).
// Dentro de un mismo filtro vale cualquiera ($in); entre filtros distintos, todos a la vez
const buildPlansFilter = ({ category, organizer, venue, minPrice, maxPrice, search }) => {
  const filter = { ...VISIBLE_PLAN };
  if (category) filter.categoryIds = { $in: category }; // el plan tiene alguna de esas categorías
  if (organizer) filter.organizerId = { $in: organizer };
  if (venue) filter.venueId = { $in: venue };
  // Precio "desde" del plan (el de su sesión más barata) dentro del rango
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.priceFrom = {};
    if (minPrice !== undefined) filter.priceFrom.$gte = minPrice;
    if (maxPrice !== undefined) filter.priceFrom.$lte = maxPrice;
  }
  if (search) filter.title = { $regex: escapeRegex(search), $options: "i" }; // contiene el texto, sin distinguir mayúsculas
  return filter;
};

// Órdenes del listado. _id al final para que el orden sea siempre el mismo (la paginación no repite ni salta planes)
const SORTS = {
  popular: { views: -1, createdAt: -1, _id: -1 }, // más visitados
  recent: { createdAt: -1, _id: -1 }, // más nuevos
  date: { nextSessionAt: 1, _id: 1 }, // fecha más próxima
  price_asc: { priceFrom: 1, _id: 1 },
  price_desc: { priceFrom: -1, _id: -1 },
  name: { title: 1, _id: 1 }, // alfabético (con collation "es": la ñ y los acentos van en su sitio)
};

// Una página de planes y el total (para calcular las páginas). Las dos consultas van en paralelo
const findPlans = async ({ page, limit, sort, ...filters }) => {
  const filter = buildPlansFilter(filters);
  const query = Plan.find(filter).populate(PLAN_POPULATE).sort(SORTS[sort]);
  // La collation solo para el orden alfabético: con otra collation MongoDB no puede usar los índices
  if (sort === "name") query.collation({ locale: "es" });
  const [items, total] = await Promise.all([
    query
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Plan.countDocuments(filter),
  ]);
  return { items, total };
};

// ---------- Calendario ----------

// Sesiones que se pueden elegir (publicadas, activas y que no han empezado)
const UPCOMING_SESSION = () => ({ status: "published", isActive: true, deletedAt: null, startDateTime: { $gte: new Date() } });

// _id de los planes visibles que cumplen los filtros
const findPlanIds = (filters) => Plan.distinct("_id", buildPlansFilter(filters));

// Sesiones de esos planes entre dos fechas, con lo justo del plan para pintarlas (usa el índice planId + startDateTime)
const findSessionsBetween = (planIds, from, to) => {
  const upcoming = UPCOMING_SESSION();
  const start = from > upcoming.startDateTime.$gte ? from : upcoming.startDateTime.$gte;
  return Session.find({ ...upcoming, planId: { $in: planIds }, startDateTime: { $gte: start, $lt: to } })
    .select("planId startDateTime endDateTime price currency stock")
    .populate({ path: "planId", select: "title slug" })
    .sort({ startDateTime: 1 })
    .lean();
};

// Fecha de la primera sesión que viene de esos planes (para abrir el calendario en su mes)
const findFirstUpcomingDate = async (planIds) => {
  const session = await Session.findOne({ ...UPCOMING_SESSION(), planId: { $in: planIds } })
    .select("startDateTime")
    .sort({ startDateTime: 1 })
    .lean();
  return session?.startDateTime ?? null;
};

// ---------- Detalle ----------

// Cada vez que alguien abre el detalle suma una visita (para el orden "más visitados")
const findPlanBySlugAndCountView = (slug) => {
  return Plan.findOneAndUpdate({ slug, ...VISIBLE_PLAN }, { $inc: { views: 1 } }, { new: true })
    .populate(PLAN_DETAIL_POPULATE)
    .lean();
};

// Solo el _id (las sesiones del detalle no cuentan como otra visita)
const findPlanIdBySlug = async (slug) => {
  const plan = await Plan.findOne({ slug, ...VISIBLE_PLAN }).select("_id").lean();
  return plan?._id ?? null;
};

// Sesiones (variantes) que se pueden elegir: publicadas, activas y que todavía no han empezado
const findUpcomingSessions = (planId) => {
  return Session.find({ ...UPCOMING_SESSION(), planId })
    .select("sku startDateTime endDateTime price currency capacity stock")
    .sort({ startDateTime: 1 })
    .lean();
};

export default {
  findCategories, findOrganizers, findVenues,
  findCategoryIdsBySlugs, findOrganizerIdsBySlugs, findVenueIdsBySlugs,
  findPlans, findPlanIds, findSessionsBetween, findFirstUpcomingDate,
  findPlanBySlugAndCountView, findPlanIdBySlug, findUpcomingSessions,
};
