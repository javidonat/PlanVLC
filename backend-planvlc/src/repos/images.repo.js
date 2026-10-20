import { Image } from "../models/index.js";

// El repositorio es la única capa que habla con MongoDB directamente

// Orden del listado: por entidad, tipo y posición (las imágenes de un mismo documento quedan juntas)
const SORT = { entityType: 1, entityId: 1, type: 1, position: 1 };

// TODOS: sin ningún filtro
const findAll = () => {
  return Image.find().sort(SORT).lean();
};

// SOLO ACTIVOS (y no eliminados)
const findActive = () => {
  return Image.find({ isActive: true, deletedAt: null }).select("url alt").sort({ createdAt: 1 }).lean();
};

// SOLO ELIMINADOS (soft delete)
const findDeleted = () => {
  return Image.find({ deletedAt: { $ne: null } }).sort(SORT).lean();
};

const findById = (id) => {
  return Image.findOne({ _id: id, isActive: true }).lean();
};

// Crea una imagen (Mongoose valida los campos según el modelo y aplica los valores por defecto)
const create = async (data) => {
  const image = await Image.create(data);
  return image.toObject();
};

const update = (id, data) => {
  return Image.findOneAndUpdate({ _id: id, isActive: true, deletedAt: null }, data, {
    new: true,
    runValidators: true,
  }).lean();
};

// SOFT DELETE: no se borra el documento, se desactiva y se marca la fecha.
// Solo afecta a imágenes aún no eliminadas (deletedAt: null), así la fecha original nunca se pisa
const softDelete = (id) => {
  return Image.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { isActive: false, deletedAt: new Date() },
    { new: true }
  ).lean();
};

// Para activar/desactivar: no filtra por isActive (hay que poder reactivar una imagen desactivada),
// pero SÍ por deletedAt: una imagen eliminada no se puede reactivar nunca
const setActive = (id, data) => {
  return Image.findOneAndUpdate({ _id: id, deletedAt: null }, data, { new: true }).lean();
};

// ¿Existe la imagen, esté activa, desactivada o eliminada?
const existsById = async (id) => {
  return Boolean(await Image.exists({ _id: id }));
};

// Sin filtrar por isActive: para comprobar el tipo y la entidad antes de activarla
const findAnyById = (id) => {
  return Image.findOne({ _id: id, deletedAt: null }).lean();
};

// ¿Cuántas imágenes activas de ese tipo tiene ya el documento? (para no tener dos portadas o más de 10 en la galería)
const countByEntity = (entityType, entityId, type, excludeId) => {
  const filter = { entityType, entityId, type, isActive: true, deletedAt: null };
  if (excludeId) filter._id = { $ne: excludeId };
  return Image.countDocuments(filter);
};

// ---------- Para los formularios de planes, lugares, categorías... (replaceImages) ----------

// Imágenes activas de una entidad y de un tipo (ej. la galería de un plan), en orden.
// Las desactivadas desde el panel de imágenes no se tocan
const findByEntity = (entityType, entityId, type) => {
  return Image.find({ entityType, entityId, type, isActive: true, deletedAt: null }).sort({ position: 1 }).lean();
};

// insertMany valida cada imagen con el modelo (URL, entidad, tipo permitido...)
const createMany = (images) => {
  return images.length ? Image.insertMany(images) : [];
};

const updatePosition = (id, position) => {
  return Image.updateOne({ _id: id }, { position });
};

// SOFT DELETE, igual que en el resto de colecciones
const softDeleteMany = (ids) => {
  if (!ids.length) return null;
  return Image.updateMany({ _id: { $in: ids }, deletedAt: null }, { isActive: false, deletedAt: new Date() });
};

export default {
  findAll, findActive, findDeleted, findById, create, update, softDelete, setActive, existsById, findAnyById, countByEntity,
  findByEntity, createMany, updatePosition, softDeleteMany,
};
