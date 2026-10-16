import categoriesService from "../services/categories.service.js";

// El controlador recibe la petición HTTP y devuelve la respuesta JSON
// No contiene lógica de negocio, solo llama al servicio

// GET /api/categories/active
const getActiveCategories = async (req, res, next) => {
  try {
    const categories = await categoriesService.getActiveCategories();
    res.status(200).json({ ok: true, total: categories.length, data: categories });
  } catch (error) {
    next(error);
  }
};

export default { getActiveCategories };
