import usersService from "../services/users.service.js";

// El controlador recibe la petición HTTP y devuelve la respuesta JSON
// No contiene lógica de negocio, solo llama al servicio

// GET /api/users
const getUsers = async (req, res, next) => {
  try {
    const users = await usersService.getAllUsers();
    res.status(200).json({ ok: true, total: users.length, data: users });
  } catch (error) {
    next(error); // Pasa el error al middleware de errores
  }
};

// GET /api/users/active
const getActiveUsers = async (req, res, next) => {
  try {
    const users = await usersService.getActiveUsers();
    res.status(200).json({ ok: true, total: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/deleted
const getDeletedUsers = async (req, res, next) => {
  try {
    const users = await usersService.getDeletedUsers();
    res.status(200).json({ ok: true, total: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id
const getUserById = async (req, res, next) => {
  try {
    const user = await usersService.getUserById(req.params.id);
    res.status(200).json({ ok: true, data: user });
  } catch (error) {
    next(error);
  }
};

// POST /api/users
const postUser = async (req, res, next) => {
  try {
    const user = await usersService.createUser(req.body);
    res.status(201).json({ ok: true, message: "Usuario creado correctamente", data: user });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:id
const patchUser = async (req, res, next) => {
  try {
    const user = await usersService.updateUser(req.params.id, req.body);
    res.status(200).json({ ok: true, message: "Usuario modificado correctamente", data: user });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:id/active
const patchActive = async (req, res, next) => {
  try {
    const user = await usersService.setActive(req.params.id, req.body);
    res.status(200).json({
      ok: true,
      message: user.isActive ? "Usuario activado correctamente" : "Usuario desactivado correctamente",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:id/softdelete
const patchSoftDelete = async (req, res, next) => {
  try {
    const user = await usersService.softDeleteUser(req.params.id);
    res.status(200).json({ ok: true, message: "Usuario eliminado correctamente", data: user });
  } catch (error) {
    next(error);
  }
};

export default {
  getUsers, getActiveUsers, getDeletedUsers, getUserById, postUser, patchUser, patchActive, patchSoftDelete,
};
