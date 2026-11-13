import shopRepo from "../repos/shop.repo.js";
import AppError from "./utils/AppError.js";

// Tienda pública: carruseles del home, listado del shop y detalle del plan.
// El controlador le pasa los query params ya validados (schemas/shop.schema.js)

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 6;
const DEFAULT_SORT = "popular"; // primero los más visitados

const getCategories = () => shopRepo.findCategories();
const getOrganizers = () => shopRepo.findOrganizers();
const getVenues = () => shopRepo.findVenues();

// Traduce los slugs de la URL a _id (en paralelo). Un filtro que no llega se queda en undefined;
// si ninguno de sus slugs existe (o se puede mostrar), en null. Los que no existen se ignoran
const toIds = async (slugs, findIds) => {
  if (!slugs?.length) return undefined;
  const ids = await findIds(slugs);
  return ids.length ? ids : null;
};

const resolveSlugs = async ({ category, organizer, venue }) => {
  const [categoryIds, organizerIds, venueIds] = await Promise.all([
    toIds(category, shopRepo.findCategoryIdsBySlugs),
    toIds(organizer, shopRepo.findOrganizerIdsBySlugs),
    toIds(venue, shopRepo.findVenueIdsBySlugs),
  ]);
  return { category: categoryIds, organizer: organizerIds, venue: venueIds };
};

// Filtros de la consulta ya listos para el repositorio (slugs → _id).
// null si se filtra solo por categorías, organizadores o lugares que no existen: no habrá resultados
const buildFilters = async (query) => {
  const ids = await resolveSlugs(query);
  if (ids.category === null || ids.organizer === null || ids.venue === null) return null;
  return {
    ...ids,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    search: query.search || undefined, // búsqueda vacía = sin búsqueda
  };
};

// GET /plans: se queda solo con los filtros que lleguen y pone orden, página y límite por defecto
const getPlans = async (query = {}) => {
  const page = query.page ?? DEFAULT_PAGE;
  const limit = query.limit ?? DEFAULT_LIMIT;

  const filters = await buildFilters(query);
  // Si se filtra por algo que no existe no hay planes que buscar
  if (!filters) return { items: [], total: 0, page, limit, totalPages: 0 };

  const { items, total } = await shopRepo.findPlans({ ...filters, sort: query.sort ?? DEFAULT_SORT, page, limit });
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

// "2027-10" → { from: 1/10/2027, to: 1/11/2027 } (UTC).
// Se amplía un día por cada lado: el frontend coloca cada sesión en su día con la hora local
const monthRange = (month) => {
  const [year, m] = month.split("-").map(Number);
  const DAY = 24 * 60 * 60 * 1000;
  return {
    from: new Date(Date.UTC(year, m - 1, 1) - DAY),
    to: new Date(Date.UTC(year, m, 1) + DAY),
  };
};

const monthOf = (date) => date.toISOString().slice(0, 7);

// GET /sessions: sesiones de un mes de los planes que cumplen los filtros (vista calendario).
// Sin month se abre el mes de la primera sesión que viene (o el actual si no hay ninguna)
const getSessions = async (query = {}) => {
  const filters = await buildFilters(query);
  const planIds = filters ? await shopRepo.findPlanIds(filters) : [];

  let month = query.month;
  if (!month) {
    const first = planIds.length ? await shopRepo.findFirstUpcomingDate(planIds) : null;
    month = monthOf(first ?? new Date());
  }

  if (!planIds.length) return { month, items: [] };
  const { from, to } = monthRange(month);
  const items = await shopRepo.findSessionsBetween(planIds, from, to);
  return { month, items };
};

// Detalle del plan. Cuenta una visita (orden "más visitados")
const getPlanBySlug = async (slug) => {
  const plan = await shopRepo.findPlanBySlugAndCountView(slug);
  if (!plan) {
    throw new AppError("Plan no encontrado", 404);
  }
  return plan;
};

// Sesiones del plan que se pueden reservar (la reserva llegará en otra fase)
const getPlanSessions = async (slug) => {
  const planId = await shopRepo.findPlanIdBySlug(slug);
  if (!planId) {
    throw new AppError("Plan no encontrado", 404);
  }
  return shopRepo.findUpcomingSessions(planId);
};

export default { getCategories, getOrganizers, getVenues, getPlans, getSessions, getPlanBySlug, getPlanSessions };
