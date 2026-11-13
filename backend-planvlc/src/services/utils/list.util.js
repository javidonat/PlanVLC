// Paginación de los listados del panel

export const DEFAULT_LIMIT = 10;

// Límite de la página: solo si se pide una página (sin page se devuelven todos)
export const listLimit = (query) => (query.page ? (query.limit ?? DEFAULT_LIMIT) : undefined);

// Resultado del listado: sin page, la lista entera; con page, la página y los datos de paginación
export const toList = ({ items, total }, page, limit) => {
  if (!page) return { items };
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};
