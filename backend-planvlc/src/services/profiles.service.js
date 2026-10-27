import mongoose from "mongoose";
import profilesRepo from "../repos/profiles.repo.js";
import usersRepo from "../repos/users.repo.js";
import AppError from "./utils/AppError.js";
import { defaultAvatar } from "./utils/avatar.js";

// Perfil del usuario (User 1 → 1 Profile). Quién puede verlo o editarlo lo decide
// el middleware isOwnerOrAdmin en la ruta: aquí solo está la lógica de negocio

const FIELDS = ["firstName", "lastName", "phone", "bio", "avatar"];

const validateUser = async (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new AppError("El id del usuario no es válido", 400);
  }
  if (!(await usersRepo.findById(userId))) {
    throw new AppError("Usuario no encontrado", 404);
  }
};

// GET /:userId. Si aún no tiene perfil, se devuelve vacío
const getProfile = async (userId) => {
  await validateUser(userId);

  const profile = await profilesRepo.findByUserId(userId);
  return profile || { userId, firstName: null, lastName: null, phone: null, bio: null, avatar: defaultAvatar(userId) };
};

// PATCH /:userId: modifica solo los campos enviados (null = vaciar el campo; en avatar, volver al robot)
const updateProfile = async (userId, body) => {
  await validateUser(userId);

  const data = {};
  for (const field of FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  // Quitar el avatar (null) = volver al robot por defecto
  if (data.avatar === null) data.avatar = defaultAvatar(userId);
  if (Object.keys(data).length === 0) {
    throw new AppError("No se ha enviado ningún campo válido para modificar", 400);
  }

  return profilesRepo.upsertByUserId(userId, data);
};

export default { getProfile, updateProfile };
