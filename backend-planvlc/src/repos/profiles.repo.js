import { Profile } from "../models/index.js";
import { defaultAvatar } from "../services/utils/avatar.js";

// El repositorio es la única capa que habla con MongoDB directamente

// Todos los perfiles (también los desactivados o eliminados), con el nombre y el email de su usuario
const findAll = () => {
  return Profile.find().populate({ path: "userId", select: "name email" }).sort({ createdAt: -1 }).lean();
};

const findByUserId = (userId) => {
  return Profile.findOne({ userId }).lean();
};

// Perfil vacío de un usuario nuevo, con el robot como avatar (lo crea users.service al crear el usuario)
const create = async (userId) => {
  const profile = await Profile.create({ userId, avatar: defaultAvatar(userId) });
  return profile.toObject();
};

// Modifica el perfil del usuario y, si aún no tenía, lo crea (upsert) con el robot como avatar
const upsertByUserId = (userId, data) => {
  const update = { $set: { ...data, userId } };
  if (data.avatar === undefined) update.$setOnInsert = { avatar: defaultAvatar(userId) };
  return Profile.findOneAndUpdate({ userId }, update, {
    new: true,
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  }).lean();
};

// Integridad referencial con users: el perfil se activa/desactiva junto a su usuario
const setActiveByUserId = (userId, isActive) => {
  return Profile.updateOne({ userId, deletedAt: null }, { isActive });
};

// Soft delete del perfil cuando se elimina su usuario
const softDeleteByUserId = (userId) => {
  return Profile.updateOne({ userId, deletedAt: null }, { isActive: false, deletedAt: new Date() });
};

export default { findAll, findByUserId, create, upsertByUserId, setActiveByUserId, softDeleteByUserId };
