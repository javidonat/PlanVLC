import shopRepo from "../repos/shop.repo.js";
import AppError from "./utils/AppError.js";

// Tienda pública: carruseles del home, listado del shop y detalle del plan.
// El controlador le pasa los query params ya validados (schemas/shop.schema.js)

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 6;

const getCategories = () => shopRepo.findCategories();
const getOrganizers = () => shopRepo.findOrganizers();
const getVenues = () => shopRepo.findVenues();

// Traduce los slugs de la URL a _id (en paralelo). Un slug que no llega se queda en undefined;
// uno que no existe (o no se puede mostrar) se queda en null
const resolveSlugs = async ({ category, organizer, venue }) => {
  const [categoryId, organizerId, venueId] = await Promise.all([
    category ? shopRepo.findCategoryIdBySlug(category) : undefined,
    organizer ? shopRepo.findOrganizerIdBySlug(organizer) : undefined,
    venue ? shopRepo.findVenueIdBySlug(venue) : undefined,
  ]);
  return { category: categoryId, organizer: organizerId, venue: venueId };
};

// GET /plans: se queda solo con los filtros que lleguen y pone página y límite por defecto
const getPlans = async (query = {}) => {
  const page = query.page ?? DEFAULT_PAGE;
  const limit = query.limit ?? DEFAULT_LIMIT;

  const ids = await resolveSlugs(query);
  // Si se filtra por algo que no existe no hay planes que buscar
  if (ids.category === null || ids.organizer === null || ids.venue === null) {
    return { items: [], total: 0, page, limit, totalPages: 0 };
  }

  const params = {
    ...ids,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    search: query.search || undefined, // búsqueda vacía = sin búsqueda
    page,
    limit,
  };

  const { items, total } = await shopRepo.findPlans(params);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

const getPlanBySlug = async (slug) => {
  const plan = await shopRepo.findPlanBySlug(slug);
  if (!plan) {
    throw new AppError("Plan no encontrado", 404);
  }
  return plan;
};

// Sesiones del plan que se pueden reservar (la reserva llegará en otra fase)
const getPlanSessions = async (slug) => {
  const plan = await getPlanBySlug(slug);
  return shopRepo.findUpcomingSessions(plan._id);
};

export default { getCategories, getOrganizers, getVenues, getPlans, getPlanBySlug, getPlanSessions };
