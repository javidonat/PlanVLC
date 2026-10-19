import mongoose from "mongoose";
import categoriesRepo from "../repos/categories.repo.js";
import plansRepo from "../repos/plans.repo.js";
import imagesService from "./images.service.js";
import AppError from "./utils/AppError.js";
import { saveWithUniqueSlug, slugMatchesText } from "./utils/slug.util.js";

// El servicio contiene la lógica de negocio
// No sabe nada de HTTP (req, res), solo trabaja con datos

// Campos que se pueden enviar desde fuera (slug, isActive y deletedAt los gestiona el servidor).
// La portada (coverImageUrl) no es un campo de la categoría: se guarda en "images"
const FIELDS = ["name", "description", "icon", "group", "status"];

// ---------- Funciones auxiliares ----------

const validateId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("El id de la categoría no es válido", 400);
  }
};

const pickFields = (body = {}) => {
  const data = {};
  for (const field of FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  return data;
};

// undefined = no se ha enviado (no se toca); null = quitar la portada
const saveCover = async (category, coverImageUrl) => {
  await imagesService.replaceImages("category", category._id, "cover", coverImageUrl ? [coverImageUrl] : [], category.name);
};

const notFound = () => new AppError("Categoría no encontrada", 404);

// ---------- Operaciones ----------

const getActiveCategories = async () => {
  return categoriesRepo.findActive();
};

const getAllCategories = async () => {
  return categoriesRepo.findAll();
};

const getDeletedCategories = async () => {
  return categoriesRepo.findDeleted();
};

const getCategoryById = async (id) => {
  validateId(id);
  const category = await categoriesRepo.findById(id);
  if (!category) throw notFound();
  return category;
};

// POST: el slug se genera a partir del nombre
const createCategory = async (body) => {
  const data = pickFields(body);
  const category = await saveWithUniqueSlug({
    text: data.name,
    fallback: "categoria",
    slugExists: categoriesRepo.slugExists,
    save: (slug) => categoriesRepo.create({ ...data, slug }),
  });

  if (body.coverImageUrl === undefined) return category;
  await saveCover(category, body.coverImageUrl);
  return categoriesRepo.findById(category._id);
};

// PATCH /:id: modifica solo lo que se envía. Si cambia el nombre, se regenera el slug
const updateCategory = async (id, body) => {
  validateId(id);

  const data = pickFields(body);
  const hasData = Object.keys(data).length > 0;
  if (!hasData && body.coverImageUrl === undefined) {
    throw new AppError("No se ha enviado ningún campo válido para modificar", 400);
  }

  const save = async (slug) => {
    const category = hasData ? await categoriesRepo.update(id, slug ? { ...data, slug } : data) : await categoriesRepo.findById(id);
    if (!category) throw notFound();
    return category;
  };

  let category;
  if (data.name) {
    const current = await categoriesRepo.findById(id);
    if (!current) throw notFound();
    if (!slugMatchesText(current.slug, data.name, "categoria")) {
      category = await saveWithUniqueSlug({
        text: data.name,
        fallback: "categoria",
        excludeId: id,
        slugExists: categoriesRepo.slugExists,
        save,
      });
    }
  }
  category ??= await save();

  if (body.coverImageUrl === undefined) return category;
  await saveCover(category, body.coverImageUrl);
  return categoriesRepo.findById(id);
};

// PATCH /:id/active
const setActive = async (id, body) => {
  validateId(id);
  if (typeof body?.isActive !== "boolean") {
    throw new AppError("isActive es obligatorio y debe ser true o false", 400);
  }

  const category = await categoriesRepo.setActive(id, { isActive: body.isActive });
  if (category) return category;

  if (await categoriesRepo.existsById(id)) {
    throw new AppError("La categoría está eliminada y no se puede activar ni desactivar", 409);
  }
  throw notFound();
};

// PATCH /:id/softdelete. No se puede eliminar una categoría que usan planes: se quedarían
// con una categoría que ya no existe y no se podrían volver a guardar
const softDeleteCategory = async (id) => {
  validateId(id);

  const plans = await plansRepo.countByCategory(id);
  if (plans > 0) {
    throw new AppError(
      `No se puede eliminar: la usa${plans === 1 ? " 1 plan" : `n ${plans} planes`}. Quítala de ${plans === 1 ? "ese plan" : "esos planes"} o desactívala`,
      409
    );
  }

  const category = await categoriesRepo.softDelete(id);
  if (!category) throw notFound();
  return category;
};

export default {
  getActiveCategories,
  getAllCategories,
  getDeletedCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  setActive,
  softDeleteCategory,
};
