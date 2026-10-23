import sessionsService from "../services/sessions.service.js";

// El controlador recibe la petición HTTP y devuelve la respuesta JSON
// No contiene lógica de negocio, solo llama al servicio

// GET /api/sessions
const getSessions = async (req, res, next) => {
  try {
    const sessions = await sessionsService.getAllSessions();
    res.status(200).json({ ok: true, total: sessions.length, data: sessions });
  } catch (error) {
    next(error); // Pasa el error al middleware de errores
  }
};

// GET /api/sessions/active
const getActiveSessions = async (req, res, next) => {
  try {
    const sessions = await sessionsService.getActiveSessions();
    res.status(200).json({ ok: true, total: sessions.length, data: sessions });
  } catch (error) {
    next(error);
  }
};

// GET /api/sessions/deleted
const getDeletedSessions = async (req, res, next) => {
  try {
    const sessions = await sessionsService.getDeletedSessions();
    res.status(200).json({ ok: true, total: sessions.length, data: sessions });
  } catch (error) {
    next(error);
  }
};

// GET /api/sessions/:id
const getSessionById = async (req, res, next) => {
  try {
    const session = await sessionsService.getSessionById(req.params.id);
    res.status(200).json({ ok: true, data: session });
  } catch (error) {
    next(error);
  }
};

// POST /api/sessions
const postSession = async (req, res, next) => {
  try {
    const session = await sessionsService.createSession(req.body);
    res.status(201).json({ ok: true, message: "Sesión creada correctamente", data: session });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/sessions/:id
const patchSession = async (req, res, next) => {
  try {
    const session = await sessionsService.updateSession(req.params.id, req.body);
    res.status(200).json({ ok: true, message: "Sesión modificada correctamente", data: session });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/sessions/:id/active
const patchActive = async (req, res, next) => {
  try {
    const session = await sessionsService.setActive(req.params.id, req.body);
    res.status(200).json({
      ok: true,
      message: session.isActive ? "Sesión activada correctamente" : "Sesión desactivada correctamente",
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/sessions/:id/softdelete
const patchSoftDelete = async (req, res, next) => {
  try {
    const session = await sessionsService.softDeleteSession(req.params.id);
    res.status(200).json({ ok: true, message: "Sesión eliminada correctamente", data: session });
  } catch (error) {
    next(error);
  }
};

export default {
  getSessions, getActiveSessions, getDeletedSessions, getSessionById, postSession, patchSession, patchActive, patchSoftDelete,
};
