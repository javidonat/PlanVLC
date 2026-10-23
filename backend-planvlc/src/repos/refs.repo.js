import { Category, Organizer, Plan, Role, User, Venue } from "../models/index.js";

// MongoDB NO valida que un ObjectId apunte a algo que exista (no hay claves foráneas).
// Estas funciones sirven para comprobarlo a mano antes de guardar (un plan, un usuario, un organizador...).
// Solo cuentan los documentos activos y no eliminados (isActive: true, deletedAt: null):
// un documento activo no puede apuntar a otro desactivado. Las imágenes (entityExists) son la excepción.
const ACTIVE = { isActive: true, deletedAt: null };

const countByIds = (Model, ids) => {
  return Model.countDocuments({ _id: { $in: ids }, ...ACTIVE });
};

const categoriesExist = async (ids) => {
  const unique = [...new Set(ids.map(String))];
  return (await countByIds(Category, unique)) === unique.length;
};

const organizerExists = async (id) => Boolean(await Organizer.exists({ _id: id, ...ACTIVE }));

const venueExists = async (id) => Boolean(await Venue.exists({ _id: id, ...ACTIVE }));

const roleExists = async (id) => Boolean(await Role.exists({ _id: id, ...ACTIVE }));

const usersExist = async (ids) => {
  const unique = [...new Set(ids.map(String))];
  return (await countByIds(User, unique)) === unique.length;
};

// Imágenes: el modelo al que apunta entityId depende de entityType.
// Aquí basta con que la entidad no esté eliminada: las imágenes forman parte del documento
const ENTITY_MODELS = { plan: Plan, venue: Venue, category: Category, organizer: Organizer, user: User };

// Reglas de negocio con status: ¿alguno de esos documentos tiene uno de estos estados?
const anyWithStatus = async (entityType, ids, statuses) => {
  return Boolean(await ENTITY_MODELS[entityType].exists({ _id: { $in: ids }, status: { $in: statuses } }));
};

const entityExists = async (entityType, id) => Boolean(await ENTITY_MODELS[entityType].exists({ _id: id, deletedAt: null }));

// Nombre de los documentos a los que pertenecen las imágenes (los planes tienen title en vez de name).
// Incluye los desactivados y eliminados, como el listado del panel
const entityNames = (entityType, ids) => {
  return ENTITY_MODELS[entityType].find({ _id: { $in: ids } }).select("name title").lean();
};

export default { categoriesExist, organizerExists, venueExists, roleExists, usersExist, anyWithStatus, entityExists, entityNames };
