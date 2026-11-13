import { User } from "../models/index.js";
import { STATE_FILTERS, contains, findList } from "./utils/list.util.js";

// El repositorio es la única capa que habla con MongoDB directamente
// passwordHash tiene select: false en el modelo: ninguna de estas consultas lo devuelve

// Cambia el id del rol por su nombre (como un JOIN de SQL), busca el avatar en "images"
// y el avatar del perfil (el que se ve en el navbar y en Perfiles)
const POPULATE = [
  { path: "roleId", select: "name" },
  { path: "avatar", select: "url alt entityId" },
  { path: "profile", select: "userId avatar" },
];

// Órdenes del listado (schemas/users.schema.js → USER_SORTS). _id desempata para que la paginación sea estable
const SORTS = {
  name: { name: 1, _id: 1 },
  name_desc: { name: -1, _id: -1 },
  recent: { createdAt: -1, _id: -1 },
  last_login: { lastLoginAt: -1, _id: -1 },
};

// Query dinámica del listado: solo añade las condiciones de los filtros que lleguen
const buildListFilter = ({ search, state, status, role }) => {
  const filter = { ...(state && STATE_FILTERS[state]) };
  if (status) filter.status = status;
  if (role) filter.roleId = role;
  if (search) filter.$or = [{ name: contains(search) }, { email: contains(search) }];
  return filter;
};

// TODOS (sin filtros) o los que cumplan los filtros, ordenados (los nombres, en español). Con page y limit, solo esa página
const findAll = ({ sort = "name", page, limit, ...filters } = {}) => {
  return findList(User, buildListFilter(filters), { sort: SORTS[sort], populate: POPULATE, page, limit, collation: { locale: "es" } });
};

// _id de los usuarios cuyo nombre o email contiene el texto (buscador del listado de perfiles)
const findIdsBySearch = (search) => {
  return User.distinct("_id", { $or: [{ name: contains(search) }, { email: contains(search) }] });
};

// SOLO ACTIVOS (y no eliminados): son los que pueden gestionar un organizador.
// Solo los campos que necesita el formulario de organizadores
const findActive = () => {
  return User.find({ isActive: true, deletedAt: null }).select("name email").sort({ name: 1 }).lean();
};

// SOLO ELIMINADOS (soft delete)
const findDeleted = () => {
  return User.find({ deletedAt: { $ne: null } }).populate(POPULATE).sort({ name: 1 }).lean();
};

const findById = (id) => {
  return User.findOne({ _id: id, isActive: true }).populate(POPULATE).lean();
};

// Crea un usuario (Mongoose valida los campos según el modelo y aplica los valores por defecto).
// Se devuelve buscándolo de nuevo para que la respuesta no lleve el passwordHash
const create = async (data) => {
  const user = await User.create(data);
  return findById(user._id);
};

const update = (id, data) => {
  return User.findOneAndUpdate({ _id: id, isActive: true, deletedAt: null }, data, {
    new: true,
    runValidators: true,
  })
    .populate(POPULATE)
    .lean();
};

// SOFT DELETE: no se borra el documento, se desactiva y se marca la fecha.
// Solo afecta a usuarios aún no eliminados (deletedAt: null), así la fecha original nunca se pisa
const softDelete = (id) => {
  return User.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { isActive: false, deletedAt: new Date() },
    { new: true }
  )
    .populate(POPULATE)
    .lean();
};

// Para activar/desactivar: no filtra por isActive (hay que poder reactivar un usuario desactivado),
// pero SÍ por deletedAt: un usuario eliminado no se puede reactivar nunca
const setActive = (id, data) => {
  return User.findOneAndUpdate({ _id: id, deletedAt: null }, data, { new: true }).populate(POPULATE).lean();
};

// ¿Existe el usuario, esté activo, desactivado o eliminado?
const existsById = async (id) => {
  return Boolean(await User.exists({ _id: id }));
};

// ¿Existe ya otro usuario con ese email? (también los desactivados y eliminados: el índice único los incluye)
const emailExists = async (email, excludeId) => {
  const filter = { email: email.toLowerCase() };
  if (excludeId) filter._id = { $ne: excludeId };
  return Boolean(await User.exists(filter));
};

// ¿Cuántos usuarios no eliminados tienen este rol? (para no dejar usuarios sin rol).
// Con onlyActive solo cuenta los activos (para no dejar usuarios activos con un rol desactivado)
const countByRole = (roleId, onlyActive = false) => {
  return User.countDocuments({ roleId, deletedAt: null, ...(onlyActive && { isActive: true }) });
};

// Sin filtrar por isActive (como en imágenes): para comprobar sus relaciones antes de activarlo
const findAnyById = (id) => {
  return User.findOne({ _id: id, deletedAt: null }).lean();
};

export default {
  findIdsBySearch,
  findAll, findActive, findDeleted, findById, create, update, softDelete, setActive, existsById, emailExists, countByRole, findAnyById,
};
