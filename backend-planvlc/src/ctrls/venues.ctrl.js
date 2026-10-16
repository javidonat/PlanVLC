import venuesService from "../services/venues.service.js";

// El controlador recibe la petición HTTP y devuelve la respuesta JSON
// No contiene lógica de negocio, solo llama al servicio

// GET /api/venues/active
const getActiveVenues = async (req, res, next) => {
  try {
    const venues = await venuesService.getActiveVenues();
    res.status(200).json({ ok: true, total: venues.length, data: venues });
  } catch (error) {
    next(error);
  }
};

export default { getActiveVenues };
