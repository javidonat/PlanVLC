// Registra todos los modelos de una vez. Hace falta para que populate() encuentre
// los modelos referenciados (Category, Venue...) aunque nadie los haya importado antes.
import Plan from "./plan.model.js";
import Session from "./session.model.js";
import Organizer from "./organizer.model.js";
import Category from "./category.model.js";
import Venue from "./venue.model.js";
import Image from "./image.model.js";
import Role from "./role.model.js";
import User from "./user.model.js";
import Profile from "./profile.model.js";
import BlacklistedToken from "./blacklist.model.js";

export { Plan, Session, Organizer, Category, Venue, Image, Role, User, Profile, BlacklistedToken };
