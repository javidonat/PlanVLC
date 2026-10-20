import rolesService from "../services/roles.service.js";

// El controlador recibe la petición HTTP y devuelve la respuesta JSON
// No contiene lógica de negocio, solo llama al servicio

// GET /api/roles
const getRoles = async (req, res, next) => {
  try {
    const roles = await rolesService.getAllRoles();
    res.status(200).json({ ok: true, total: roles.length, data: roles });
  } catch (error) {
    next(error); // Pasa el error al middleware de errores
  }
};

// GET /api/roles/active
const getActiveRoles = async (req, res, next) => {
  try {
    const roles = await rolesService.getActiveRoles();
    res.status(200).json({ ok: true, total: roles.length, data: roles });
  } catch (error) {
    next(error);
  }
};

// GET /api/roles/deleted
const getDeletedRoles = async (req, res, next) => {
  try {
    const roles = await rolesService.getDeletedRoles();
    res.status(200).json({ ok: true, total: roles.length, data: roles });
  } catch (error) {
    next(error);
  }
};

// GET /api/roles/:id
const getRoleById = async (req, res, next) => {
  try {
    const role = await rolesService.getRoleById(req.params.id);
    res.status(200).json({ ok: true, data: role });
  } catch (error) {
    next(error);
  }
};

// POST /api/roles
const postRole = async (req, res, next) => {
  try {
    const role = await rolesService.createRole(req.body);
    res.status(201).json({ ok: true, message: "Rol creado correctamente", data: role });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/roles/:id
const patchRole = async (req, res, next) => {
  try {
    const role = await rolesService.updateRole(req.params.id, req.body);
    res.status(200).json({ ok: true, message: "Rol modificado correctamente", data: role });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/roles/:id/active
const patchActive = async (req, res, next) => {
  try {
    const role = await rolesService.setActive(req.params.id, req.body);
    res.status(200).json({
      ok: true,
      message: role.isActive ? "Rol activado correctamente" : "Rol desactivado correctamente",
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/roles/:id/softdelete
const patchSoftDelete = async (req, res, next) => {
  try {
    const role = await rolesService.softDeleteRole(req.params.id);
    res.status(200).json({ ok: true, message: "Rol eliminado correctamente", data: role });
  } catch (error) {
    next(error);
  }
};

export default {
  getRoles, getActiveRoles, getDeletedRoles, getRoleById, postRole, patchRole, patchActive, patchSoftDelete,
};
