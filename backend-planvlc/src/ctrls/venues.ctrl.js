import venuesService from "../services/venues.service.js";

// El controlador recibe la petición HTTP y devuelve la respuesta JSON
// No contiene lógica de negocio, solo llama al servicio

// GET /api/venues
const getVenues = async (req, res, next) => {
  try {
    const venues = await venuesService.getAllVenues();
    res.status(200).json({ ok: true, total: venues.length, data: venues });
  } catch (error) {
    next(error); // Pasa el error al middleware de errores
  }
};

// GET /api/venues/active
const getActiveVenues = async (req, res, next) => {
  try {
    const venues = await venuesService.getActiveVenues();
    res.status(200).json({ ok: true, total: venues.length, data: venues });
  } catch (error) {
    next(error);
  }
};

// GET /api/venues/deleted
const getDeletedVenues = async (req, res, next) => {
  try {
    const venues = await venuesService.getDeletedVenues();
    res.status(200).json({ ok: true, total: venues.length, data: venues });
  } catch (error) {
    next(error);
  }
};

// GET /api/venues/:id
const getVenueById = async (req, res, next) => {
  try {
    const venue = await venuesService.getVenueById(req.params.id);
    res.status(200).json({ ok: true, data: venue });
  } catch (error) {
    next(error);
  }
};

// POST /api/venues
const postVenue = async (req, res, next) => {
  try {
    const venue = await venuesService.createVenue(req.body);
    res.status(201).json({ ok: true, message: "Lugar creado correctamente", data: venue });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/venues/:id
const patchVenue = async (req, res, next) => {
  try {
    const venue = await venuesService.updateVenue(req.params.id, req.body);
    res.status(200).json({ ok: true, message: "Lugar modificado correctamente", data: venue });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/venues/:id/active
const patchActive = async (req, res, next) => {
  try {
    const venue = await venuesService.setActive(req.params.id, req.body);
    res.status(200).json({
      ok: true,
      message: venue.isActive ? "Lugar activado correctamente" : "Lugar desactivado correctamente",
      data: venue,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/venues/:id/softdelete
const patchSoftDelete = async (req, res, next) => {
  try {
    const venue = await venuesService.softDeleteVenue(req.params.id);
    res.status(200).json({ ok: true, message: "Lugar eliminado correctamente", data: venue });
  } catch (error) {
    next(error);
  }
};

export default {
  getVenues, getActiveVenues, getDeletedVenues, getVenueById, postVenue, patchVenue, patchActive, patchSoftDelete,
};
