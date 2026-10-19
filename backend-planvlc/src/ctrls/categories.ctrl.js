import categoriesService from "../services/categories.service.js";

// El controlador recibe la petición HTTP y devuelve la respuesta JSON
// No contiene lógica de negocio, solo llama al servicio

// Respuesta de una lista: { ok, total, data }
const list = (load) => async (req, res, next) => {
  try {
    const categories = await load();
    res.status(200).json({ ok: true, total: categories.length, data: categories });
  } catch (error) {
    next(error);
  }
};

// GET /api/categories
const getCategories = list(() => categoriesService.getAllCategories());

// GET /api/categories/active
const getActiveCategories = list(() => categoriesService.getActiveCategories());

// GET /api/categories/deleted
const getDeletedCategories = list(() => categoriesService.getDeletedCategories());

// GET /api/categories/:id
const getCategoryById = async (req, res, next) => {
  try {
    const category = await categoriesService.getCategoryById(req.params.id);
    res.status(200).json({ ok: true, data: category });
  } catch (error) {
    next(error);
  }
};

// POST /api/categories
const postCategory = async (req, res, next) => {
  try {
    const category = await categoriesService.createCategory(req.body);
    res.status(201).json({ ok: true, message: "Categoría creada correctamente", data: category });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/categories/:id
const patchCategory = async (req, res, next) => {
  try {
    const category = await categoriesService.updateCategory(req.params.id, req.body);
    res.status(200).json({ ok: true, message: "Categoría modificada correctamente", data: category });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/categories/:id/active
const patchActive = async (req, res, next) => {
  try {
    const category = await categoriesService.setActive(req.params.id, req.body);
    res.status(200).json({
      ok: true,
      message: category.isActive ? "Categoría activada correctamente" : "Categoría desactivada correctamente",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/categories/:id/softdelete
const patchSoftDelete = async (req, res, next) => {
  try {
    const category = await categoriesService.softDeleteCategory(req.params.id);
    res.status(200).json({ ok: true, message: "Categoría eliminada correctamente", data: category });
  } catch (error) {
    next(error);
  }
};

export default {
  getCategories,
  getActiveCategories,
  getDeletedCategories,
  getCategoryById,
  postCategory,
  patchCategory,
  patchActive,
  patchSoftDelete,
};
