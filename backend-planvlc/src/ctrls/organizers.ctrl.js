import organizersService from "../services/organizers.service.js";

// El controlador recibe la petición HTTP y devuelve la respuesta JSON
// No contiene lógica de negocio, solo llama al servicio

// GET /api/organizers/active
const getActiveOrganizers = async (req, res, next) => {
  try {
    const organizers = await organizersService.getActiveOrganizers();
    res.status(200).json({ ok: true, total: organizers.length, data: organizers });
  } catch (error) {
    next(error);
  }
};

export default { getActiveOrganizers };
