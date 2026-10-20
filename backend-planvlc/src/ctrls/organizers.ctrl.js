import organizersService from "../services/organizers.service.js";

// El controlador recibe la petición HTTP y devuelve la respuesta JSON
// No contiene lógica de negocio, solo llama al servicio

// GET /api/organizers
const getOrganizers = async (req, res, next) => {
  try {
    const organizers = await organizersService.getAllOrganizers();
    res.status(200).json({ ok: true, total: organizers.length, data: organizers });
  } catch (error) {
    next(error); // Pasa el error al middleware de errores
  }
};

// GET /api/organizers/active
const getActiveOrganizers = async (req, res, next) => {
  try {
    const organizers = await organizersService.getActiveOrganizers();
    res.status(200).json({ ok: true, total: organizers.length, data: organizers });
  } catch (error) {
    next(error);
  }
};

// GET /api/organizers/deleted
const getDeletedOrganizers = async (req, res, next) => {
  try {
    const organizers = await organizersService.getDeletedOrganizers();
    res.status(200).json({ ok: true, total: organizers.length, data: organizers });
  } catch (error) {
    next(error);
  }
};

// GET /api/organizers/:id
const getOrganizerById = async (req, res, next) => {
  try {
    const organizer = await organizersService.getOrganizerById(req.params.id);
    res.status(200).json({ ok: true, data: organizer });
  } catch (error) {
    next(error);
  }
};

// POST /api/organizers
const postOrganizer = async (req, res, next) => {
  try {
    const organizer = await organizersService.createOrganizer(req.body);
    res.status(201).json({ ok: true, message: "Organizador creado correctamente", data: organizer });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/organizers/:id
const patchOrganizer = async (req, res, next) => {
  try {
    const organizer = await organizersService.updateOrganizer(req.params.id, req.body);
    res.status(200).json({ ok: true, message: "Organizador modificado correctamente", data: organizer });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/organizers/:id/active
const patchActive = async (req, res, next) => {
  try {
    const organizer = await organizersService.setActive(req.params.id, req.body);
    res.status(200).json({
      ok: true,
      message: organizer.isActive ? "Organizador activado correctamente" : "Organizador desactivado correctamente",
      data: organizer,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/organizers/:id/softdelete
const patchSoftDelete = async (req, res, next) => {
  try {
    const organizer = await organizersService.softDeleteOrganizer(req.params.id);
    res.status(200).json({ ok: true, message: "Organizador eliminado correctamente", data: organizer });
  } catch (error) {
    next(error);
  }
};

export default {
  getOrganizers, getActiveOrganizers, getDeletedOrganizers, getOrganizerById, postOrganizer, patchOrganizer, patchActive, patchSoftDelete,
};
