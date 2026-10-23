import mongoose from "mongoose";
import venuesRepo from "../repos/venues.repo.js";
import plansRepo from "../repos/plans.repo.js";
import imagesService from "./images.service.js";
import AppError from "./utils/AppError.js";

// El servicio contiene la lógica de negocio
// No sabe nada de HTTP (req, res), solo trabaja con datos

// Campos que se pueden enviar desde fuera (el resto se ignora)
// isActive y deletedAt no están: los gestiona el servidor.
// latitude/longitude se guardan en location (ver pickLocation) y las imágenes en "images" (ver saveImages)
const FIELDS = ["name", "address", "neighborhood", "city", "province", "postalCode", "capacity", "status"];

// ---------- Funciones auxiliares ----------

const validateId = (id) => {
  // Comprobamos que el id tiene formato válido de MongoDB antes de buscar
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("El id del lugar no es válido", 400);
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

// Coordenadas → location (GeoJSON, orden [longitud, latitud]).
// undefined = no se han enviado (no se tocan); null = quitar la ubicación
const pickLocation = (body = {}) => {
  if (body.latitude === undefined && body.longitude === undefined) return undefined;
  if (body.latitude === null || body.longitude === null) return null;
  return { type: "Point", coordinates: [body.longitude, body.latitude] };
};

// Imágenes del lugar: se envían como URLs y se guardan en "images" (entityType "venue").
// undefined = no se ha enviado (no se tocan); null / [] = quitar la portada / vaciar la galería
const pickImages = (body = {}) => ({ cover: body.coverImageUrl, gallery: body.galleryImageUrls });

const hasImages = (images) => images.cover !== undefined || images.gallery !== undefined;

const saveImages = async (venue, images) => {
  if (images.cover !== undefined) {
    await imagesService.replaceImages("venue", venue._id, "cover", images.cover ? [images.cover] : [], venue.name);
  }
  if (images.gallery !== undefined) {
    await imagesService.replaceImages("venue", venue._id, "gallery", images.gallery, venue.name);
  }
};

// ---------- Operaciones ----------

const getAllVenues = async () => {
  return venuesRepo.findAll();
};

const getActiveVenues = async () => {
  return venuesRepo.findActive();
};

const getDeletedVenues = async () => {
  return venuesRepo.findDeleted();
};

// GET /:id
const getVenueById = async (id) => {
  validateId(id);

  const venue = await venuesRepo.findById(id);
  if (!venue) {
    throw new AppError("Lugar no encontrado", 404);
  }
  return venue;
};

// POST: crea un lugar nuevo
const createVenue = async (body) => {
  const data = pickFields(body);
  const location = pickLocation(body);
  if (location) data.location = location;
  const images = pickImages(body);

  const venue = await venuesRepo.create(data);

  if (!hasImages(images)) return venue;
  // Las imágenes necesitan el _id del lugar: se guardan después y se devuelve el lugar ya con ellas
  await saveImages(venue, images);
  return venuesRepo.findById(venue._id);
};

// PATCH /:id: modifica solo los campos que se envían y deja el resto igual
const updateVenue = async (id, body) => {
  validateId(id);

  const data = pickFields(body);
  const location = pickLocation(body);
  if (location) data.location = location;
  if (location === null) data.$unset = { location: 1 }; // quitar la ubicación
  const images = pickImages(body);

  const hasData = Object.keys(data).length > 0;
  if (!hasData && !hasImages(images)) {
    throw new AppError("No se ha enviado ningún campo válido para modificar", 400);
  }

  // Si solo cambian las imágenes no hay nada que actualizar en el lugar, pero debe existir y estar activo
  const venue = hasData ? await venuesRepo.update(id, data) : await venuesRepo.findById(id);
  if (!venue) {
    throw new AppError("Lugar no encontrado", 404);
  }

  if (!hasImages(images)) return venue;
  await saveImages(venue, images);
  return venuesRepo.findById(id);
};

// PATCH /:id/active: activa o desactiva el lugar
const setActive = async (id, body) => {
  validateId(id);

  if (typeof body?.isActive !== "boolean") {
    throw new AppError("isActive es obligatorio y debe ser true o false", 400);
  }

  // No se puede desactivar si hay planes activos en este lugar: quedarían planes activos en un lugar desactivado
  if (!body.isActive) {
    const plans = await plansRepo.countByVenue(id, true);
    if (plans === 1) {
      throw new AppError("No se puede desactivar: hay 1 plan activo en este lugar. Cámbialo de lugar o desactiva el plan primero", 409);
    }
    if (plans > 1) {
      throw new AppError(`No se puede desactivar: hay ${plans} planes activos en este lugar. Cámbialos de lugar o desactívalos primero`, 409);
    }
  }

  // El repositorio solo actualiza lugares con deletedAt: null (uno eliminado no se reactiva)
  const venue = await venuesRepo.setActive(id, { isActive: body.isActive });
  if (venue) {
    return venue;
  }

  // No se ha actualizado nada: o no existe, o está eliminado
  if (await venuesRepo.existsById(id)) {
    throw new AppError("El lugar está eliminado y no se puede activar ni desactivar", 409);
  }
  throw new AppError("Lugar no encontrado", 404);
};

// PATCH /:id/softdelete: isActive = false y deletedAt = ahora (el documento no se borra).
// No se puede eliminar si hay planes en este lugar: se quedarían con un lugar que ya no existe
const softDeleteVenue = async (id) => {
  validateId(id);

  const plans = await plansRepo.countByVenue(id);
  if (plans === 1) {
    throw new AppError("No se puede eliminar: hay 1 plan en este lugar. Cámbialo de lugar o desactiva el lugar", 409);
  }
  if (plans > 1) {
    throw new AppError(`No se puede eliminar: hay ${plans} planes en este lugar. Cámbialos de lugar o desactiva el lugar`, 409);
  }

  const venue = await venuesRepo.softDelete(id);
  if (!venue) {
    throw new AppError("Lugar no encontrado", 404);
  }
  return venue;
};

export default {
  getAllVenues,
  getActiveVenues,
  getDeletedVenues,
  getVenueById,
  createVenue,
  updateVenue,
  setActive,
  softDeleteVenue,
};
