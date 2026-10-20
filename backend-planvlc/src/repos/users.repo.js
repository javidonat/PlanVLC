import { User } from "../models/index.js";

// El repositorio es la única capa que habla con MongoDB directamente
// passwordHash tiene select: false en el modelo: ninguna de estas consultas lo devuelve

// Cambia el id del rol por su nombre (como un JOIN de SQL) y busca el avatar en "images"
const POPULATE = [
  { path: "roleId", select: "name" },
  { path: "avatar", select: "url alt entityId" },
];

// TODOS: sin ningún filtro
const findAll = () => {
  return User.find().populate(POPULATE).sort({ name: 1 }).lean();
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

// ¿Cuántos usuarios no eliminados tienen este rol? (para no dejar usuarios sin rol)
const countByRole = (roleId) => {
  return User.countDocuments({ roleId, deletedAt: null });
};

export default {
  findAll, findActive, findDeleted, findById, create, update, softDelete, setActive, existsById, emailExists, countByRole,
};
