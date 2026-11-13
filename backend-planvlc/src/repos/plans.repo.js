import { Plan } from "../models/index.js";

// El repositorio es la única capa que habla con MongoDB directamente

// Cambia los ids de las relaciones por sus datos básicos (como un JOIN de SQL)
const POPULATE = [
  { path: "categoryIds", select: "name slug" },
  { path: "organizerId", select: "name slug" },
  { path: "venueId", select: "name city neighborhood" },
  // Virtuals: las imágenes se buscan en "images" por entityId (hay que seleccionarlo para poder emparejarlas)
  { path: "coverImage", select: "url alt entityId" },
  { path: "galleryImages", select: "url alt position entityId" },
];

// Disponibilidad del listado del panel → condición de MongoDB
const STATE_FILTERS = {
  active: { isActive: true, deletedAt: null },
  inactive: { isActive: false, deletedAt: null },
  deleted: { deletedAt: { $ne: null } },
};

// Escapa los caracteres especiales para que la búsqueda sea texto literal y no una expresión regular
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Órdenes del listado (schemas/plans.schema.js → PLAN_SORTS). _id desempata para que la paginación sea estable
const SORTS = {
  date: { nextSessionAt: 1, _id: 1 },
  recent: { createdAt: -1, _id: -1 },
  title: { title: 1, _id: 1 },
  price_asc: { priceFrom: 1, _id: 1 },
  price_desc: { priceFrom: -1, _id: -1 },
  popular: { views: -1, _id: -1 },
};

// Query dinámica del listado: solo añade las condiciones de los filtros que lleguen
const buildListFilter = ({ search, status, state, category, organizer, venue }) => {
  const filter = { ...(state && STATE_FILTERS[state]) };
  if (status) filter.status = status;
  if (category) filter.categoryIds = category;
  if (organizer) filter.organizerId = organizer;
  if (venue) filter.venueId = venue;
  if (search) filter.title = { $regex: escapeRegex(search), $options: "i" };
  return filter;
};

// TODOS (sin filtros) o los que cumplan los filtros, ordenados. Con page y limit, solo esa página
const findAll = async ({ sort = "date", page, limit, ...filters } = {}) => {
  const filter = buildListFilter(filters);
  const query = Plan.find(filter).populate(POPULATE).sort(SORTS[sort]).lean();
  if (sort === "title") query.collation({ locale: "es" }); // orden alfabético en español
  if (!page) return { items: await query, total: null };
  const [items, total] = await Promise.all([query.skip((page - 1) * limit).limit(limit), Plan.countDocuments(filter)]);
  return { items, total };
};

// SOLO ACTIVOS
const findActive = () => {
  return Plan.find({ isActive: true }).populate(POPULATE).sort({ nextSessionAt: 1 }).lean();
};

// SOLO ELIMINADOS (soft delete)
const findDeleted = () => {
  return Plan.find({ deletedAt: { $ne: null } }).populate(POPULATE).sort({ nextSessionAt: 1 }).lean();
};

const findById = (id) => {
  return Plan.findOne({ _id: id, isActive: true }).populate(POPULATE).lean();
};

const findBySlug = (slug) => {
  return Plan.findOne({ slug, isActive: true }).populate(POPULATE).lean();
};

// Crea un plan (Mongoose valida los campos según el modelo y aplica los valores por defecto)
const create = async (data) => {
  const plan = await Plan.create(data);
  return plan.populate(POPULATE);
};

const update = (id, data) => {
  return Plan.findOneAndUpdate({ _id: id, isActive: true, deletedAt: null }, data, {
    new: true,
    runValidators: true,
  })
    .populate(POPULATE)
    .lean();
};

// SOFT DELETE: no se borra el documento, se desactiva y se marca la fecha.
// Solo afecta a planes aún no eliminados (deletedAt: null), así la fecha original nunca se pisa
const softDelete = (id) => {
  return Plan.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { isActive: false, deletedAt: new Date() },
    { new: true }
  )
    .populate(POPULATE)
    .lean();
};

// Para activar/desactivar: no filtra por isActive (hay que poder reactivar un plan desactivado),
// pero SÍ por deletedAt: un plan eliminado no se puede reactivar nunca
const setActive = (id, data) => {
  return Plan.findOneAndUpdate({ _id: id, deletedAt: null }, data, { new: true }).populate(POPULATE).lean();
};

// ¿Existe el plan, esté activo, desactivado o eliminado?
const existsById = async (id) => {
  return Boolean(await Plan.exists({ _id: id }));
};

// ¿Existe ya otro plan con ese slug? Cuenta también los desactivados,
// porque el índice único de MongoDB los incluye
const slugExists = async (slug, excludeId) => {
  const filter = { slug };
  if (excludeId) filter._id = { $ne: excludeId };
  return Boolean(await Plan.exists(filter));
};

// ¿Cuántos planes no eliminados usan esta categoría? (para no dejar planes con categorías borradas).
// Con onlyActive solo cuenta los activos (para no dejar planes activos con una categoría desactivada).
// Igual en countByVenue y countByOrganizer
const countByCategory = (categoryId, onlyActive = false) => {
  return Plan.countDocuments({ categoryIds: categoryId, deletedAt: null, ...(onlyActive && { isActive: true }) });
};

// ¿Cuántos planes no eliminados se celebran en este lugar? (para no dejar planes con un lugar borrado)
const countByVenue = (venueId, onlyActive = false) => {
  return Plan.countDocuments({ venueId, deletedAt: null, ...(onlyActive && { isActive: true }) });
};

// ¿Cuántos planes no eliminados tiene este organizador? (para no dejar planes con un organizador borrado)
const countByOrganizer = (organizerId, onlyActive = false) => {
  return Plan.countDocuments({ organizerId, deletedAt: null, ...(onlyActive && { isActive: true }) });
};

// Plan no eliminado (activo o desactivado), solo con su slug, isActive, status y el aforo de su lugar:
// lo usan las sesiones para generar el SKU, para comprobar que el aforo no supera el del lugar
// y para no tener sesiones activas de un plan desactivado
const findSlugById = (id) => {
  return Plan.findOne({ _id: id, deletedAt: null })
    .select("slug venueId isActive status")
    .populate({ path: "venueId", select: "capacity" })
    .lean();
};

// Guarda los datos derivados de las sesiones (precio mínimo y próxima fecha)
const updateDerived = (id, data) => {
  return Plan.updateOne({ _id: id }, data);
};

// Sin filtrar por isActive (como en imágenes): para comprobar sus relaciones antes de activarlo
const findAnyById = (id) => {
  return Plan.findOne({ _id: id, deletedAt: null }).lean();
};

export default {
  countByCategory,
  countByVenue,
  countByOrganizer,
  findSlugById,
  findAnyById,
  updateDerived,
  findAll, findActive, findDeleted, findById, findBySlug, create, update, softDelete, setActive, existsById, slugExists,
};
