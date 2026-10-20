import { Category, Organizer, Plan, Role, User, Venue } from "../models/index.js";

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

// Imágenes: el modelo al que apunta entityId depende de entityType
const ENTITY_MODELS = { plan: Plan, venue: Venue, category: Category, organizer: Organizer, user: User };

const entityExists = async (entityType, id) => Boolean(await ENTITY_MODELS[entityType].exists({ _id: id, deletedAt: null }));

// Nombre de los documentos a los que pertenecen las imágenes (los planes tienen title en vez de name).
// Incluye los desactivados y eliminados, como el listado del panel
const entityNames = (entityType, ids) => {
  return ENTITY_MODELS[entityType].find({ _id: { $in: ids } }).select("name title").lean();
};

export default { categoriesExist, organizerExists, venueExists, roleExists, usersExist, entityExists, entityNames };
