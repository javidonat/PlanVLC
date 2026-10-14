import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import conectarDB from "./config/db.js";
import { Plan, Session, Organizer, Category, Venue, Image, Role, User } from "./models/index.js";
import { generateSlug } from "./services/utils/slug.util.js";

// Seed: deja la base de datos lista con datos de ejemplo.
// Orden: primero lo que no depende de nada (categorías, lugares...) y al final lo que
// referencia a lo anterior (planes y sesiones), porque necesitamos sus _id.

// Las fechas llevan +02:00 (hora de verano de Valencia). Los datos de ejemplo de
// organizadores y horas de fin son inventados: cámbialos por los reales cuando los tengas.

const categoriesData = [
  { name: "Fiesta", group: "nightlife" },
  { name: "Concierto", group: "nightlife" },
  { name: "Tardeo", group: "nightlife" },
  { name: "Festival", group: "nightlife" },
  { name: "Discoteca", group: "nightlife" },
  { name: "Discomóvil", group: "nightlife" },
  { name: "Deporte", group: "sports" },
  { name: "Motos de agua", group: "activities" },
  { name: "Actividades", group: "activities" },
  { name: "Espectáculo", group: "other" },
];

const venuesData = [
  { key: "loco", name: "Sala Loco Club", city: "Valencia" },
  { key: "musicoleg", name: "Sala El Musicòleg", city: "Valencia" },
  {
    key: "ruzafa",
    name: "Ruzafa",
    city: "Valencia",
    neighborhood: "Ruzafa",
    location: { type: "Point", coordinates: [-0.3745, 39.4605] }, // aproximadas
  },
  { key: "rototom", name: "Recinto Rototom Sunsplash", city: "Benicàssim", province: "Castellón" },
  {
    key: "mestalla",
    name: "Estadio de Mestalla",
    city: "Valencia",
    location: { type: "Point", coordinates: [-0.3584, 39.4747] }, // aproximadas
  },
];

const organizersData = [
  { key: "loco", name: "Sala Loco Club", type: "nightclub" },
  { key: "musicoleg", name: "Sala El Musicòleg", type: "club" },
  { key: "tardeosvlc", name: "Tardeos VLC", type: "promoter", contact: { instagram: "@tardeosvlc" } },
  { key: "rototom", name: "Rototom Sunsplash", type: "promoter" },
  { key: "vcf", name: "Valencia CF", type: "club" },
];

const rolesData = [
  { name: "admin", description: "Acceso total al panel", permissions: ["plans:read", "plans:write", "users:manage"] },
  { name: "editor", description: "Gestiona planes y sesiones", permissions: ["plans:read", "plans:write"] },
  { name: "organizer", description: "Gestiona los planes de su organización", permissions: ["plans:read", "plans:write"] },
  { name: "user", description: "Usuario registrado", permissions: ["plans:read"] },
];

// Cada plan lleva sus sesiones. category/venue/organizer son las claves de arriba
const plansData = [
  {
    title: "Fiesta universitaria Valencia",
    shortDescription: "La fiesta de inicio de curso más grande de Valencia",
    description: "La fiesta del inicio de curso más grande de Valencia. Música electrónica y pop hasta las 6am.",
    category: "Fiesta",
    venue: "loco",
    organizer: "loco",
    minAge: 18,
    tags: ["universitaria", "electrónica", "pop"],
    sessions: [
      { start: "2025-10-04T23:00:00+02:00", end: "2025-10-05T06:00:00+02:00", price: 10, capacity: 300 },
    ],
  },
  {
    title: "Concierto Los Planetas",
    shortDescription: "Los Planetas presentan su nuevo álbum",
    description: "Los Planetas presentan su nuevo álbum en Valencia. Una noche de indie español imprescindible.",
    category: "Concierto",
    venue: "musicoleg",
    organizer: "musicoleg",
    minAge: 16,
    tags: ["indie", "música en vivo"],
    sessions: [
      { start: "2025-10-11T21:00:00+02:00", end: "2025-10-12T00:00:00+02:00", price: 20, capacity: 150 },
    ],
  },
  {
    title: "Tardeo Ruzafa",
    shortDescription: "Tarde de DJ sets en el corazón de Ruzafa",
    description: "Tarde de DJ sets en el corazón de Ruzafa. Entrada libre hasta las 20h.",
    category: "Tardeo",
    venue: "ruzafa",
    organizer: "tardeosvlc",
    minAge: 18,
    tags: ["tardeo", "dj", "ruzafa"],
    // Plan recurrente: el mismo plan con varias fechas (sin duplicar el plan)
    sessions: [
      { start: "2025-10-05T17:00:00+02:00", end: "2025-10-05T23:00:00+02:00", price: 0, capacity: null },
      { start: "2025-10-12T17:00:00+02:00", end: "2025-10-12T23:00:00+02:00", price: 0, capacity: null },
    ],
  },
  {
    title: "Festival Rototom Sunsplash",
    shortDescription: "El festival de reggae más importante de Europa",
    description: "El festival de reggae más importante de Europa vuelve a Benicàssim con más de 30 artistas.",
    category: "Festival",
    venue: "rototom",
    organizer: "rototom",
    minAge: 0,
    tags: ["reggae", "festival"],
    sessions: [
      { start: "2025-08-16T12:00:00+02:00", end: "2025-08-17T02:00:00+02:00", price: 85, capacity: 5000 },
    ],
  },
  {
    title: "Partido Valencia CF vs Villarreal",
    shortDescription: "Derby de la Comunitat Valenciana en Mestalla",
    description: "Derby de la Comunitat Valenciana en Mestalla. Vive la emoción del fútbol en directo.",
    category: "Deporte",
    venue: "mestalla",
    organizer: "vcf",
    minAge: 0,
    tags: ["fútbol", "derby"],
    sessions: [
      { start: "2025-10-19T18:30:00+02:00", end: "2025-10-19T20:30:00+02:00", price: 35, capacity: 800 },
    ],
  },
];

