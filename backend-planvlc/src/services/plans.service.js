import mongoose from "mongoose";
import plansRepo from "../repos/plans.repo.js";
import refsRepo from "../repos/refs.repo.js";
import AppError from "./utils/AppError.js";
import { generateSlug } from "./utils/slug.util.js";

// El servicio contiene la lógica de negocio
// No sabe nada de HTTP (req, res), solo trabaja con datos

// Campos que se pueden enviar desde fuera (el resto se ignora)
// slug, priceFrom, nextSessionAt, isActive y deletedAt no están: los gestiona el servidor
const FIELDS = [
  "title",
  "shortDescription",
  "description",
  "categoryIds",
  "organizerId",
  "venueId",
  "coverImageId",
  "galleryImageIds",
  "minAge",
  "tags",
  "status",
];

// ---------- Funciones auxiliares ----------

const validateId = (id) => {
  // Comprobamos que el id tiene formato válido de MongoDB antes de buscar
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("El id del plan no es válido", 400);
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

// Comprueba que los ids de las relaciones existen de verdad (MongoDB no lo hace solo)
const validateReferences = async (data) => {
  if (data.categoryIds && !(await refsRepo.categoriesExist(data.categoryIds))) {
    throw new AppError("Alguna de las categorías indicadas no existe", 400);
  }
  if (data.venueId && !(await refsRepo.venueExists(data.venueId))) {
    throw new AppError("El lugar indicado no existe", 400);
  }
  if (data.organizerId && !(await refsRepo.organizerExists(data.organizerId))) {
    throw new AppError("El organizador indicado no existe", 400);
  }
  if (data.coverImageId && !(await refsRepo.imagesExist([data.coverImageId]))) {
    throw new AppError("La imagen de portada indicada no existe", 400);
  }
  if (data.galleryImageIds?.length && !(await refsRepo.imagesExist(data.galleryImageIds))) {
    throw new AppError("Alguna imagen de la galería no existe", 400);
  }
};

// Genera un slug a partir del título y añade -1, -2... si ya existe otro igual.
// excludeId evita que un plan choque consigo mismo al editarse.
const buildUniqueSlug = async (title, excludeId) => {
  const base = generateSlug(title) || "plan";
  let candidate = base;
  let suffix = 1;

  while (await plansRepo.slugExists(candidate, excludeId)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
};

// ¿Este slug ya corresponde a ese título? (el slug base, o el base con sufijo: "fiesta" / "fiesta-2")
// Sirve para no cambiar la URL de un plan cuando se edita sin cambiar su título
const slugMatchesTitle = (slug, title) => {
  const base = generateSlug(title) || "plan";
  return slug === base || new RegExp(`^${base}-\\d+$`).test(slug);
};

// El índice único de MongoDB rechaza un slug repetido con el error 11000
const isDuplicateSlug = (error) =>
  error?.code === 11000 && (error.keyPattern?.slug !== undefined || error.keyValue?.slug !== undefined);

const MAX_SLUG_ATTEMPTS = 3;

// Calcula un slug único y ejecuta save(slug). Si otra petición simultánea se queda con el mismo
// slug entre la comprobación y el guardado, el índice único lo rechaza: se recalcula y se reintenta.
const saveWithUniqueSlug = async (title, excludeId, save) => {
  for (let attempt = 1; ; attempt += 1) {
    const slug = await buildUniqueSlug(title, excludeId);
    try {
      return await save(slug);
    } catch (error) {
      if (!isDuplicateSlug(error) || attempt >= MAX_SLUG_ATTEMPTS) throw error;
    }
  }
};

// ---------- Operaciones ----------

const getAllPlans = async () => {
  return plansRepo.findAll();
};

const getActivePlans = async () => {
  return plansRepo.findActive();
};

const getDeletedPlans = async () => {
  return plansRepo.findDeleted();
};

// GET /:id
const getPlanById = async (id) => {
  validateId(id);

  const plan = await plansRepo.findById(id);
  if (!plan) {
    throw new AppError("Plan no encontrado", 404);
  }
  return plan;
};

// GET /slug/:slug
const getPlanBySlug = async (slug) => {
  const plan = await plansRepo.findBySlug(slug);
  if (!plan) {
    throw new AppError("Plan no encontrado", 404);
  }
  return plan;
};

// POST: crea un plan nuevo. El slug se genera a partir del título
const createPlan = async (body) => {
  const data = pickFields(body);
  await validateReferences(data);

  // Si no hay título, no hay slug: Mongoose devolverá el error de "título obligatorio"
  if (typeof data.title === "string" && data.title.trim() !== "") {
    return saveWithUniqueSlug(data.title, undefined, (slug) => plansRepo.create({ ...data, slug }));
  }

  return plansRepo.create(data);
};

// PATCH /:id: modifica solo los campos que se envían y deja el resto igual
const updatePlan = async (id, body) => {
  validateId(id);

  const data = pickFields(body);
  if (Object.keys(data).length === 0) {
    throw new AppError("No se ha enviado ningún campo válido para modificar", 400);
  }
  await validateReferences(data);

  const save = async (slug) => {
    const plan = await plansRepo.update(id, slug ? { ...data, slug } : data);
    if (!plan) {
      throw new AppError("Plan no encontrado", 404);
    }
    return plan;
  };

  // Si se envía un título nuevo, el slug se regenera (siempre único, sin chocar con otros planes
  // activos, desactivados o eliminados). Si el título no cambia, el slug se mantiene.
  if (typeof data.title === "string" && data.title.trim() !== "") {
    const current = await plansRepo.findById(id);
    if (!current) {
      throw new AppError("Plan no encontrado", 404);
    }
    if (!slugMatchesTitle(current.slug, data.title)) {
      return saveWithUniqueSlug(data.title, id, save);
    }
  }

  return save();
};

// PATCH /:id/active: activa o desactiva el plan
const setActive = async (id, body) => {
  validateId(id);

  if (typeof body?.isActive !== "boolean") {
    throw new AppError("isActive es obligatorio y debe ser true o false", 400);
  }

  // Solo se toca isActive. deletedAt no se modifica nunca aquí, y el repositorio solo actualiza
  // planes con deletedAt: null, así que un plan eliminado no se puede volver a activar.
  const plan = await plansRepo.setActive(id, { isActive: body.isActive });
  if (plan) {
    return plan;
  }

  // No se ha actualizado nada: o no existe, o está eliminado
  if (await plansRepo.existsById(id)) {
    throw new AppError("El plan está eliminado y no se puede activar ni desactivar", 409);
  }
  throw new AppError("Plan no encontrado", 404);
};

// PATCH /:id/softdelete: isActive = false y deletedAt = ahora (el documento no se borra)
const softDeletePlan = async (id) => {
  validateId(id);

  const plan = await plansRepo.softDelete(id);
  if (!plan) {
    throw new AppError("Plan no encontrado", 404);
  }
  return plan;
};

export default {
  getAllPlans,
  getActivePlans,
  getDeletedPlans,
  getPlanById,
  getPlanBySlug,
  createPlan,
  updatePlan,
  setActive,
  softDeletePlan,
};
