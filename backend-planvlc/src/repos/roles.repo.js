import { Role } from "../models/index.js";

// El repositorio es la única capa que habla con MongoDB directamente

// TODOS: sin ningún filtro
const findAll = () => {
  return Role.find().sort({ name: 1 }).lean();
};

// SOLO ACTIVOS (y no eliminados): son los que se pueden asignar a un usuario.
// Solo los campos que necesita el formulario de usuarios
const findActive = () => {
  return Role.find({ isActive: true, deletedAt: null }).select("name description").sort({ name: 1 }).lean();
};

// SOLO ELIMINADOS (soft delete)
const findDeleted = () => {
  return Role.find({ deletedAt: { $ne: null } }).sort({ name: 1 }).lean();
};

const findById = (id) => {
  return Role.findOne({ _id: id, isActive: true }).lean();
};

// Crea un rol (Mongoose valida los campos según el modelo y aplica los valores por defecto)
const create = async (data) => {
  const role = await Role.create(data);
  return role.toObject();
};

const update = (id, data) => {
  return Role.findOneAndUpdate({ _id: id, isActive: true, deletedAt: null }, data, {
    new: true,
    runValidators: true,
  }).lean();
};

// SOFT DELETE: no se borra el documento, se desactiva y se marca la fecha.
// Solo afecta a roles aún no eliminados (deletedAt: null), así la fecha original nunca se pisa
const softDelete = (id) => {
  return Role.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { isActive: false, deletedAt: new Date() },
    { new: true }
  ).lean();
};

// Para activar/desactivar: no filtra por isActive (hay que poder reactivar un rol desactivado),
// pero SÍ por deletedAt: un rol eliminado no se puede reactivar nunca
const setActive = (id, data) => {
  return Role.findOneAndUpdate({ _id: id, deletedAt: null }, data, { new: true }).lean();
};

// ¿Existe el rol, esté activo, desactivado o eliminado?
const existsById = async (id) => {
  return Boolean(await Role.exists({ _id: id }));
};

// ¿Existe ya otro rol con ese nombre? (también los desactivados y eliminados: el índice único los incluye)
const nameExists = async (name, excludeId) => {
  const filter = { name: name.toLowerCase() };
  if (excludeId) filter._id = { $ne: excludeId };
  return Boolean(await Role.exists(filter));
};

export default {
  findAll, findActive, findDeleted, findById, create, update, softDelete, setActive, existsById, nameExists,
};
