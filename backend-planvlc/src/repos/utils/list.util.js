// Piezas comunes de los listados del panel (filtros, búsqueda y paginación)

// Disponibilidad del listado → condición de MongoDB
export const STATE_FILTERS = {
  active: { isActive: true, deletedAt: null },
  inactive: { isActive: false, deletedAt: null },
  deleted: { deletedAt: { $ne: null } },
};

// Escapa los caracteres especiales para que la búsqueda sea texto literal y no una expresión regular
export const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// "contiene el texto, sin distinguir mayúsculas"
export const contains = (text) => ({ $regex: escapeRegex(text), $options: "i" });

// Ejecuta la consulta del listado. Sin page devuelve todos (total: null); con page y limit, solo esa página
// y el total de resultados (en paralelo). collation: para ordenar textos en español (ej. por nombre)
export const findList = async (Model, filter, { sort, populate = [], page, limit, collation }) => {
  const query = Model.find(filter).populate(populate).sort(sort).lean();
  if (collation) query.collation(collation);
  if (!page) return { items: await query, total: null };
  const [items, total] = await Promise.all([query.skip((page - 1) * limit).limit(limit), Model.countDocuments(filter)]);
  return { items, total };
};
