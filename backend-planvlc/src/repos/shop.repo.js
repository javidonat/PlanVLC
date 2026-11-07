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

// Slug de la URL → _id. Solo si se puede mostrar en la tienda (si no, null). Usan el índice único de slug
const findCategoryIdBySlug = async (slug) => {
  const category = await Category.findOne({ slug, status: "published", isActive: true, deletedAt: null }).select("_id").lean();
  return category?._id ?? null;
};

const findOrganizerIdBySlug = async (slug) => {
  const organizer = await Organizer.findOne({ slug, status: { $ne: "suspended" }, isActive: true, deletedAt: null }).select("_id").lean();
  return organizer?._id ?? null;
};

const findVenueIdBySlug = async (slug) => {
  const venue = await Venue.findOne({ slug, status: { $ne: "permanently_closed" }, isActive: true, deletedAt: null }).select("_id").lean();
  return venue?._id ?? null;
};

// Escapa los caracteres especiales para que la búsqueda sea texto literal y no una expresión regular
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Query dinámica: parte de los planes visibles y solo añade las condiciones de los filtros que lleguen
// (category, organizer y venue ya llegan como _id: el servicio traduce los slugs)
const buildPlansFilter = ({ category, organizer, venue, minPrice, maxPrice, search }) => {
  const filter = { ...VISIBLE_PLAN };
  if (category) filter.categoryIds = category; // categoryIds es una lista: basta con que la contenga
  if (organizer) filter.organizerId = organizer;
  if (venue) filter.venueId = venue;
  // Precio "desde" del plan (el de su sesión más barata) dentro del rango
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.priceFrom = {};
    if (minPrice !== undefined) filter.priceFrom.$gte = minPrice;
    if (maxPrice !== undefined) filter.priceFrom.$lte = maxPrice;
  }
  if (search) filter.title = { $regex: escapeRegex(search), $options: "i" }; // contiene el texto, sin distinguir mayúsculas
  return filter;
};

// Una página de planes y el total (para calcular las páginas). Las dos consultas van en paralelo
const findPlans = async ({ page, limit, ...filters }) => {
  const filter = buildPlansFilter(filters);
  const [items, total] = await Promise.all([
    Plan.find(filter)
      .populate(PLAN_POPULATE)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Plan.countDocuments(filter),
  ]);
  return { items, total };
};

// ---------- Detalle ----------

const findPlanBySlug = (slug) => {
  return Plan.findOne({ slug, ...VISIBLE_PLAN }).populate(PLAN_DETAIL_POPULATE).lean();
};

// Sesiones (variantes) que se pueden elegir: publicadas, activas y que todavía no han empezado
const findUpcomingSessions = (planId) => {
  return Session.find({
    planId,
    status: "published",
    isActive: true,
    deletedAt: null,
    startDateTime: { $gte: new Date() },
  })
    .select("sku startDateTime endDateTime price currency capacity stock")
    .sort({ startDateTime: 1 })
    .lean();
};

export default {
  findCategories, findOrganizers, findVenues,
  findCategoryIdBySlug, findOrganizerIdBySlug, findVenueIdBySlug,
  findPlans, findPlanBySlug, findUpcomingSessions,
};
