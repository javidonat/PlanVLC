import { Category, Organizer, Role, User, Venue } from "../models/index.js";

// MongoDB NO valida que un ObjectId apunte a algo que exista (no hay claves foráneas).
// Estas funciones sirven para comprobarlo a mano antes de guardar (un plan, un usuario, un organizador...).
// Solo cuentan los documentos no eliminados (deletedAt: null).

const countByIds = (Model, ids) => {
  return Model.countDocuments({ _id: { $in: ids }, deletedAt: null });
};

const categoriesExist = async (ids) => {
  const unique = [...new Set(ids.map(String))];
  return (await countByIds(Category, unique)) === unique.length;
};

const organizerExists = async (id) => Boolean(await Organizer.exists({ _id: id, deletedAt: null }));

const venueExists = async (id) => Boolean(await Venue.exists({ _id: id, deletedAt: null }));

const roleExists = async (id) => Boolean(await Role.exists({ _id: id, deletedAt: null }));

const usersExist = async (ids) => {
  const unique = [...new Set(ids.map(String))];
  return (await countByIds(User, unique)) === unique.length;
};

export default { categoriesExist, organizerExists, venueExists, roleExists, usersExist };
