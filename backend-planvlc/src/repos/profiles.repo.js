import { Profile } from "../models/index.js";
import { defaultAvatar } from "../services/utils/avatar.js";
import { STATE_FILTERS, contains, findList } from "./utils/list.util.js";

// El repositorio es la única capa que habla con MongoDB directamente

// Órdenes del listado (schemas/profiles.schema.js → PROFILE_SORTS). _id desempata para que la paginación sea estable
const SORTS = {
  recent: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
};

// Query dinámica del listado: solo añade las condiciones de los filtros que lleguen.
// search: el nombre, los apellidos o el teléfono contienen el texto, o el perfil es de uno de searchUserIds
// (usuarios cuyo nombre o email lo contiene)
const buildListFilter = ({ search, searchUserIds = [], state }) => {
  const filter = { ...(state && STATE_FILTERS[state]) };
  if (search) {
    filter.$or = [{ firstName: contains(search) }, { lastName: contains(search) }, { phone: contains(search) }, { userId: { $in: searchUserIds } }];
  }
  return filter;
};

// Todos los perfiles (también los desactivados o eliminados) o los que cumplan los filtros, con el nombre
// y el email de su usuario. Con page y limit, solo esa página
const findAll = ({ sort = "recent", page, limit, ...filters } = {}) => {
  return findList(Profile, buildListFilter(filters), { sort: SORTS[sort], populate: { path: "userId", select: "name email" }, page, limit });
};

const findByUserId = (userId) => {
  return Profile.findOne({ userId }).lean();
};

// Perfil vacío de un usuario nuevo, con el robot como avatar (lo crea users.service al crear el usuario)
const create = async (userId) => {
  const profile = await Profile.create({ userId, avatar: defaultAvatar(userId) });
  return profile.toObject();
};

// Modifica el perfil del usuario y, si aún no tenía, lo crea (upsert) con el robot como avatar
const upsertByUserId = (userId, data) => {
  const update = { $set: { ...data, userId } };
  if (data.avatar === undefined) update.$setOnInsert = { avatar: defaultAvatar(userId) };
  return Profile.findOneAndUpdate({ userId }, update, {
    new: true,
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  }).lean();
};

// Integridad referencial con users: el perfil se activa/desactiva junto a su usuario
const setActiveByUserId = (userId, isActive) => {
  return Profile.updateOne({ userId, deletedAt: null }, { isActive });
};

// Soft delete del perfil cuando se elimina su usuario
const softDeleteByUserId = (userId) => {
  return Profile.updateOne({ userId, deletedAt: null }, { isActive: false, deletedAt: new Date() });
};

export default { findAll, findByUserId, create, upsertByUserId, setActiveByUserId, softDeleteByUserId };
