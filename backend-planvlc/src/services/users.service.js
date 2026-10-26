import mongoose from "mongoose";
import usersRepo from "../repos/users.repo.js";
import organizersRepo from "../repos/organizers.repo.js";
import refsRepo from "../repos/refs.repo.js";
import imagesService from "./images.service.js";
import AppError from "./utils/AppError.js";
import { hashPassword } from "./utils/password.js";

// El servicio contiene la lógica de negocio
// No sabe nada de HTTP (req, res), solo trabaja con datos

// Campos que se pueden enviar desde fuera (el resto se ignora)
// passwordHash, lastLoginAt, isActive y deletedAt no están: los gestiona el servidor.
// La contraseña (password) se guarda como hash y el avatar (avatarImageUrl) en "images"
const FIELDS = ["name", "email", "roleId", "status"];

// ---------- Funciones auxiliares ----------

const validateId = (id) => {
  // Comprobamos que el id tiene formato válido de MongoDB antes de buscar
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("El id del usuario no es válido", 400);
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

// Comprueba el email (único) y el rol (tiene que existir y estar activo) antes de guardar
const validateData = async (data, excludeId) => {
  if (data.email && (await usersRepo.emailExists(data.email, excludeId))) {
    throw new AppError("Ya existe un usuario con ese email", 409);
  }
  if (data.roleId && !(await refsRepo.roleExists(data.roleId))) {
    throw new AppError("El rol indicado no existe o está desactivado", 400);
  }
};

// Avatar del usuario: se envía como URL y se guarda en "images" (entityType "user").
// null = quitar el avatar
const saveAvatar = async (user, avatarImageUrl) => {
  const urls = avatarImageUrl ? [avatarImageUrl] : [];
  await imagesService.replaceImages("user", user._id, "avatar", urls, user.name);
};

// ---------- Operaciones ----------

const getAllUsers = async () => {
  return usersRepo.findAll();
};

const getActiveUsers = async () => {
  return usersRepo.findActive();
};

const getDeletedUsers = async () => {
  return usersRepo.findDeleted();
};

// GET /:id
const getUserById = async (id) => {
  validateId(id);

  const user = await usersRepo.findById(id);
  if (!user) {
    throw new AppError("Usuario no encontrado", 404);
  }
  return user;
};

// POST: crea un usuario nuevo. La contraseña nunca se guarda en claro: solo su hash
const createUser = async (body) => {
  const data = pickFields(body);
  await validateData(data);
  data.passwordHash = await hashPassword(body.password);

  const user = await usersRepo.create(data);

  if (body.avatarImageUrl === undefined) return user;
  // El avatar necesita el _id del usuario: se guarda después y se devuelve el usuario ya con él
  await saveAvatar(user, body.avatarImageUrl);
  return usersRepo.findById(user._id);
};

// PATCH /:id: modifica solo los campos que se envían y deja el resto igual.
// Si llega una contraseña nueva, se cambia (guardando su hash)
const updateUser = async (id, body) => {
  validateId(id);

  const data = pickFields(body);
  if (body.password) {
    data.passwordHash = await hashPassword(body.password);
  }
  const hasData = Object.keys(data).length > 0;
  if (!hasData && body.avatarImageUrl === undefined) {
    throw new AppError("No se ha enviado ningún campo válido para modificar", 400);
  }
  await validateData(data, id);

  // Si solo cambia el avatar no hay nada que actualizar en el usuario, pero debe existir y estar activo
  const user = hasData ? await usersRepo.update(id, data) : await usersRepo.findById(id);
  if (!user) {
    throw new AppError("Usuario no encontrado", 404);
  }

  if (body.avatarImageUrl === undefined) return user;
  await saveAvatar(user, body.avatarImageUrl);
  return usersRepo.findById(id);
};

// PATCH /:id/active: activa o desactiva el usuario
const setActive = async (id, body) => {
  validateId(id);

  if (typeof body?.isActive !== "boolean") {
    throw new AppError("isActive es obligatorio y debe ser true o false", 400);
  }

  // No se puede desactivar si gestiona organizadores activos: quedarían organizadores activos con un usuario desactivado
  if (!body.isActive) {
    const organizers = await organizersRepo.countByUser(id, true);
    if (organizers === 1) {
      throw new AppError("No se puede desactivar: gestiona 1 organizador activo. Quítalo de ese organizador o desactiva el organizador primero", 409);
    }
    if (organizers > 1) {
      throw new AppError(`No se puede desactivar: gestiona ${organizers} organizadores activos. Quítalo de esos organizadores o desactívalos primero`, 409);
    }
  }

  // No se puede activar si su rol está desactivado
  if (body.isActive) {
    const current = await usersRepo.findAnyById(id);
    if (current && !(await refsRepo.roleExists(current.roleId))) {
      throw new AppError("No se puede activar: su rol está desactivado. Activa el rol o cámbiaselo primero", 409);
    }
  }

  // El repositorio solo actualiza usuarios con deletedAt: null (uno eliminado no se reactiva)
  const user = await usersRepo.setActive(id, { isActive: body.isActive });
  if (user) {
    return user;
  }

  // No se ha actualizado nada: o no existe, o está eliminado
  if (await usersRepo.existsById(id)) {
    throw new AppError("El usuario está eliminado y no se puede activar ni desactivar", 409);
  }
  throw new AppError("Usuario no encontrado", 404);
};

// PATCH /:id/softdelete: isActive = false y deletedAt = ahora (el documento no se borra).
// No se puede eliminar si gestiona algún organizador: el organizador se quedaría con un usuario que ya no existe
const softDeleteUser = async (id) => {
  validateId(id);

  const organizers = await organizersRepo.countByUser(id);
  if (organizers === 1) {
    throw new AppError("No se puede eliminar: gestiona 1 organizador. Quítalo de ese organizador o desactiva el usuario", 409);
  }
  if (organizers > 1) {
    throw new AppError(`No se puede eliminar: gestiona ${organizers} organizadores. Quítalo de esos organizadores o desactiva el usuario`, 409);
  }

  const user = await usersRepo.softDelete(id);
  if (!user) {
    throw new AppError("Usuario no encontrado", 404);
  }
  return user;
};

export default {
  getAllUsers,
  getActiveUsers,
  getDeletedUsers,
  getUserById,
  createUser,
  updateUser,
  setActive,
  softDeleteUser,
};
