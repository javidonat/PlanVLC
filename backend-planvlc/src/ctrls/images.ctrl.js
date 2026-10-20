import imagesService from "../services/images.service.js";

// El controlador recibe la petición HTTP y devuelve la respuesta JSON
// No contiene lógica de negocio, solo llama al servicio

// GET /api/images
const getImages = async (req, res, next) => {
  try {
    const images = await imagesService.getAllImages();
    res.status(200).json({ ok: true, total: images.length, data: images });
  } catch (error) {
    next(error); // Pasa el error al middleware de errores
  }
};

// GET /api/images/active
const getActiveImages = async (req, res, next) => {
  try {
    const images = await imagesService.getActiveImages();
    res.status(200).json({ ok: true, total: images.length, data: images });
  } catch (error) {
    next(error);
  }
};

// GET /api/images/deleted
const getDeletedImages = async (req, res, next) => {
  try {
    const images = await imagesService.getDeletedImages();
    res.status(200).json({ ok: true, total: images.length, data: images });
  } catch (error) {
    next(error);
  }
};

// GET /api/images/:id
const getImageById = async (req, res, next) => {
  try {
    const image = await imagesService.getImageById(req.params.id);
    res.status(200).json({ ok: true, data: image });
  } catch (error) {
    next(error);
  }
};

// POST /api/images
const postImage = async (req, res, next) => {
  try {
    const image = await imagesService.createImage(req.body);
    res.status(201).json({ ok: true, message: "Imagen creada correctamente", data: image });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/images/:id
const patchImage = async (req, res, next) => {
  try {
    const image = await imagesService.updateImage(req.params.id, req.body);
    res.status(200).json({ ok: true, message: "Imagen modificada correctamente", data: image });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/images/:id/active
const patchActive = async (req, res, next) => {
  try {
    const image = await imagesService.setActive(req.params.id, req.body);
    res.status(200).json({
      ok: true,
      message: image.isActive ? "Imagen activada correctamente" : "Imagen desactivada correctamente",
      data: image,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/images/:id/softdelete
const patchSoftDelete = async (req, res, next) => {
  try {
    const image = await imagesService.softDeleteImage(req.params.id);
    res.status(200).json({ ok: true, message: "Imagen eliminada correctamente", data: image });
  } catch (error) {
    next(error);
  }
};

export default {
  getImages, getActiveImages, getDeletedImages, getImageById, postImage, patchImage, patchActive, patchSoftDelete,
};
