import { User } from "../models/index.js";

// Consultas de usuarios que solo necesita la autenticación (login, logout y el middleware).
// Son las únicas que leen passwordHash y tokenVersion (en el modelo tienen select: false)

const ROLE = { path: "roleId", select: "name isActive deletedAt" };

// Login: el usuario (no eliminado) con ese email, con el hash de su contraseña y su rol
const findByEmailWithPassword = (email) => {
  return User.findOne({ email: email.toLowerCase(), deletedAt: null })
    .select("+passwordHash +tokenVersion")
    .populate(ROLE)
    .lean();
};

// Middleware de autenticación: el usuario del token, con su rol y su tokenVersion
const findByIdForAuth = (id) => {
  return User.findOne({ _id: id, deletedAt: null }).select("+tokenVersion").populate(ROLE).lean();
};

const updateLastLogin = (id) => {
  return User.updateOne({ _id: id }, { lastLoginAt: new Date() });
};

// Logout: los tokens emitidos antes dejan de valer
const incrementTokenVersion = (id) => {
  return User.updateOne({ _id: id }, { $inc: { tokenVersion: 1 } });
};

export default { findByEmailWithPassword, findByIdForAuth, updateLastLogin, incrementTokenVersion };
