import mongoose from "mongoose";
import rolesRepo from "../repos/roles.repo.js";
import usersRepo from "../repos/users.repo.js";
import AppError from "./utils/AppError.js";

// El servicio contiene la lógica de negocio
// No sabe nada de HTTP (req, res), solo trabaja con datos

// Campos que se pueden enviar desde fuera (el resto se ignora)
// isActive y deletedAt no están: los gestiona el servidor
const FIELDS = ["name", "description", "permissions"];

// ---------- Funciones auxiliares ----------

const validateId = (id) => {
  // Comprobamos que el id tiene formato válido de MongoDB antes de buscar
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("El id del rol no es válido", 400);
  }
};

// Se queda solo con los campos permitidos que vengan en el body
const pickFields = (body = {}) => {
  const data = {};
  for (const field of FIELDS) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }
  return data;
};

// El nombre del rol es único (admin, editor...): mejor un mensaje claro que el error 11000 de MongoDB
const checkName = async (name, excludeId) => {
  if (name && (await rolesRepo.nameExists(name, excludeId))) {
    throw new AppError("Ya existe un rol con ese nombre", 409);
  }
};

// ---------- Operaciones ----------

const getAllRoles = async () => {
  return rolesRepo.findAll();
};

const getActiveRoles = async () => {
  return rolesRepo.findActive();
};

const getDeletedRoles = async () => {
  return rolesRepo.findDeleted();
};

// GET /:id
const getRoleById = async (id) => {
  validateId(id);

  const role = await rolesRepo.findById(id);
  if (!role) {
    throw new AppError("Rol no encontrado", 404);
  }
  return role;
};

// POST: crea un rol nuevo
const createRole = async (body) => {
  const data = pickFields(body);
  await checkName(data.name);
  return rolesRepo.create(data);
};

// PATCH /:id: modifica solo los campos que se envían y deja el resto igual
const updateRole = async (id, body) => {
  validateId(id);

  const data = pickFields(body);
  if (Object.keys(data).length === 0) {
    throw new AppError("No se ha enviado ningún campo válido para modificar", 400);
  }
  await checkName(data.name, id);

  const role = await rolesRepo.update(id, data);
  if (!role) {
    throw new AppError("Rol no encontrado", 404);
  }
  return role;
};

// PATCH /:id/active: activa o desactiva el rol
const setActive = async (id, body) => {
  validateId(id);

  if (typeof body?.isActive !== "boolean") {
    throw new AppError("isActive es obligatorio y debe ser true o false", 400);
  }

  // El repositorio solo actualiza roles con deletedAt: null (uno eliminado no se reactiva)
  const role = await rolesRepo.setActive(id, { isActive: body.isActive });
  if (role) {
    return role;
  }

  // No se ha actualizado nada: o no existe, o está eliminado
  if (await rolesRepo.existsById(id)) {
    throw new AppError("El rol está eliminado y no se puede activar ni desactivar", 409);
  }
  throw new AppError("Rol no encontrado", 404);
};

// PATCH /:id/softdelete: isActive = false y deletedAt = ahora (el documento no se borra).
// No se puede eliminar si hay usuarios con ese rol: se quedarían sin rol
const softDeleteRole = async (id) => {
  validateId(id);

  const users = await usersRepo.countByRole(id);
  if (users === 1) {
    throw new AppError("No se puede eliminar: hay 1 usuario con este rol. Cámbiale el rol o desactiva el rol", 409);
  }
  if (users > 1) {
    throw new AppError(`No se puede eliminar: hay ${users} usuarios con este rol. Cámbiales el rol o desactiva el rol`, 409);
  }

  const role = await rolesRepo.softDelete(id);
  if (!role) {
    throw new AppError("Rol no encontrado", 404);
  }
  return role;
};

export default {
  getAllRoles,
  getActiveRoles,
  getDeletedRoles,
  getRoleById,
  createRole,
  updateRole,
  setActive,
  softDeleteRole,
};
