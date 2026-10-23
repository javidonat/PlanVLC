import mongoose from "mongoose";
import plansRepo from "../repos/plans.repo.js";
import sessionsRepo from "../repos/sessions.repo.js";
import refsRepo from "../repos/refs.repo.js";
import imagesService from "./images.service.js";
import AppError from "./utils/AppError.js";
import { generateSlug } from "./utils/slug.util.js";
import { addedIds } from "./utils/ids.util.js";

// El servicio contiene la lógica de negocio
// No sabe nada de HTTP (req, res), solo trabaja con datos

// Campos que se pueden enviar desde fuera (el resto se ignora)
// slug, priceFrom, nextSessionAt, isActive y deletedAt no están: los gestiona el servidor
// Las imágenes (coverImageUrl, galleryImageUrls) no son campos del plan: ver pickImages
const FIELDS = [
  "title",
  "shortDescription",
  "description",
  "categoryIds",
  "organizerId",
  "venueId",
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

// Imágenes del plan: se envían como URLs y se guardan en "images" (entityType "plan").
// undefined = no se ha enviado (no se tocan); null / [] = quitar la portada / vaciar la galería
const pickImages = (body = {}) => ({ cover: body.coverImageUrl, gallery: body.galleryImageUrls });

const hasImages = (images) => images.cover !== undefined || images.gallery !== undefined;

const saveImages = async (plan, images) => {
  if (images.cover !== undefined) {
    await imagesService.replaceImages("plan", plan._id, "cover", images.cover ? [images.cover] : [], plan.title);
  }
  if (images.gallery !== undefined) {
    await imagesService.replaceImages("plan", plan._id, "gallery", images.gallery, plan.title);
  }
};

// Comprueba que los ids de las relaciones existen de verdad (MongoDB no lo hace solo)
// y están activos (un plan activo no puede apuntar a una categoría, lugar u organizador desactivado)
const validateReferences = async (data) => {
  if (data.categoryIds && !(await refsRepo.categoriesExist(data.categoryIds))) {
    throw new AppError("Alguna de las categorías indicadas no existe o está desactivada", 400);
  }
  if (data.venueId && !(await refsRepo.venueExists(data.venueId))) {
    throw new AppError("El lugar indicado no existe o está desactivado", 400);
  }
  if (data.organizerId && !(await refsRepo.organizerExists(data.organizerId))) {
    throw new AppError("El organizador indicado no existe o está desactivado", 400);
  }
};

// Reglas de negocio con status: solo para las relaciones que se añaden ahora (current = el plan antes de editarlo).
// Un plan que ya tenía una categoría archivada o un lugar cerrado la conserva, pero no se puede elegir uno así
const validateStatuses = async (data, current) => {
  if (data.categoryIds) {
    const added = addedIds(data.categoryIds, current?.categoryIds);
    if (added.length && (await refsRepo.anyWithStatus("category", added, ["archived"]))) {
      throw new AppError("Alguna de las categorías indicadas está archivada y no se puede usar en planes", 400);
    }
  }
  if (data.venueId && addedIds([data.venueId], current?.venueId ? [current.venueId] : []).length) {
    if (await refsRepo.anyWithStatus("venue", [data.venueId], ["permanently_closed"])) {
      throw new AppError("El lugar indicado está cerrado definitivamente", 400);
    }
  }
  if (data.organizerId && addedIds([data.organizerId], current?.organizerId ? [current.organizerId] : []).length) {
    if (await refsRepo.anyWithStatus("organizer", [data.organizerId], ["suspended"])) {
      throw new AppError("El organizador indicado está suspendido", 400);
    }
  }
};

// Al activar un plan desactivado se comprueba lo mismo con las relaciones que ya tiene guardadas
const validateReferencesToActivate = async (plan) => {
  if (!(await refsRepo.categoriesExist(plan.categoryIds))) {
    throw new AppError("No se puede activar: alguna de sus categorías está desactivada. Actívala o quítala primero", 409);
  }
  if (!(await refsRepo.venueExists(plan.venueId))) {
    throw new AppError("No se puede activar: su lugar está desactivado. Actívalo o cambia el lugar primero", 409);
  }
  if (plan.organizerId && !(await refsRepo.organizerExists(plan.organizerId))) {
    throw new AppError("No se puede activar: su organizador está desactivado. Actívalo o cambia el organizador primero", 409);
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
  const images = pickImages(body);
  await validateReferences(data);
  await validateStatuses(data);

  // Si no hay título, no hay slug: Mongoose devolverá el error de "título obligatorio"
  const plan =
    typeof data.title === "string" && data.title.trim() !== ""
      ? await saveWithUniqueSlug(data.title, undefined, (slug) => plansRepo.create({ ...data, slug }))
      : await plansRepo.create(data);

  if (!hasImages(images)) return plan;
  // Las imágenes necesitan el _id del plan: se guardan después y se devuelve el plan ya con ellas
  await saveImages(plan, images);
  return plansRepo.findById(plan._id);
};

// PATCH /:id: modifica solo los campos que se envían y deja el resto igual
const updatePlan = async (id, body) => {
  validateId(id);

  const data = pickFields(body);
  const images = pickImages(body);
  const hasData = Object.keys(data).length > 0;
  if (!hasData && !hasImages(images)) {
    throw new AppError("No se ha enviado ningún campo válido para modificar", 400);
  }
  await validateReferences(data);
  if (data.categoryIds || data.venueId || data.organizerId) {
    await validateStatuses(data, await plansRepo.findAnyById(id));
  }

  const save = async (slug) => {
    // Si solo cambian las imágenes no hay nada que actualizar en el plan, pero debe existir y estar activo
    const plan = hasData ? await plansRepo.update(id, slug ? { ...data, slug } : data) : await plansRepo.findById(id);
    if (!plan) {
      throw new AppError("Plan no encontrado", 404);
    }
    return plan;
  };

  // Si se envía un título nuevo, el slug se regenera (siempre único, sin chocar con otros planes
  // activos, desactivados o eliminados). Si el título no cambia, el slug se mantiene.
  let plan;
  if (typeof data.title === "string" && data.title.trim() !== "") {
    const current = await plansRepo.findById(id);
    if (!current) {
      throw new AppError("Plan no encontrado", 404);
    }
    if (!slugMatchesTitle(current.slug, data.title)) {
      plan = await saveWithUniqueSlug(data.title, id, save);
    }
  }
  plan ??= await save();

  if (!hasImages(images)) return plan;
  await saveImages(plan, images);
  return plansRepo.findById(id);
};

// PATCH /:id/active: activa o desactiva el plan
const setActive = async (id, body) => {
  validateId(id);

  if (typeof body?.isActive !== "boolean") {
    throw new AppError("isActive es obligatorio y debe ser true o false", 400);
  }

  // No se puede desactivar si tiene sesiones activas: quedarían sesiones activas de un plan desactivado
  if (!body.isActive) {
    const sessions = await sessionsRepo.countByPlan(id, true);
    if (sessions === 1) {
      throw new AppError("No se puede desactivar: tiene 1 sesión activa. Desactiva o elimina la sesión primero", 409);
    }
    if (sessions > 1) {
      throw new AppError(`No se puede desactivar: tiene ${sessions} sesiones activas. Desactiva o elimina las sesiones primero`, 409);
    }
  }

  // No se puede activar si alguna de sus relaciones está desactivada
  if (body.isActive) {
    const current = await plansRepo.findAnyById(id);
    if (current) await validateReferencesToActivate(current);
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

// PATCH /:id/softdelete: isActive = false y deletedAt = ahora (el documento no se borra).
// No se puede eliminar si tiene sesiones: se quedarían con un plan que ya no existe
const softDeletePlan = async (id) => {
  validateId(id);

  const sessions = await sessionsRepo.countByPlan(id);
  if (sessions === 1) {
    throw new AppError("No se puede eliminar: tiene 1 sesión. Elimina la sesión o desactiva el plan", 409);
  }
  if (sessions > 1) {
    throw new AppError(`No se puede eliminar: tiene ${sessions} sesiones. Elimina las sesiones o desactiva el plan`, 409);
  }

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
