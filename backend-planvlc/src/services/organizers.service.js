import mongoose from "mongoose";
import organizersRepo from "../repos/organizers.repo.js";
import refsRepo from "../repos/refs.repo.js";
import plansRepo from "../repos/plans.repo.js";
import imagesService from "./images.service.js";
import AppError from "./utils/AppError.js";
import { generateSlug } from "./utils/slug.util.js";
import { addedIds } from "./utils/ids.util.js";

// El servicio contiene la lógica de negocio
// No sabe nada de HTTP (req, res), solo trabaja con datos

// Campos que se pueden enviar desde fuera (el resto se ignora)
// slug, isActive y deletedAt no están: los gestiona el servidor
// El logo (logoImageUrl) no es un campo del organizador: ver saveLogo
const FIELDS = ["name", "type", "description", "contact", "userIds", "status"];

// ---------- Funciones auxiliares ----------

const validateId = (id) => {
  // Comprobamos que el id tiene formato válido de MongoDB antes de buscar
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("El id del organizador no es válido", 400);
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

// Comprueba que los usuarios indicados existen de verdad (MongoDB no lo hace solo)
// y están activos (un organizador activo no puede tener usuarios desactivados)
const validateReferences = async (data) => {
  if (data.userIds?.length && !(await refsRepo.usersExist(data.userIds))) {
    throw new AppError("Alguno de los usuarios indicados no existe o está desactivado", 400);
  }
};

// Reglas de negocio con status: no se puede añadir un usuario suspendido o bloqueado
// (current = el organizador antes de editarlo; los usuarios que ya tenía se quedan)
const validateStatuses = async (data, current) => {
  const added = addedIds(data.userIds ?? [], current?.userIds);
  if (added.length && (await refsRepo.anyWithStatus("user", added, ["suspended", "banned"]))) {
    throw new AppError("Alguno de los usuarios indicados está suspendido o bloqueado", 400);
  }
};

// Logo del organizador: se envía como URL y se guarda en "images" (entityType "organizer").
// null = quitar el logo
const saveLogo = async (organizer, logoImageUrl) => {
  const urls = logoImageUrl ? [logoImageUrl] : [];
  await imagesService.replaceImages("organizer", organizer._id, "logo", urls, organizer.name);
};

// Genera un slug a partir del nombre y añade -1, -2... si ya existe otro igual.
// excludeId evita que un organizador choque consigo mismo al editarse.
const buildUniqueSlug = async (name, excludeId) => {
  const base = generateSlug(name) || "organizador";
  let candidate = base;
  let suffix = 1;

  while (await organizersRepo.slugExists(candidate, excludeId)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
};

// ¿Este slug ya corresponde a ese nombre? (el slug base, o el base con sufijo: "tardeos-vlc" / "tardeos-vlc-2")
// Sirve para no cambiar el slug de un organizador cuando se edita sin cambiar su nombre
const slugMatchesName = (slug, name) => {
  const base = generateSlug(name) || "organizador";
  return slug === base || new RegExp(`^${base}-\\d+$`).test(slug);
};

// El índice único de MongoDB rechaza un slug repetido con el error 11000
const isDuplicateSlug = (error) =>
  error?.code === 11000 && (error.keyPattern?.slug !== undefined || error.keyValue?.slug !== undefined);

const MAX_SLUG_ATTEMPTS = 3;

// Calcula un slug único y ejecuta save(slug). Si otra petición simultánea se queda con el mismo
// slug entre la comprobación y el guardado, el índice único lo rechaza: se recalcula y se reintenta.
const saveWithUniqueSlug = async (name, excludeId, save) => {
  for (let attempt = 1; ; attempt += 1) {
    const slug = await buildUniqueSlug(name, excludeId);
    try {
      return await save(slug);
    } catch (error) {
      if (!isDuplicateSlug(error) || attempt >= MAX_SLUG_ATTEMPTS) throw error;
    }
  }
};

// ---------- Operaciones ----------

const getAllOrganizers = async () => {
  return organizersRepo.findAll();
};

const getActiveOrganizers = async () => {
  return organizersRepo.findActive();
};

const getDeletedOrganizers = async () => {
  return organizersRepo.findDeleted();
};

// GET /:id
const getOrganizerById = async (id) => {
  validateId(id);

  const organizer = await organizersRepo.findById(id);
  if (!organizer) {
    throw new AppError("Organizador no encontrado", 404);
  }
  return organizer;
};

// POST: crea un organizador nuevo. El slug se genera a partir del nombre
const createOrganizer = async (body) => {
  const data = pickFields(body);
  await validateReferences(data);
  await validateStatuses(data);

  const organizer = await saveWithUniqueSlug(data.name, undefined, (slug) => organizersRepo.create({ ...data, slug }));

  if (body.logoImageUrl === undefined) return organizer;
  // El logo necesita el _id del organizador: se guarda después y se devuelve el organizador ya con él
  await saveLogo(organizer, body.logoImageUrl);
  return organizersRepo.findById(organizer._id);
};

// PATCH /:id: modifica solo los campos que se envían y deja el resto igual
const updateOrganizer = async (id, body) => {
  validateId(id);

  const data = pickFields(body);
  const hasData = Object.keys(data).length > 0;
  if (!hasData && body.logoImageUrl === undefined) {
    throw new AppError("No se ha enviado ningún campo válido para modificar", 400);
  }
  await validateReferences(data);
  if (data.userIds?.length) {
    await validateStatuses(data, await organizersRepo.findAnyById(id));
  }

  const save = async (slug) => {
    // Si solo cambia el logo no hay nada que actualizar en el organizador, pero debe existir y estar activo
    const organizer = hasData
      ? await organizersRepo.update(id, slug ? { ...data, slug } : data)
      : await organizersRepo.findById(id);
    if (!organizer) {
      throw new AppError("Organizador no encontrado", 404);
    }
    return organizer;
  };

  // Si se envía un nombre nuevo, el slug se regenera (siempre único). Si el nombre no cambia, se mantiene.
  let organizer;
  if (typeof data.name === "string" && data.name.trim() !== "") {
    const current = await organizersRepo.findById(id);
    if (!current) {
      throw new AppError("Organizador no encontrado", 404);
    }
    if (!slugMatchesName(current.slug, data.name)) {
      organizer = await saveWithUniqueSlug(data.name, id, save);
    }
  }
  organizer ??= await save();

  if (body.logoImageUrl === undefined) return organizer;
  await saveLogo(organizer, body.logoImageUrl);
  return organizersRepo.findById(id);
};

// PATCH /:id/active: activa o desactiva el organizador
const setActive = async (id, body) => {
  validateId(id);

  if (typeof body?.isActive !== "boolean") {
    throw new AppError("isActive es obligatorio y debe ser true o false", 400);
  }

  // No se puede desactivar si tiene planes activos: quedarían planes activos con un organizador desactivado
  if (!body.isActive) {
    const plans = await plansRepo.countByOrganizer(id, true);
    if (plans === 1) {
      throw new AppError("No se puede desactivar: tiene 1 plan activo. Cambia el organizador de ese plan o desactiva el plan primero", 409);
    }
    if (plans > 1) {
      throw new AppError(`No se puede desactivar: tiene ${plans} planes activos. Cambia el organizador de esos planes o desactívalos primero`, 409);
    }
  }

  // No se puede activar si alguno de sus usuarios está desactivado
  if (body.isActive) {
    const current = await organizersRepo.findAnyById(id);
    if (current?.userIds?.length && !(await refsRepo.usersExist(current.userIds))) {
      throw new AppError("No se puede activar: alguno de sus usuarios está desactivado. Actívalo o quítalo primero", 409);
    }
  }

  // El repositorio solo actualiza organizadores con deletedAt: null (uno eliminado no se reactiva)
  const organizer = await organizersRepo.setActive(id, { isActive: body.isActive });
  if (organizer) {
    return organizer;
  }

  // No se ha actualizado nada: o no existe, o está eliminado
  if (await organizersRepo.existsById(id)) {
    throw new AppError("El organizador está eliminado y no se puede activar ni desactivar", 409);
  }
  throw new AppError("Organizador no encontrado", 404);
};

// PATCH /:id/softdelete: isActive = false y deletedAt = ahora (el documento no se borra).
// No se puede eliminar si tiene planes: se quedarían con un organizador que ya no existe
const softDeleteOrganizer = async (id) => {
  validateId(id);

  const plans = await plansRepo.countByOrganizer(id);
  if (plans === 1) {
    throw new AppError("No se puede eliminar: tiene 1 plan. Cambia el organizador de ese plan o desactívalo", 409);
  }
  if (plans > 1) {
    throw new AppError(`No se puede eliminar: tiene ${plans} planes. Cambia el organizador de esos planes o desactívalo`, 409);
  }

  const organizer = await organizersRepo.softDelete(id);
  if (!organizer) {
    throw new AppError("Organizador no encontrado", 404);
  }
  return organizer;
};

export default {
  getAllOrganizers,
  getActiveOrganizers,
  getDeletedOrganizers,
  getOrganizerById,
  createOrganizer,
  updateOrganizer,
  setActive,
  softDeleteOrganizer,
};
