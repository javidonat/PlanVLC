import { Image } from "../models/index.js";

// El repositorio es la única capa que habla con MongoDB directamente

// SOLO ACTIVOS (y no eliminados)
const findActive = () => {
  return Image.find({ isActive: true, deletedAt: null }).select("url alt").sort({ createdAt: 1 }).lean();
};

// Imágenes no eliminadas de una entidad y de un tipo (ej. la galería de un plan), en orden
const findByEntity = (entityType, entityId, type) => {
  return Image.find({ entityType, entityId, type, deletedAt: null }).sort({ position: 1 }).lean();
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

export default { findActive, findByEntity, createMany, updatePosition, softDeleteMany };
