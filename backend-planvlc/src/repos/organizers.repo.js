import { Organizer } from "../models/index.js";
import { STATE_FILTERS, contains, findList } from "./utils/list.util.js";

// El repositorio es la única capa que habla con MongoDB directamente

// Cambia los ids de los usuarios por sus datos básicos (como un JOIN de SQL).
// Virtual: el logo se busca en "images" por entityId (hay que seleccionarlo para poder emparejarlo)
const POPULATE = [
  { path: "userIds", select: "name email" },
  { path: "logo", select: "url alt entityId" },
];

// SOLO ACTIVOS (y no eliminados): son los que se pueden asignar a un plan.
// Solo los campos que necesita el formulario del plan (los mismos que el populate de plans.repo.js)
const findActive = () => {
  return Organizer.find({ isActive: true, deletedAt: null }).select("name slug").sort({ name: 1 }).lean();
};

// TODOS: sin ningún filtro
// Órdenes del listado (schemas/organizers.schema.js → ORGANIZER_SORTS). _id desempata para que la paginación sea estable
const SORTS = {
  name: { name: 1, _id: 1 },
  name_desc: { name: -1, _id: -1 },
  recent: { createdAt: -1, _id: -1 },
};

// Query dinámica del listado: solo añade las condiciones de los filtros que lleguen
const buildListFilter = ({ search, state, status, type }) => {
  const filter = { ...(state && STATE_FILTERS[state]) };
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (search) filter.name = contains(search);
  return filter;
};

// TODOS (sin filtros) o los que cumplan los filtros, ordenados (los nombres, en español). Con page y limit, solo esa página
const findAll = ({ sort = "name", page, limit, ...filters } = {}) => {
  return findList(Organizer, buildListFilter(filters), { sort: SORTS[sort], populate: POPULATE, page, limit, collation: { locale: "es" } });
};

// SOLO ELIMINADOS (soft delete)
const findDeleted = () => {
  return Organizer.find({ deletedAt: { $ne: null } }).populate(POPULATE).sort({ name: 1 }).lean();
};

const findById = (id) => {
  return Organizer.findOne({ _id: id, isActive: true }).populate(POPULATE).lean();
};

// Crea un organizador (Mongoose valida los campos según el modelo y aplica los valores por defecto)
const create = async (data) => {
  const organizer = await Organizer.create(data);
  return organizer.populate(POPULATE);
};

const update = (id, data) => {
  return Organizer.findOneAndUpdate({ _id: id, isActive: true, deletedAt: null }, data, {
    new: true,
    runValidators: true,
  })
    .populate(POPULATE)
    .lean();
};

// SOFT DELETE: no se borra el documento, se desactiva y se marca la fecha.
// Solo afecta a organizadores aún no eliminados (deletedAt: null), así la fecha original nunca se pisa
const softDelete = (id) => {
  return Organizer.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { isActive: false, deletedAt: new Date() },
    { new: true }
  )
    .populate(POPULATE)
    .lean();
};

// Para activar/desactivar: no filtra por isActive (hay que poder reactivar un organizador desactivado),
// pero SÍ por deletedAt: un organizador eliminado no se puede reactivar nunca
const setActive = (id, data) => {
  return Organizer.findOneAndUpdate({ _id: id, deletedAt: null }, data, { new: true }).populate(POPULATE).lean();
};

// ¿Existe el organizador, esté activo, desactivado o eliminado?
const existsById = async (id) => {
  return Boolean(await Organizer.exists({ _id: id }));
};

// ¿Existe ya otro organizador con ese slug? (también los desactivados y eliminados: el índice único los incluye)
const slugExists = async (slug, excludeId) => {
  const filter = { slug };
  if (excludeId) filter._id = { $ne: excludeId };
  return Boolean(await Organizer.exists(filter));
};

// ¿Cuántos organizadores no eliminados gestiona este usuario? (para no dejar organizadores con un usuario borrado).
// Con onlyActive solo cuenta los activos (para no dejar organizadores activos con un usuario desactivado)
const countByUser = (userId, onlyActive = false) => {
  return Organizer.countDocuments({ userIds: userId, deletedAt: null, ...(onlyActive && { isActive: true }) });
};

// Sin filtrar por isActive (como en imágenes): para comprobar sus relaciones antes de activarlo
const findAnyById = (id) => {
  return Organizer.findOne({ _id: id, deletedAt: null }).lean();
};

export default {
  countByUser,
  findAnyById,
  findActive, findAll, findDeleted, findById, create, update, softDelete, setActive, existsById, slugExists,
};
