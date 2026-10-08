/* Datos de demostración para AdSpace. Ejecutar con: npm run db:seed */
import { PrismaClient, type Visibility, type SpaceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const RATE = Number(process.env.PLATFORM_COMMISSION_RATE ?? 0.15);

const u = (id: string, w = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

const IMG = {
  facade: [u("photo-1486406146926-c627a92ad1ab"), u("photo-1545558014-8692077e9b5c"), u("photo-1449824913935-59a10b8d2000")],
  wall: [u("photo-1460472178825-e5240623afd5"), u("photo-1477959858617-67f85cf4f1df"), u("photo-1514565131-fce0801e5785")],
  house: [u("photo-1580587771525-78b9dba3b914"), u("photo-1568605114967-8130f3a36994"), u("photo-1512917774080-9991f1c4c750")],
  car: [u("photo-1549317661-bd32c8ce0db2"), u("photo-1533473359331-0135ef1b58bf"), u("photo-1503376780353-7e6692767b70")],
  van: [u("photo-1570125909232-eb263c188f7e"), u("photo-1544620347-c4fd4a3d5957"), u("photo-1519003722824-194d4455a60c")],
  moto: [u("photo-1558981806-ec527fa84c39"), u("photo-1449426468159-d96dbf08f19f")],
  land: [u("photo-1500382017468-9049fed747ef"), u("photo-1464226184884-fa280b87c399")],
  store: [u("photo-1441986300917-64674bd600d8"), u("photo-1555529669-e69e7aa0ba9a"), u("photo-1567401893414-76b7b1e5a7a5")],
  bike: [u("photo-1485965120184-e220f721d03e"), u("photo-1507035895480-2b3156c31fc8")],
  screen: [u("photo-1534430480872-3498386e7856"), u("photo-1593359677879-a4bb92f829d1")],
};

const day = 86400000;
const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z");
const addDays = (n: number) => new Date(today.getTime() + n * day);
const addMonths = (d: Date, m: number) => {
  const r = new Date(d);
  r.setUTCMonth(r.getUTCMonth() + m);
  return r;
};

async function main() {
  console.log("Limpiando base…");
  await db.$transaction([
    db.report.deleteMany(),
    db.review.deleteMany(),
    db.message.deleteMany(),
    db.conversation.deleteMany(),
    db.payment.deleteMany(),
    db.evidence.deleteMany(),
    db.bookingEvent.deleteMany(),
    db.bookingOffer.deleteMany(),
    db.booking.deleteMany(),
    db.spaceImage.deleteMany(),
    db.space.deleteMany(),
    db.category.deleteMany(),
    db.user.deleteMany(),
  ]);

  console.log("Categorías…");
  const cats = await Promise.all(
    [
      { slug: "frentes", name: "Frentes y medianeras", description: "Paredes, medianeras, ventanas y fachadas de casas y edificios.", icon: "building", imageUrl: IMG.wall[1], sortOrder: 1, priceFactor: 1.2 },
      { slug: "vehiculos", name: "Vehículos", description: "Autos particulares, camionetas, motos, taxis y flotas.", icon: "car", imageUrl: IMG.car[0], sortOrder: 2, priceFactor: 0.9 },
      { slug: "terrenos", name: "Terrenos y propiedades", description: "Carteles, cercos y espacios visibles desde la calle o la ruta.", icon: "land", imageUrl: IMG.land[0], sortOrder: 3, priceFactor: 1 },
      { slug: "comercios", name: "Comercios", description: "Vidrieras, persianas y espacios interiores de locales.", icon: "store", imageUrl: IMG.store[0], sortOrder: 4, priceFactor: 0.85 },
      { slug: "otros", name: "Otros soportes", description: "Bicicletas, trailers, pantallas y formatos originales.", icon: "sparkles", imageUrl: IMG.screen[0], sortOrder: 5, priceFactor: 1 },
    ].map((c) => db.category.create({ data: c })),
  );
  const cat = Object.fromEntries(cats.map((c) => [c.slug, c.id])) as Record<string, string>;

  console.log("Usuarios…");
  const passwordHash = await bcrypt.hash("demo1234", 10);
  const mk = (data: { email: string; name: string; role: "OWNER" | "ADVERTISER" | "ADMIN"; city?: string; companyName?: string; bio?: string; verified?: boolean; phone?: string }) =>
    db.user.create({ data: { passwordHash, verified: true, ...data } });

  const admin = await mk({ email: "admin@adspace.ar", name: "Equipo AdSpace", role: "ADMIN", city: "CABA" });
  const lucia = await mk({ email: "propietario@adspace.ar", name: "Lucía Fernández", role: "OWNER", city: "CABA", phone: "+54 11 5555-0101", bio: "Arquitecta y dueña de un PH en Palermo con una medianera enorme sobre Av. Córdoba. Respondo rápido y me encargo de coordinar la instalación." });
  const martin = await mk({ email: "martin@adspace.ar", name: "Martín Gómez", role: "OWNER", city: "Córdoba", bio: "Tengo una flota de 6 utilitarios de reparto que recorren Córdoba capital todos los días." });
  const carla = await mk({ email: "carla@adspace.ar", name: "Carla Ruiz", role: "OWNER", city: "Rosario", bio: "Dueña de dos locales sobre peatonal Córdoba en Rosario." });
  const jorge = await mk({ email: "jorge@adspace.ar", name: "Jorge Medina", role: "OWNER", city: "Mendoza", bio: "Productor con campos sobre Ruta 40 y Acceso Sur." });
  const sofia = await mk({ email: "sofia@adspace.ar", name: "Sofía Paz", role: "OWNER", city: "Mar del Plata", verified: false, bio: "Tengo un food-truck y un trailer que muevo por la costa en temporada." });
  const diego = await mk({ email: "diego@adspace.ar", name: "Diego Álvarez", role: "OWNER", city: "La Plata", bio: "Taxista hace 15 años. Hago turnos de 12 h en el casco urbano." });

  const empresa = await mk({ email: "empresa@adspace.ar", name: "Valentina Sosa", role: "ADVERTISER", companyName: "Café Andino", city: "CABA", bio: "Marca de café de especialidad con 14 sucursales. Buscamos presencia barrial y en vía pública." });
  const fintech = await mk({ email: "marketing@pagofacil.demo", name: "Tomás Herrera", role: "ADVERTISER", companyName: "Billetera Nube", city: "CABA", bio: "Fintech argentina. Campañas de awareness en grandes ciudades." });
  const agencia = await mk({ email: "agencia@adspace.ar", name: "Paula Ríos", role: "ADVERTISER", companyName: "Ríos & Asociados (agencia)", city: "Córdoba", verified: false });

  console.log("Espacios…");
  type S = {
    owner: string; cat: string; title: string; description: string; city: string; province: string; neighborhood?: string;
    lat: number; lng: number; w: number; h: number; surface: string; vis: Visibility; imp: number; price: number; min?: number;
    imgs: string[]; status?: SpaceStatus; featured?: boolean; conditions?: string; install?: boolean; from?: number; to?: number; views?: number;
  };
  const specs: S[] = [
    { owner: lucia.id, cat: "frentes", title: "Medianera sobre Av. Córdoba con vista a semáforo", description: "Medianera de 12 metros de alto visible desde ambos sentidos de Av. Córdoba, justo frente a un semáforo con alto tiempo de detención. Ideal para lona o pintura mural. Fácil acceso desde la terraza para instalación.", city: "CABA", province: "CABA", neighborhood: "Palermo", lat: -34.5955, lng: -58.4255, w: 8, h: 12, surface: "Pared revocada", vis: "VERY_HIGH", imp: 42000, price: 1450000, min: 3, imgs: IMG.wall, featured: true, conditions: "No se aceptan publicidades de alcohol ni apuestas. Instalación a cargo del anunciante con seguro de responsabilidad civil.", views: 812 },
    { owner: lucia.id, cat: "frentes", title: "Ventanal frontal en esquina de Villa Crespo", description: "Ventanal de PH en planta baja sobre esquina comercial. Mucho tránsito peatonal por la cercanía a la estación de subte Malabia. Se ofrece para vinilo microperforado.", city: "CABA", province: "CABA", neighborhood: "Villa Crespo", lat: -34.5985, lng: -58.4338, w: 3, h: 2, surface: "Vidrio", vis: "HIGH", imp: 9500, price: 320000, imgs: [IMG.house[0], IMG.facade[2]], views: 240 },
    { owner: lucia.id, cat: "frentes", title: "Fachada de edificio en Caballito sobre Rivadavia", description: "Fachada lateral del edificio de 5 pisos sobre Av. Rivadavia. Gran visibilidad para autos y colectivos (más de 8 líneas). Consorcio aprobado para uso publicitario.", city: "CABA", province: "CABA", neighborhood: "Caballito", lat: -34.6186, lng: -58.4410, w: 10, h: 14, surface: "Ladrillo visto", vis: "VERY_HIGH", imp: 38000, price: 1300000, min: 6, imgs: IMG.facade, featured: true, views: 530 },
    { owner: lucia.id, cat: "frentes", title: "Frente de casa en Núñez cerca de la cancha", description: "Frente de casa sobre calle con mucho tránsito en días de partido. Ideal para marcas deportivas o de consumo masivo. Pared lisa recién pintada.", city: "CABA", province: "CABA", neighborhood: "Núñez", lat: -34.5455, lng: -58.4560, w: 6, h: 3, surface: "Pared revocada", vis: "MEDIUM", imp: 5200, price: 240000, imgs: [IMG.house[1], IMG.house[2]], status: "PENDING" },
    { owner: lucia.id, cat: "frentes", title: "Balcón con baranda en Belgrano (borrador)", description: "Baranda de balcón en primer piso sobre avenida Cabildo, ideal para banner horizontal. Estoy terminando de cargar las fotos.", city: "CABA", province: "CABA", neighborhood: "Belgrano", lat: -34.5627, lng: -58.4568, w: 4, h: 1, surface: "Lona / vinilo", vis: "HIGH", imp: 15000, price: 190000, imgs: [], status: "DRAFT" },

    { owner: martin.id, cat: "vehiculos", title: "Flota de 6 utilitarios de reparto en Córdoba capital", description: "Seis Renault Kangoo que hacen reparto de 8 a 18 h por Nueva Córdoba, Centro, General Paz y Cerro de las Rosas. Ploteo lateral y trasero. Precio por toda la flota.", city: "Córdoba", province: "Córdoba", neighborhood: "Centro", lat: -31.4167, lng: -64.1833, w: 4, h: 1.5, surface: "Ploteo vehicular", vis: "VERY_HIGH", imp: 30000, price: 980000, min: 3, imgs: IMG.van, featured: true, install: true, conditions: "El ploteo debe ser removible. Incluye instalación en taller asociado.", views: 690 },
    { owner: martin.id, cat: "vehiculos", title: "Camioneta Hilux con caja ploteable", description: "Camioneta que recorre rutas provinciales hacia Carlos Paz y Río Cuarto 4 días por semana. Ideal para agro, turismo y servicios.", city: "Córdoba", province: "Córdoba", neighborhood: "Cerro de las Rosas", lat: -31.3720, lng: -64.2290, w: 3, h: 1.2, surface: "Ploteo vehicular", vis: "HIGH", imp: 8000, price: 210000, imgs: [IMG.car[1], IMG.car[2]], views: 155 },
    { owner: diego.id, cat: "vehiculos", title: "Taxi con techo luminoso en casco de La Plata", description: "Taxi con turnos de 12 horas en el casco urbano de La Plata. Disponible para ploteo de puertas traseras y cartel de techo.", city: "La Plata", province: "Buenos Aires", neighborhood: "Casco urbano", lat: -34.9214, lng: -57.9545, w: 1.2, h: 0.4, surface: "Ploteo vehicular", vis: "HIGH", imp: 11000, price: 140000, imgs: [IMG.car[0], IMG.car[2]], views: 98 },
    { owner: diego.id, cat: "vehiculos", title: "Moto delivery con baúl publicitario", description: "Moto de delivery con baúl de 50 cm por lado. Recorre City Bell, Gonnet y el centro de La Plata.", city: "La Plata", province: "Buenos Aires", neighborhood: "City Bell", lat: -34.8720, lng: -58.0460, w: 0.5, h: 0.5, surface: "Lona / vinilo", vis: "MEDIUM", imp: 4500, price: 55000, imgs: IMG.moto, views: 60 },
    { owner: martin.id, cat: "vehiculos", title: "Colectivo escolar privado con lateral libre", description: "Micro escolar con recorrido diario en barrios cerrados del norte de Córdoba. Laterales completos disponibles.", city: "Córdoba", province: "Córdoba", neighborhood: "Villa Belgrano", lat: -31.3480, lng: -64.2620, w: 8, h: 1.6, surface: "Ploteo vehicular", vis: "HIGH", imp: 9000, price: 360000, min: 3, imgs: [IMG.van[0], IMG.van[1]], status: "PAUSED" },

    { owner: jorge.id, cat: "terrenos", title: "Cartel 12×4 sobre Ruta 40 – Luján de Cuyo", description: "Estructura metálica de 12×4 m sobre Ruta 40, en el corredor de bodegas. Alto tránsito turístico. Estructura con iluminación LED propia.", city: "Luján de Cuyo", province: "Mendoza", lat: -33.0390, lng: -68.8790, w: 12, h: 4, surface: "Lona / vinilo", vis: "VERY_HIGH", imp: 26000, price: 890000, min: 3, imgs: [IMG.land[0], IMG.land[1]], featured: true, install: true, views: 410 },
    { owner: jorge.id, cat: "terrenos", title: "Cerco perimetral de lote en Acceso Sur", description: "60 metros lineales de cerco sobre colectora del Acceso Sur. Se pueden colocar banners modulares.", city: "Godoy Cruz", province: "Mendoza", lat: -32.9420, lng: -68.8450, w: 60, h: 2, surface: "Cerco / alambrado", vis: "HIGH", imp: 18000, price: 450000, imgs: [IMG.land[1], IMG.land[0]], views: 120 },
    { owner: carla.id, cat: "terrenos", title: "Terreno esquina en Fisherton frente a shopping", description: "Terreno baldío en esquina con frente de 20 m sobre avenida Eva Perón, a 200 m del shopping. Se permite estructura autoportante.", city: "Rosario", province: "Santa Fe", neighborhood: "Fisherton", lat: -32.9300, lng: -60.7400, w: 9, h: 3, surface: "Cerco / alambrado", vis: "HIGH", imp: 14000, price: 520000, imgs: [IMG.land[0]], views: 88 },

    { owner: carla.id, cat: "comercios", title: "Vidriera doble sobre peatonal Córdoba (Rosario)", description: "Local de indumentaria con vidriera doble sobre la peatonal más transitada de Rosario. Ofrezco la vidriera izquierda completa para exhibición o vinilo.", city: "Rosario", province: "Santa Fe", neighborhood: "Centro", lat: -32.9468, lng: -60.6393, w: 2.5, h: 2.2, surface: "Vidrio", vis: "VERY_HIGH", imp: 25000, price: 410000, imgs: IMG.store, featured: true, views: 377 },
    { owner: carla.id, cat: "comercios", title: "Persiana metálica para mural nocturno", description: "Persiana de local que permanece cerrada de 20 a 9 h. Ideal para mural artístico de marca, visible por la noche y fines de semana.", city: "Rosario", province: "Santa Fe", neighborhood: "Pichincha", lat: -32.9370, lng: -60.6530, w: 4, h: 3, surface: "Persiana metálica", vis: "MEDIUM", imp: 6000, price: 150000, imgs: [IMG.store[1], IMG.wall[0]], views: 140 },
    { owner: lucia.id, cat: "comercios", title: "Pantalla interior en café de San Telmo", description: "Pantalla de 55\" junto a la caja de un café muy concurrido por turistas. Loop de spots de 15 segundos.", city: "CABA", province: "CABA", neighborhood: "San Telmo", lat: -34.6215, lng: -58.3730, w: 1.2, h: 0.7, surface: "Pantalla LED", vis: "MEDIUM", imp: 1800, price: 95000, imgs: [IMG.store[2], IMG.screen[1]], views: 75 },
    { owner: martin.id, cat: "comercios", title: "Interior de gimnasio en Nueva Córdoba", description: "Espacio en pared principal de gimnasio con 1.200 socios activos, mayoría estudiantes universitarios.", city: "Córdoba", province: "Córdoba", neighborhood: "Nueva Córdoba", lat: -31.4260, lng: -64.1870, w: 5, h: 2.5, surface: "Pared revocada", vis: "MEDIUM", imp: 900, price: 120000, imgs: [IMG.store[0]], views: 66 },

    { owner: sofia.id, cat: "otros", title: "Trailer de food-truck en la costa atlántica", description: "Trailer que se ubica en Playa Grande y Punta Mogotes en temporada. Ambos laterales y la parte trasera disponibles.", city: "Mar del Plata", province: "Buenos Aires", neighborhood: "Playa Grande", lat: -38.0280, lng: -57.5320, w: 4, h: 2, surface: "Ploteo vehicular", vis: "HIGH", imp: 12000, price: 280000, imgs: [IMG.van[2], IMG.van[1]], views: 190 },
    { owner: sofia.id, cat: "otros", title: "Flota de 10 bicicletas de alquiler", description: "Bicicletas de alquiler turístico en la costanera. Paneles en canasto delantero y cuadro.", city: "Mar del Plata", province: "Buenos Aires", neighborhood: "La Perla", lat: -37.9890, lng: -57.5480, w: 0.4, h: 0.3, surface: "Lona / vinilo", vis: "MEDIUM", imp: 5000, price: 110000, imgs: IMG.bike, views: 102 },
    { owner: lucia.id, cat: "otros", title: "Pantalla LED en terraza sobre 9 de Julio", description: "Pantalla LED de 6×3 m en terraza, visible desde Av. 9 de Julio. Ciclo de 10 anunciantes, spots de 10 s, encendida de 7 a 1 h.", city: "CABA", province: "CABA", neighborhood: "San Nicolás", lat: -34.6040, lng: -58.3810, w: 6, h: 3, surface: "Pantalla LED", vis: "VERY_HIGH", imp: 85000, price: 2100000, min: 1, imgs: IMG.screen, featured: true, views: 1204 },
    { owner: carla.id, cat: "frentes", title: "Medianera en Barrio Martin frente al río", description: "Medianera de edificio visible desde la costanera de Rosario. Excelente para marcas de turismo y gastronomía.", city: "Rosario", province: "Santa Fe", neighborhood: "Barrio Martin", lat: -32.9530, lng: -60.6300, w: 7, h: 10, surface: "Pared revocada", vis: "HIGH", imp: 16000, price: 690000, min: 3, imgs: [IMG.wall[2], IMG.facade[0]], views: 210 },
    { owner: jorge.id, cat: "frentes", title: "Frente de casona en Ciudad de Mendoza", description: "Casona sobre calle Arístides Villanueva, zona de bares. Muy transitada de noche y los fines de semana.", city: "Mendoza", province: "Mendoza", neighborhood: "Quinta Sección", lat: -32.8860, lng: -68.8590, w: 6, h: 3.5, surface: "Ladrillo visto", vis: "HIGH", imp: 13000, price: 340000, imgs: [IMG.house[2], IMG.facade[1]], views: 133 },
    { owner: diego.id, cat: "terrenos", title: "Lote sobre Camino Centenario con cartel existente", description: "Cartel de chapa de 6×3 m sobre Camino Centenario en Gonnet. Requiere lona nueva.", city: "La Plata", province: "Buenos Aires", neighborhood: "Gonnet", lat: -34.8850, lng: -58.0120, w: 6, h: 3, surface: "Chapa", vis: "HIGH", imp: 20000, price: 380000, imgs: [IMG.land[1]], status: "PENDING" },
    { owner: sofia.id, cat: "comercios", title: "Vidriera en Güemes (Mar del Plata)", description: "Vidriera de local de decoración sobre calle Güemes, centro comercial a cielo abierto.", city: "Mar del Plata", province: "Buenos Aires", neighborhood: "Güemes", lat: -38.0100, lng: -57.5450, w: 2, h: 2, surface: "Vidrio", vis: "HIGH", imp: 9000, price: 190000, imgs: [IMG.store[1]], status: "REJECTED" },
  ];

  const spaces: Awaited<ReturnType<typeof db.space.create>>[] = [];
  for (const s of specs) {
    const status = s.status ?? "PUBLISHED";
    const space = await db.space.create({
      data: {
        ownerId: s.owner,
        categoryId: cat[s.cat],
        title: s.title,
        description: s.description,
        city: s.city,
        province: s.province,
        neighborhood: s.neighborhood,
        addressPrivate: `${s.neighborhood ?? s.city} — dirección exacta de demostración`,
        lat: s.lat,
        lng: s.lng,
        widthM: s.w,
        heightM: s.h,
        surfaceType: s.surface,
        visibility: s.vis,
        dailyImpressions: s.imp,
        pricePerMonth: s.price,
        minMonths: s.min ?? 1,
        availableFrom: addDays(s.from ?? -30),
        availableTo: s.to ? addDays(s.to) : null,
        conditions: s.conditions ?? "Contenido sujeto a aprobación del propietario. Diseño e impresión a cargo del anunciante.",
        includesInstallation: s.install ?? false,
        status,
        featured: s.featured ?? false,
        views: s.views ?? 0,
        rejectionReason: status === "REJECTED" ? "Las fotos no muestran el espacio ofrecido. Subí imágenes propias del local." : null,
        publishedAt: status === "PUBLISHED" || status === "PAUSED" ? addDays(-Math.floor(Math.random() * 60) - 5) : null,
        images: { create: s.imgs.map((url, i) => ({ url, sortOrder: i })) },
      },
    });
    spaces.push(space);
  }
  const byTitle = (t: string) => spaces.find((s) => s.title.startsWith(t))!;

  console.log("Campañas, mensajes y reseñas…");
  async function booking(opts: {
    space: (typeof spaces)[number]; advertiser: string; name: string; start: Date; months: number; price: number;
    status: "PENDING" | "ACCEPTED" | "ACTIVE" | "COMPLETED" | "REJECTED" | "CANCELLED"; message: string; counter?: number; paid?: boolean;
  }) {
    const end = addMonths(opts.start, opts.months);
    const finalPrice = opts.counter ?? opts.price;
    const total = finalPrice * opts.months;
    const commission = Math.round(total * RATE);
    const b = await db.booking.create({
      data: {
        spaceId: opts.space.id,
        advertiserId: opts.advertiser,
        ownerId: opts.space.ownerId,
        campaignName: opts.name,
        startDate: opts.start,
        endDate: end,
        months: opts.months,
        monthlyPrice: finalPrice,
        totalAmount: total,
        commissionRate: RATE,
        commissionAmount: commission,
        ownerPayout: total - commission,
        status: opts.status,
        awaitingUserId: opts.status === "PENDING" ? (opts.counter ? opts.advertiser : opts.space.ownerId) : null,
        acceptedAt: ["ACCEPTED", "ACTIVE", "COMPLETED"].includes(opts.status) ? addDays(-20) : null,
        agreementText: ["ACCEPTED", "ACTIVE", "COMPLETED"].includes(opts.status)
          ? `Campaña "${opts.name}" en "${opts.space.title}". Período: ${opts.months} mes(es). Precio mensual acordado: $${finalPrice}. Total: $${total}. Comisión de la plataforma: ${RATE * 100}%.`
          : null,
        offers: {
          create: [
            { authorId: opts.advertiser, monthlyPrice: opts.price, note: opts.message, createdAt: addDays(-25) },
            ...(opts.counter ? [{ authorId: opts.space.ownerId, monthlyPrice: opts.counter, note: "Puedo ofrecerte este valor incluyendo la coordinación de instalación.", createdAt: addDays(-24) }] : []),
          ],
        },
        events: {
          create: [
            { actorId: opts.advertiser, type: "REQUESTED", note: "Solicitud de contratación enviada", createdAt: addDays(-25) },
            ...(opts.counter ? [{ actorId: opts.space.ownerId, type: "COUNTER_OFFER", note: "Nueva propuesta económica", createdAt: addDays(-24) }] : []),
            ...(["ACCEPTED", "ACTIVE", "COMPLETED"].includes(opts.status) ? [{ actorId: opts.space.ownerId, type: "ACCEPTED", note: "Acuerdo confirmado", createdAt: addDays(-20) }] : []),
            ...(["ACTIVE", "COMPLETED"].includes(opts.status) ? [{ actorId: opts.space.ownerId, type: "INSTALLED", note: "Instalación registrada con evidencia fotográfica", createdAt: opts.start }] : []),
            ...(opts.status === "COMPLETED" ? [{ actorId: opts.space.ownerId, type: "COMPLETED", note: "Campaña finalizada", createdAt: end }] : []),
            ...(opts.status === "REJECTED" ? [{ actorId: opts.space.ownerId, type: "REJECTED", note: "El propietario rechazó la solicitud", createdAt: addDays(-22) }] : []),
          ],
        },
      },
    });
    if (["ACCEPTED", "ACTIVE", "COMPLETED"].includes(opts.status)) {
      await db.payment.create({
        data: {
          bookingId: b.id,
          amount: total,
          commissionAmount: commission,
          provider: "manual",
          providerRef: `manual_demo_${b.id.slice(-6)}`,
          status: opts.paid ? "PAID" : "PENDING",
          paidAt: opts.paid ? addDays(-18) : null,
        },
      });
    }
    if (["ACTIVE", "COMPLETED"].includes(opts.status)) {
      await db.evidence.create({ data: { bookingId: b.id, uploadedById: opts.space.ownerId, type: "INSTALLATION", url: opts.space.id ? (await db.spaceImage.findFirst({ where: { spaceId: opts.space.id } }))?.url ?? IMG.wall[0] : IMG.wall[0], note: "Lona instalada y tensada. Foto tomada desde la vereda de enfrente." } });
    }
    if (opts.status === "COMPLETED") {
      await db.evidence.create({ data: { bookingId: b.id, uploadedById: opts.space.ownerId, type: "COMPLETION", url: IMG.facade[0], note: "Material retirado, pared en condiciones originales." } });
    }
    return b;
  }

  const medianera = byTitle("Medianera sobre Av. Córdoba");
  const flota = byTitle("Flota de 6 utilitarios");
  const vidriera = byTitle("Vidriera doble");
  const ruta40 = byTitle("Cartel 12×4");
  const pantalla = byTitle("Pantalla LED en terraza");
  const ventanal = byTitle("Ventanal frontal");

  const b1 = await booking({ space: medianera, advertiser: empresa.id, name: "Lanzamiento Blend Otoño", start: addMonths(today, -4), months: 3, price: 1350000, counter: 1400000, status: "COMPLETED", message: "Hola Lucía, queremos lanzar nuestro nuevo blend en Palermo. ¿Aceptarías $1.350.000 por mes por 3 meses?", paid: true });
  const b2 = await booking({ space: flota, advertiser: empresa.id, name: "Café Andino llega a Córdoba", start: addDays(-15), months: 3, price: 980000, status: "ACTIVE", message: "Abrimos 3 sucursales en Córdoba y queremos ploteo en toda la flota.", paid: true });
  const b3 = await booking({ space: medianera, advertiser: fintech.id, name: "Billetera Nube — Awareness CABA", start: addMonths(today, 1), months: 6, price: 1300000, counter: 1420000, status: "PENDING", message: "Buenas, estamos planificando una campaña de 6 meses. Proponemos $1.300.000 mensuales." });
  const b4 = await booking({ space: vidriera, advertiser: empresa.id, name: "Pop-up Rosario", start: addDays(20), months: 2, price: 380000, status: "PENDING", message: "Nos interesa la vidriera para una acción de 2 meses con degustación." });
  const b5 = await booking({ space: ruta40, advertiser: fintech.id, name: "Vendimia 2027", start: addDays(45), months: 3, price: 890000, status: "ACCEPTED", message: "Queremos estar presentes en temporada de vendimia." });
  await booking({ space: pantalla, advertiser: agencia.id, name: "Cliente retail — test", start: addDays(10), months: 1, price: 1200000, status: "REJECTED", message: "¿Aceptarían $1.200.000 por un mes de prueba?" });
  const b7 = await booking({ space: ventanal, advertiser: fintech.id, name: "Billetera Nube barrial", start: addMonths(today, -5), months: 2, price: 300000, status: "COMPLETED", message: "Campaña barrial de 2 meses.", paid: true });

  await db.review.createMany({
    data: [
      { bookingId: b1.id, authorId: empresa.id, targetId: lucia.id, rating: 5, comment: "Lucía fue súper clara con las condiciones y coordinó la instalación en tiempo récord. La medianera tiene una visibilidad impresionante." },
      { bookingId: b1.id, authorId: lucia.id, targetId: empresa.id, rating: 5, comment: "Excelente anunciante: pagos en fecha y un diseño hermoso que mejoró la cuadra." },
      { bookingId: b7.id, authorId: fintech.id, targetId: lucia.id, rating: 4, comment: "Buen espacio y buena comunicación. Recomendable para acciones barriales." },
      { bookingId: b7.id, authorId: lucia.id, targetId: fintech.id, rating: 5, comment: "Muy profesionales, entregaron el vinilo listo para colocar." },
    ],
  });

  const conv = async (space: (typeof spaces)[number], advertiserId: string, msgs: [string, string][]) => {
    const c = await db.conversation.create({ data: { spaceId: space.id, ownerId: space.ownerId, advertiserId, lastMessageAt: addDays(-1) } });
    let t = Date.now() - msgs.length * 3600_000;
    for (const [sender, body] of msgs) {
      t += 3600_000;
      await db.message.create({ data: { conversationId: c.id, senderId: sender, body, createdAt: new Date(t), readAt: sender === advertiserId ? null : new Date(t) } });
    }
  };
  await conv(medianera, fintech.id, [
    [fintech.id, "Hola Lucía, ¿la medianera tiene iluminación nocturna?"],
    [lucia.id, "¡Hola Tomás! No tiene iluminación propia, pero el poste de alumbrado público la ilumina bastante bien. Te mando fotos de noche si querés."],
    [fintech.id, "Genial, sí por favor. Te envié la solicitud por 6 meses."],
  ]);
  await conv(flota, empresa.id, [
    [empresa.id, "Martín, ¿el taller puede hacer el ploteo este lunes?"],
    [martin.id, "Sí, el lunes a las 9 los 6 vehículos están en el taller. Ya subí las fotos de la instalación."],
    [empresa.id, "¡Quedó espectacular! Gracias."],
  ]);
  await conv(vidriera, empresa.id, [[empresa.id, "Hola Carla, ¿se puede hacer degustación en la puerta del local los sábados?"]]);

  await db.report.createMany({
    data: [
      { reporterId: empresa.id, spaceId: byTitle("Vidriera en Güemes").id, reason: "informacion_falsa", details: "Las fotos parecen de otro local." },
      { reporterId: lucia.id, reportedUserId: agencia.id, reason: "spam", details: "Me envió varias solicitudes con precios muy por debajo." },
    ],
  });

  void admin; void b2; void b3; void b4; void b5;
  console.log(`Listo: ${spaces.length} espacios, 7 campañas. Contraseña de todas las cuentas: demo1234`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
