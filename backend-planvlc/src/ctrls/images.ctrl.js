import imagesService from "../services/images.service.js";

// El controlador recibe la petición HTTP y devuelve la respuesta JSON
// No contiene lógica de negocio, solo llama al servicio

// GET /api/images/active
const getActiveImages = async (req, res, next) => {
  try {
    const images = await imagesService.getActiveImages();
    res.status(200).json({ ok: true, total: images.length, data: images });
  } catch (error) {
    next(error);
  }
};

export default { getActiveImages };
