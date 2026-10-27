import { Profile } from "../models/index.js";
import { defaultAvatar } from "../services/utils/avatar.js";

// El repositorio es la única capa que habla con MongoDB directamente

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

export default { findByUserId, create, upsertByUserId };
