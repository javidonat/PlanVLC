import { Session } from "../models/index.js";

// El repositorio es la única capa que habla con MongoDB directamente

// Cambia el id del plan por sus datos básicos (como un JOIN de SQL)
const POPULATE = [{ path: "planId", select: "title slug status isActive" }];

// Disponibilidad del listado del panel → condición de MongoDB
const STATE_FILTERS = {
  active: { isActive: true, deletedAt: null },
  inactive: { isActive: false, deletedAt: null },
  deleted: { deletedAt: { $ne: null } },
};

// Escapa los caracteres especiales para que la búsqueda sea texto literal y no una expresión regular
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Órdenes del listado (schemas/sessions.schema.js → SESSION_SORTS). _id desempata para que la paginación sea estable
const SORTS = {
  date: { startDateTime: 1, _id: 1 },
  date_desc: { startDateTime: -1, _id: -1 },
  recent: { createdAt: -1, _id: -1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: -1 },
};

// Query dinámica del listado: solo añade las condiciones de los filtros que lleguen.
// search: el SKU contiene el texto o la sesión es de uno de searchPlanIds (planes cuyo título lo contiene).
// from/to: sesiones que empiezan en ese rango (vista calendario)
const buildListFilter = ({ search, searchPlanIds = [], status, state, plan, from, to }) => {
  const filter = { ...(state && STATE_FILTERS[state]) };
  if (status) filter.status = status;
  if (plan) filter.planId = plan;
  if (search) filter.$or = [{ sku: { $regex: escapeRegex(search), $options: "i" } }, { planId: { $in: searchPlanIds } }];
  if (from && to) filter.startDateTime = { $gte: from, $lt: to };
  return filter;
};

// TODAS (sin filtros) o las que cumplan los filtros, ordenadas. Con page y limit, solo esa página
const findAll = async ({ sort = "date", page, limit, ...filters } = {}) => {
  const filter = buildListFilter(filters);
  const query = Session.find(filter).populate(POPULATE).sort(SORTS[sort]).lean();
  if (!page) return { items: await query, total: null };
  const [items, total] = await Promise.all([query.skip((page - 1) * limit).limit(limit), Session.countDocuments(filter)]);
  return { items, total };
};

// SOLO ACTIVAS
const findActive = () => {
  return Session.find({ isActive: true }).populate(POPULATE).sort({ startDateTime: 1 }).lean();
};

// SOLO ELIMINADAS (soft delete)
const findDeleted = () => {
  return Session.find({ deletedAt: { $ne: null } }).populate(POPULATE).sort({ startDateTime: 1 }).lean();
};

const findById = (id) => {
  return Session.findOne({ _id: id, isActive: true }).populate(POPULATE).lean();
};

// Sesiones que cuentan para el precio y la próxima fecha del plan:
// activas, no eliminadas, no canceladas y que todavía no han empezado
const findUpcomingByPlan = (planId) => {
  return Session.find({
    planId,
    isActive: true,
    deletedAt: null,
    status: { $ne: "cancelled" },
    startDateTime: { $gte: new Date() },
  })
    .select("price startDateTime")
    .lean();
};

// Crea una sesión (Mongoose valida los campos según el modelo y aplica los valores por defecto)
const create = async (data) => {
  const session = await Session.create(data);
  return session.populate(POPULATE);
};

const update = (id, data) => {
  return Session.findOneAndUpdate({ _id: id, isActive: true, deletedAt: null }, data, {
    new: true,
    runValidators: true,
  })
    .populate(POPULATE)
    .lean();
};

// SOFT DELETE: no se borra el documento, se desactiva y se marca la fecha.
// Solo afecta a sesiones aún no eliminadas (deletedAt: null), así la fecha original nunca se pisa
const softDelete = (id) => {
  return Session.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { isActive: false, deletedAt: new Date() },
    { new: true }
  )
    .populate(POPULATE)
    .lean();
};

// Para activar/desactivar: no filtra por isActive (hay que poder reactivar una sesión desactivada),
// pero SÍ por deletedAt: una sesión eliminada no se puede reactivar nunca
const setActive = (id, data) => {
  return Session.findOneAndUpdate({ _id: id, deletedAt: null }, data, { new: true }).populate(POPULATE).lean();
};

// ¿Existe la sesión, esté activa, desactivada o eliminada?
const existsById = async (id) => {
  return Boolean(await Session.exists({ _id: id }));
};

// ¿Cuántas sesiones no eliminadas tiene este plan? (para no dejar sesiones de un plan borrado).
// Con onlyActive solo cuenta las activas (para no dejar sesiones activas de un plan desactivado)
const countByPlan = (planId, onlyActive = false) => {
  return Session.countDocuments({ planId, deletedAt: null, ...(onlyActive && { isActive: true }) });
};

// ¿Existe ya otra sesión con ese SKU? Cuenta también las desactivadas y eliminadas,
// porque el índice único de MongoDB las incluye
const skuExists = async (sku, excludeId) => {
  const filter = { sku };
  if (excludeId) filter._id = { $ne: excludeId };
  return Boolean(await Session.exists(filter));
};

// Sin filtrar por isActive (como en imágenes): para comprobar sus relaciones antes de activarla
const findAnyById = (id) => {
  return Session.findOne({ _id: id, deletedAt: null }).lean();
};

export default {
  findAll, findActive, findDeleted, findById, findUpcomingByPlan, create, update, softDelete, setActive, existsById, skuExists, countByPlan, findAnyById,
};