// Mapa { clave: _id } a partir de lo insertado
const mapBy = (docs, keyOf) => Object.fromEntries(docs.map((d) => [keyOf(d), d._id]));

const runSeed = async () => {
  try {
    await conectarDB();

    // Borramos lo que hubiera antes para empezar desde cero (borrado real)
    await Promise.all(
      [Session, Plan, User, Role, Image, Organizer, Venue, Category].map((Model) => Model.deleteMany({}))
    );
    // La colección antigua "eventos" (versión anterior del proyecto) ya no se usa
    try {
      await mongoose.connection.db.dropCollection("eventos");
      console.log("🗑️  Colección antigua 'eventos' eliminada");
    } catch {
      // no existía: no pasa nada
    }
    console.log("🗑️  Colecciones limpiadas");

    // 1) Colecciones independientes
    const categories = await Category.insertMany(
      categoriesData.map((c) => ({ ...c, slug: generateSlug(c.name) }))
    );
    const venues = await Venue.insertMany(venuesData.map(({ key, ...v }) => v));
    const roles = await Role.insertMany(rolesData);

    // 2) Imágenes de portada (placeholders: sustitúyelos por imágenes reales)
    const images = await Image.insertMany(
      plansData.map((p) => ({
        url: `https://placehold.co/800x450?text=${encodeURIComponent(p.title)}`,
        alt: p.title,
        type: "cover",
      }))
    );

    // 3) Organizadores y usuario admin
    const organizers = await Organizer.insertMany(
      organizersData.map(({ key, ...o }) => ({ ...o, slug: generateSlug(o.name) }))
    );
    const adminRole = roles.find((r) => r.name === "admin");
    const admin = await User.create({
      name: "Admin PlanVLC",
      email: "admin@planvlc.com",
      passwordHash: await bcrypt.hash("Admin1234", 10),
      roleId: adminRole._id,
    });

    // 4) Planes (referencian a categorías, lugares, organizadores e imágenes)
    const categoryId = mapBy(categories, (c) => c.name);
    const venueId = Object.fromEntries(venuesData.map((v, i) => [v.key, venues[i]._id]));
    const organizerId = Object.fromEntries(organizersData.map((o, i) => [o.key, organizers[i]._id]));

    const plans = await Plan.insertMany(
      plansData.map((p, i) => {
        const starts = p.sessions.map((s) => new Date(s.start));
        return {
          title: p.title,
          slug: generateSlug(p.title),
          shortDescription: p.shortDescription,
          description: p.description,
          categoryIds: [categoryId[p.category]],
          organizerId: organizerId[p.organizer],
          venueId: venueId[p.venue],
          coverImageId: images[i]._id,
          minAge: p.minAge,
          tags: p.tags,
          // datos derivados de las sesiones
          priceFrom: Math.min(...p.sessions.map((s) => s.price)),
          nextSessionAt: new Date(Math.min(...starts)),
        };
      })
    );

    // 5) Sesiones (referencian al plan)
    const sessionsToInsert = plansData.flatMap((p, i) =>
      p.sessions.map((s) => ({
        planId: plans[i]._id,
        startDateTime: new Date(s.start),
        endDateTime: new Date(s.end),
        price: s.price,
        capacity: s.capacity,
        stock: s.capacity, // al empezar, todas las plazas están libres (null = sin límite)
      }))
    );
    const sessions = await Session.insertMany(sessionsToInsert);

    console.log("✅ Seed completado:");
    console.log(`   - ${categories.length} categorías`);
    console.log(`   - ${venues.length} lugares`);
    console.log(`   - ${organizers.length} organizadores`);
    console.log(`   - ${images.length} imágenes`);
    console.log(`   - ${roles.length} roles`);
    console.log(`   - 1 usuario (${admin.email} / Admin1234 → cámbiala)`);
    console.log(`   - ${plans.length} planes`);
    console.log(`   - ${sessions.length} sesiones`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error al ejecutar el seed:", error);
    process.exit(1);
  }
};

runSeed();
