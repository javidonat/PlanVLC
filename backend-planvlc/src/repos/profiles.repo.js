import { Profile } from "../models/index.js";

// El repositorio es la única capa que habla con MongoDB directamente

const findByUserId = (userId) => {
  return Profile.findOne({ userId }).lean();
};

// Perfil vacío de un usuario nuevo (lo crea users.service al crear el usuario)
const create = async (userId) => {
  const profile = await Profile.create({ userId });
  return profile.toObject();
};

// Modifica el perfil del usuario y, si aún no tenía, lo crea (upsert)
const upsertByUserId = (userId, data) => {
  return Profile.findOneAndUpdate({ userId }, { ...data, userId }, {
    new: true,
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  }).lean();
};

export default { findByUserId, create, upsertByUserId };
