import mongoose from "mongoose";
import imagesRepo from "../repos/images.repo.js";
import refsRepo from "../repos/refs.repo.js";
import { IMAGE_ENTITY_TYPES } from "../models/constants.js";
import AppError from "./utils/AppError.js";

// El servicio contiene la lógica de negocio
// No sabe nada de HTTP (req, res), solo trabaja con datos

// Campos que se pueden enviar desde fuera (el resto se ignora)
// isActive y deletedAt no están: los gestiona el servidor
const FIELDS = ["url", "alt", "entityType", "entityId", "type", "position"];

// Máximo de imágenes activas de cada tipo por documento (una portada, un logo, un avatar y 10 en la galería)
const MAX_BY_TYPE = { cover: 1, gallery: 10, logo: 1, avatar: 1 };

// ---------- Funciones auxiliares ----------

const validateId = (id) => {
  // Comprobamos que el id tiene formato válido de MongoDB antes de buscar
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("El id de la imagen no es válido", 400);
  }
};

// Se queda solo con los campos permitidos que vengan en el body
const pickFields = (body = {}) => {
  const data = {};
  for (const field of FIELDS) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }
  return data;
};

// Cada entidad solo admite sus tipos (un plan no tiene avatar, un usuario no tiene galería...)
const validateType = (entityType, type) => {
  const allowed = IMAGE_ENTITY_TYPES[entityType];
  if (!allowed.includes(type)) {
    throw new AppError(`El tipo '${type}' no es válido para '${entityType}'. Tipos permitidos: ${allowed.join(", ")}`, 400);
  }
};

// No puede haber dos portadas (o logos, o avatares) activas, ni más de 10 imágenes en una galería
const checkLimit = async (entityType, entityId, type, excludeId) => {
  const max = MAX_BY_TYPE[type];
  if ((await imagesRepo.countByEntity(entityType, entityId, type, excludeId)) < max) return;
  if (max === 1) {
    throw new AppError(`Ya tiene una imagen de tipo '${type}' activa. Desactívala o elimínala antes de añadir otra`, 409);
  }
  throw new AppError(`Ya tiene ${max} imágenes de tipo '${type}' activas (es el máximo)`, 409);
};

// Añade a cada imagen el nombre del documento al que pertenece (entityName).
// Hace lo mismo que populate en el resto de colecciones, pero aquí el modelo depende de entityType
const withEntityNames = async (images) => {
  const names = new Map();
  for (const entityType of new Set(images.map((image) => image.entityType))) {
    const ids = images.filter((image) => image.entityType === entityType).map((image) => image.entityId);
    const docs = await refsRepo.entityNames(entityType, ids);
    docs.forEach((doc) => names.set(String(doc._id), doc.name ?? doc.title));
  }
  return images.map((image) => ({ ...image, entityName: names.get(String(image.entityId)) ?? null }));
};

const withEntityName = async (image) => (await withEntityNames([image]))[0];

// ---------- Operaciones ----------

const getAllImages = async () => {
  return withEntityNames(await imagesRepo.findAll());
};

const getActiveImages = async () => {
  return imagesRepo.findActive();
};

const getDeletedImages = async () => {
  return withEntityNames(await imagesRepo.findDeleted());
};

// GET /:id
const getImageById = async (id) => {
  validateId(id);

  const image = await imagesRepo.findById(id);
  if (!image) {
    throw new AppError("Imagen no encontrada", 404);
  }
  return withEntityName(image);
};

// POST: crea una imagen nueva para un plan, lugar, categoría, organizador o usuario
const createImage = async (body) => {
  const data = pickFields(body);
  validateType(data.entityType, data.type);

  if (!(await refsRepo.entityExists(data.entityType, data.entityId))) {
    throw new AppError("La entidad indicada no existe", 400);
  }
  await checkLimit(data.entityType, data.entityId, data.type);

  return withEntityName(await imagesRepo.create(data));
};

// PATCH /:id: modifica solo los campos que se envían y deja el resto igual
const updateImage = async (id, body) => {
  validateId(id);

  const data = pickFields(body);
  delete data.entityType; // una imagen no se cambia de entidad
  delete data.entityId;
  if (Object.keys(data).length === 0) {
    throw new AppError("No se ha enviado ningún campo válido para modificar", 400);
  }

  const current = await imagesRepo.findById(id);
  if (!current) {
    throw new AppError("Imagen no encontrada", 404);
  }
  // Si cambia el tipo, tiene que valer para su entidad y no pasar del máximo
  if (data.type && data.type !== current.type) {
    validateType(current.entityType, data.type);
    await checkLimit(current.entityType, current.entityId, data.type, id);
  }

  const image = await imagesRepo.update(id, data);
  if (!image) {
    throw new AppError("Imagen no encontrada", 404);
  }
  return withEntityName(image);
};

// PATCH /:id/active: activa o desactiva la imagen
const setActive = async (id, body) => {
  validateId(id);

  if (typeof body?.isActive !== "boolean") {
    throw new AppError("isActive es obligatorio y debe ser true o false", 400);
  }

  // Al activarla, tampoco puede pasar del máximo (ej. dos portadas activas)
  if (body.isActive) {
    const current = await imagesRepo.findAnyById(id);
    if (current && !current.isActive) {
      await checkLimit(current.entityType, current.entityId, current.type, id);
    }
  }

  // El repositorio solo actualiza imágenes con deletedAt: null (una eliminada no se reactiva)
  const image = await imagesRepo.setActive(id, { isActive: body.isActive });
  if (image) {
    return withEntityName(image);
  }

  // No se ha actualizado nada: o no existe, o está eliminada
  if (await imagesRepo.existsById(id)) {
    throw new AppError("La imagen está eliminada y no se puede activar ni desactivar", 409);
  }
  throw new AppError("Imagen no encontrada", 404);
};

// PATCH /:id/softdelete: isActive = false y deletedAt = ahora (el documento no se borra)
const softDeleteImage = async (id) => {
  validateId(id);

  const image = await imagesRepo.softDelete(id);
  if (!image) {
    throw new AppError("Imagen no encontrada", 404);
  }
  return withEntityName(image);
};

// Deja las imágenes de un tipo de una entidad exactamente como la lista de URLs recibida (en ese orden).
// Sirve para cualquier entidad: replaceImages("plan", plan._id, "gallery", [url1, url2], plan.title)
// - Las URLs que ya existían se conservan (solo se actualiza su posición).
// - Las nuevas se crean.
// - Las que ya no están se eliminan con soft delete.
const replaceImages = async (entityType, entityId, type, urls, alt = "") => {
  const wanted = [...new Set(urls)];
  const current = await imagesRepo.findByEntity(entityType, entityId, type);
  const currentByUrl = new Map(current.map((image) => [image.url, image]));

  const kept = new Set();
  const toCreate = [];
  const positionUpdates = [];

  wanted.forEach((url, position) => {
    const existing = currentByUrl.get(url);
    if (existing) {
      kept.add(String(existing._id));
      if (existing.position !== position) positionUpdates.push(imagesRepo.updatePosition(existing._id, position));
    } else {
      toCreate.push({ url, alt, entityType, entityId, type, position });
    }
  });

  const toDelete = current.filter((image) => !kept.has(String(image._id))).map((image) => image._id);

  await imagesRepo.softDeleteMany(toDelete);
  await Promise.all(positionUpdates);
  await imagesRepo.createMany(toCreate);
};

export default {
  getAllImages,
  getActiveImages,
  getDeletedImages,
  getImageById,
  createImage,
  updateImage,
  setActive,
  softDeleteImage,
  replaceImages,
};
