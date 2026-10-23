import mongoose from "mongoose";
import categoriesRepo from "../repos/categories.repo.js";
import plansRepo from "../repos/plans.repo.js";
import imagesService from "./images.service.js";
import AppError from "./utils/AppError.js";
import { generateSlug } from "./utils/slug.util.js";

// El servicio contiene la lógica de negocio
// No sabe nada de HTTP (req, res), solo trabaja con datos

// Campos que se pueden enviar desde fuera (el resto se ignora)
// slug, isActive y deletedAt no están: los gestiona el servidor
// La portada (coverImageUrl) no es un campo de la categoría: ver saveCover
const FIELDS = ["name", "description", "icon", "group", "status"];

// ---------- Funciones auxiliares ----------

const validateId = (id) => {
  // Comprobamos que el id tiene formato válido de MongoDB antes de buscar
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("El id de la categoría no es válido", 400);
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

// Portada de la categoría: se envía como URL y se guarda en "images" (entityType "category").
// null = quitar la portada
const saveCover = async (category, coverImageUrl) => {
  const urls = coverImageUrl ? [coverImageUrl] : [];
  await imagesService.replaceImages("category", category._id, "cover", urls, category.name);
};

// Genera un slug a partir del nombre y añade -1, -2... si ya existe otro igual.
// excludeId evita que una categoría choque consigo misma al editarse.
const buildUniqueSlug = async (name, excludeId) => {
  const base = generateSlug(name) || "categoria";
  let candidate = base;
  let suffix = 1;

  while (await categoriesRepo.slugExists(candidate, excludeId)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
};

// ¿Este slug ya corresponde a ese nombre? (el slug base, o el base con sufijo: "tardeo" / "tardeo-2")
// Sirve para no cambiar el slug de una categoría cuando se edita sin cambiar su nombre
const slugMatchesName = (slug, name) => {
  const base = generateSlug(name) || "categoria";
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

const getAllCategories = async () => {
  return categoriesRepo.findAll();
};

const getActiveCategories = async () => {
  return categoriesRepo.findActive();
};

const getDeletedCategories = async () => {
  return categoriesRepo.findDeleted();
};

// GET /:id
const getCategoryById = async (id) => {
  validateId(id);

  const category = await categoriesRepo.findById(id);
  if (!category) {
    throw new AppError("Categoría no encontrada", 404);
  }
  return category;
};

// POST: crea una categoría nueva. El slug se genera a partir del nombre
const createCategory = async (body) => {
  const data = pickFields(body);

  const category = await saveWithUniqueSlug(data.name, undefined, (slug) => categoriesRepo.create({ ...data, slug }));

  if (body.coverImageUrl === undefined) return category;
  // La portada necesita el _id de la categoría: se guarda después y se devuelve la categoría ya con ella
  await saveCover(category, body.coverImageUrl);
  return categoriesRepo.findById(category._id);
};

// PATCH /:id: modifica solo los campos que se envían y deja el resto igual
const updateCategory = async (id, body) => {
  validateId(id);

  const data = pickFields(body);
  const hasData = Object.keys(data).length > 0;
  if (!hasData && body.coverImageUrl === undefined) {
    throw new AppError("No se ha enviado ningún campo válido para modificar", 400);
  }

  const save = async (slug) => {
    // Si solo cambia la portada no hay nada que actualizar en la categoría, pero debe existir y estar activa
    const category = hasData
      ? await categoriesRepo.update(id, slug ? { ...data, slug } : data)
      : await categoriesRepo.findById(id);
    if (!category) {
      throw new AppError("Categoría no encontrada", 404);
    }
    return category;
  };

  // Si se envía un nombre nuevo, el slug se regenera (siempre único). Si el nombre no cambia, se mantiene.
  let category;
  if (typeof data.name === "string" && data.name.trim() !== "") {
    const current = await categoriesRepo.findById(id);
    if (!current) {
      throw new AppError("Categoría no encontrada", 404);
    }
    if (!slugMatchesName(current.slug, data.name)) {
      category = await saveWithUniqueSlug(data.name, id, save);
    }
  }
  category ??= await save();

  if (body.coverImageUrl === undefined) return category;
  await saveCover(category, body.coverImageUrl);
  return categoriesRepo.findById(id);
};

// PATCH /:id/active: activa o desactiva la categoría
const setActive = async (id, body) => {
  validateId(id);

  if (typeof body?.isActive !== "boolean") {
    throw new AppError("isActive es obligatorio y debe ser true o false", 400);
  }

  // No se puede desactivar si la usan planes activos: quedarían planes activos con una categoría desactivada
  if (!body.isActive) {
    const plans = await plansRepo.countByCategory(id, true);
    if (plans === 1) {
      throw new AppError("No se puede desactivar: la usa 1 plan activo. Quítala de ese plan o desactiva el plan primero", 409);
    }
    if (plans > 1) {
      throw new AppError(`No se puede desactivar: la usan ${plans} planes activos. Quítala de esos planes o desactívalos primero`, 409);
    }
  }

  // El repositorio solo actualiza categorías con deletedAt: null (una eliminada no se reactiva)
  const category = await categoriesRepo.setActive(id, { isActive: body.isActive });
  if (category) {
    return category;
  }

  // No se ha actualizado nada: o no existe, o está eliminada
  if (await categoriesRepo.existsById(id)) {
    throw new AppError("La categoría está eliminada y no se puede activar ni desactivar", 409);
  }
  throw new AppError("Categoría no encontrada", 404);
};

// PATCH /:id/softdelete: isActive = false y deletedAt = ahora (el documento no se borra).
// No se puede eliminar si la usan planes: se quedarían con una categoría que ya no existe
const softDeleteCategory = async (id) => {
  validateId(id);

  const plans = await plansRepo.countByCategory(id);
  if (plans === 1) {
    throw new AppError("No se puede eliminar: la usa 1 plan. Quítala de ese plan o desactívala", 409);
  }
  if (plans > 1) {
    throw new AppError(`No se puede eliminar: la usan ${plans} planes. Quítala de esos planes o desactívala`, 409);
  }

  const category = await categoriesRepo.softDelete(id);
  if (!category) {
    throw new AppError("Categoría no encontrada", 404);
  }
  return category;
};

export default {
  getAllCategories,
  getActiveCategories,
  getDeletedCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  setActive,
  softDeleteCategory,
};
