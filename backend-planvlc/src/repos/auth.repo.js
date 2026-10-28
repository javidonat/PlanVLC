import { User } from "../models/index.js";

// Consultas de usuarios que solo necesita la autenticación (login y el middleware).
// Es la única que lee passwordHash (en el modelo tiene select: false)

const ROLE = { path: "roleId", select: "name isActive deletedAt" };

// Login: el usuario (no eliminado) con ese email, con el hash de su contraseña y su rol
const findByEmailWithPassword = (email) => {
  return User.findOne({ email: email.toLowerCase(), deletedAt: null })
    .select("+passwordHash")
    .populate(ROLE)
    .lean();
};

// Middleware de autenticación: el usuario del token, con su rol
const findByIdForAuth = (id) => {
  return User.findOne({ _id: id, deletedAt: null }).populate(ROLE).lean();
};

const updateLastLogin = (id) => {
  return User.updateOne({ _id: id }, { lastLoginAt: new Date() });
};

export default { findByEmailWithPassword, findByIdForAuth, updateLastLogin };
