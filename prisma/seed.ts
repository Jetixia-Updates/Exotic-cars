import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Real high-quality images from Unsplash — each module uses topic-related photos
const IMAGES = {
  // CARS — exotic/sports cars only
  cars: {
    lamborghini: [
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200", // orange sports car
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200", // black sports car
      "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=1200",   // yellow sports car
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200", // red sports car
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200", // white sports car
      "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=1200", // blue supercar
    ],
    ferrari: [
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200", // red Ferrari
      "https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=1200", // Ferrari rear
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200",   // red sports car
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200", // sports car
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200", // red car
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200",   // sports car
    ],
    porsche: [
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200", // Porsche/sports
      "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=1200", // Porsche 911
      "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=1200", // sports car
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200", // car front
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200", // black car
      "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=1200",   // car lineup
    ],
    mclaren: [
      "https://images.unsplash.com/photo-1542362567-b07e54358753?w=1200",   // silver sports car
      "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=1200",   // supercar
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200", // white sports car
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200", // sports car
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200", // red supercar
      "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=1200", // blue supercar
    ],
    bmw: [
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200",   // sports sedan
      "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=1200", // BMW/car
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200", // car front
      "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=1200",   // car
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200", // black car
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200", // sports car
    ],
  },
  // PARTS — turbo/engine, exhaust, body, wheels, ECU (engine bay / mechanic)
  parts: {
    turbo: [
      "https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800", // car engine
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800", // auto service/engine
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",     // mechanic/engine
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800",   // engine bay/sports car
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800", // car detail
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800", // car/engine
    ],
    exhaust: [
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800", // car rear/detail
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",   // mechanic/car
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800", // car service
      "https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800", // engine
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800", // car rear
      "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800",   // car underside
    ],
    bodyKit: [
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800",   // sports car front
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800", // car front
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800", // car side
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800", // red car body
      "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=800",   // car hood/body
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800", // sports car
    ],
    wheels: [
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800", // tire/wheel
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",   // car/wheel
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800", // service/wheels
      "https://images.unsplash.com/photo-1617812692194-85d257726b6e?w=800", // car detail
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800", // car wheel
      "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800",   // alloy wheel/car
    ],
    engine: [
      "https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800", // engine
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800", // engine bay/service
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",   // mechanic engine
      "https://images.unsplash.com/photo-1581092160562-40d3e2c2e2a2?w=800", // mechanical
      "https://images.unsplash.com/photo-1565680018434-b513d5e9b2c2?w=800", // engine
      "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800", // ECU/mechanical
    ],
  },
  // WORKSHOPS — garage, mechanic, lift, tools
  workshops: [
    "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800", // garage/tire
    "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800", // cars in garage
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",   // mechanic working
    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800", // car service
    "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800",   // workshop/sports car
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800", // cars garage
  ],
  workshopLogo: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400", // auto service
  // EVENTS — car meets, lineups, track
  events: [
    "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=1200",   // car meet/lineup
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200", // cars together
    "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200", // sports car/track
    "https://images.unsplash.com/photo-1542362567-b07e54358753?w=1200",   // car show
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200", // exotic car
    "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200", // Ferrari/event
  ],
  userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200", // person
};

async function main() {
  const hash = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@exoticcars.com" },
    update: {},
    create: {
      email: "admin@exoticcars.com",
      passwordHash: hash,
      name: "Admin User",
      role: "ADMIN",
      avatar: IMAGES.userAvatar,
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: "seller@exoticcars.com" },
    update: {},
    create: {
      email: "seller@exoticcars.com",
      passwordHash: hash,
      name: "John Seller",
      role: "SELLER",
      avatar: IMAGES.userAvatar,
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: "buyer@exoticcars.com" },
    update: {},
    create: {
      email: "buyer@exoticcars.com",
      passwordHash: hash,
      name: "Jane Buyer",
      role: "BUYER",
      avatar: IMAGES.userAvatar,
    },
  });

  await prisma.userProfile.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id, bio: "Platform admin" },
  });
  await prisma.userProfile.upsert({
    where: { userId: seller.id },
    update: {},
    create: { userId: seller.id, bio: "Exotic car collector" },
  });
  await prisma.userProfile.upsert({
    where: { userId: buyer.id },
    update: {},
    create: { userId: buyer.id },
  });

  // Cars with real images
  const car1 = await prisma.carListing.upsert({
    where: { id: "seed-car-1" },
    update: { images: IMAGES.cars.lamborghini },
    create: {
      id: "seed-car-1",
      sellerId: seller.id,
      title: "Lamborghini Huracán EVO - Stage 3",
      description: "Fully modified Huracán with upgraded turbos, exhaust, and ECU tune. Immaculate condition.",
      brand: "Lamborghini",
      model: "Huracán EVO",
      year: 2021,
      price: 285000,
      listingType: "FIXED_PRICE",
      modificationLevel: "STAGE3",
      horsepower: 720,
      engine: "5.2L V10",
      torque: 520,
      transmission: "DCT",
      mileage: 12000,
      location: "Dubai, UAE",
      country: "UAE",
      city: "Dubai",
      images: IMAGES.cars.lamborghini,
      isFeatured: true,
      status: "active",
    },
  });

  const car2 = await prisma.carListing.upsert({
    where: { id: "seed-car-2" },
    update: { images: IMAGES.cars.ferrari },
    create: {
      id: "seed-car-2",
      sellerId: seller.id,
      title: "Ferrari 488 GTB - Novitec",
      description: "Novitec tuned 488 with full exhaust and ECU. Rare spec.",
      brand: "Ferrari",
      model: "488 GTB",
      year: 2019,
      price: 350000,
      listingType: "FIXED_PRICE",
      modificationLevel: "STAGE2",
      horsepower: 680,
      engine: "3.9L Twin-Turbo V8",
      mileage: 8000,
      location: "Monaco",
      country: "Monaco",
      city: "Monte Carlo",
      images: IMAGES.cars.ferrari,
      isFeatured: true,
      status: "active",
    },
  });

  await prisma.carListing.upsert({
    where: { id: "seed-car-3" },
    update: { images: IMAGES.cars.porsche },
    create: {
      id: "seed-car-3",
      sellerId: seller.id,
      title: "Porsche 911 GT3 RS - Manthey",
      description: "Track-ready 911 GT3 RS with Manthey Performance Kit. Only 3,000 miles.",
      brand: "Porsche",
      model: "911 GT3 RS",
      year: 2023,
      price: 295000,
      listingType: "FIXED_PRICE",
      modificationLevel: "STAGE2",
      horsepower: 525,
      engine: "4.0L Flat-6",
      torque: 465,
      transmission: "PDK",
      mileage: 3000,
      location: "Stuttgart, Germany",
      country: "Germany",
      city: "Stuttgart",
      images: IMAGES.cars.porsche,
      isFeatured: true,
      status: "active",
    },
  });

  await prisma.carListing.upsert({
    where: { id: "seed-car-4" },
    update: { images: IMAGES.cars.mclaren },
    create: {
      id: "seed-car-4",
      sellerId: seller.id,
      title: "McLaren 720S - MSO",
      description: "McLaren Special Operations bespoke build. Volcano Blue with carbon exterior pack.",
      brand: "McLaren",
      model: "720S",
      year: 2022,
      price: 385000,
      listingType: "FIXED_PRICE",
      modificationLevel: "STAGE1",
      horsepower: 710,
      engine: "4.0L Twin-Turbo V8",
      torque: 568,
      transmission: "7-Speed SSG",
      mileage: 5000,
      location: "London, UK",
      country: "UK",
      city: "London",
      images: IMAGES.cars.mclaren,
      isFeatured: true,
      status: "active",
    },
  });

  await prisma.carListing.upsert({
    where: { id: "seed-car-5" },
    update: { images: IMAGES.cars.bmw },
    create: {
      id: "seed-car-5",
      sellerId: seller.id,
      title: "BMW M4 Competition - G82",
      description: "Fully built G82 M4 with Stage 3 tune, catless downpipes, and custom exhaust. 650whp.",
      brand: "BMW",
      model: "M4 Competition",
      year: 2022,
      price: 95000,
      listingType: "FIXED_PRICE",
      modificationLevel: "STAGE3",
      horsepower: 650,
      engine: "3.0L Twin-Turbo I6",
      torque: 550,
      transmission: "8-Speed M Steptronic",
      mileage: 15000,
      location: "Munich, Germany",
      country: "Germany",
      city: "Munich",
      images: IMAGES.cars.bmw,
      isFeatured: false,
      status: "active",
    },
  });

  // Parts with real images (use create for first run - part may not exist yet)
  const existingPart = await prisma.partListing.findFirst({
    where: { title: "BorgWarner EFR 9174 Turbo Kit" },
  });
  if (existingPart) {
    await prisma.partListing.update({
      where: { id: existingPart.id },
      data: { images: IMAGES.parts.turbo },
    });
  } else {
    await prisma.partListing.create({
      data: {
        sellerId: seller.id,
      title: "BorgWarner EFR 9174 Turbo Kit",
      description: "Brand new EFR turbo kit for BMW N54/N55. Complete with manifold and wastegate.",
      category: "TURBO_KITS",
      condition: "NEW",
      price: 4500,
      images: IMAGES.parts.turbo,
        brand: "BorgWarner",
        compatibility: { cars: ["BMW 335i", "BMW 135i", "BMW 535i"] },
        status: "active",
      },
    });
  }

  await prisma.partListing.create({
    data: {
      sellerId: seller.id,
      title: "Akrapovic Titanium Exhaust System",
      description: "Full titanium exhaust for Porsche 911 991/992. Includes downpipes and valved mufflers.",
      category: "EXHAUST_SYSTEMS",
      condition: "NEW",
      price: 6500,
      images: IMAGES.parts.exhaust,
      brand: "Akrapovic",
      compatibility: { cars: ["Porsche 911 Carrera", "Porsche 911 Turbo"] },
      status: "active",
    },
  });

  await prisma.partListing.create({
    data: {
      sellerId: seller.id,
      title: "Vorsteiner VRS Aero Kit - Lamborghini Huracán",
      description: "Complete carbon fiber aero kit: front lip, side skirts, rear diffuser, and wing.",
      category: "BODY_KITS",
      condition: "NEW",
      price: 18500,
      images: IMAGES.parts.bodyKit,
      brand: "Vorsteiner",
      compatibility: { cars: ["Lamborghini Huracán", "Huracán EVO", "Huracán STO"] },
      status: "active",
    },
  });

  await prisma.partListing.create({
    data: {
      sellerId: seller.id,
      title: "BBS FI-R 20\" Forged Wheels - Set of 4",
      description: "Ultra-lightweight forged wheels. Gloss black, perfect fitment for M3/M4.",
      category: "WHEELS_TIRES",
      condition: "USED",
      price: 4200,
      images: IMAGES.parts.wheels,
      brand: "BBS",
      compatibility: { cars: ["BMW M3", "BMW M4", "BMW M2"] },
      status: "active",
    },
  });

  await prisma.partListing.create({
    data: {
      sellerId: seller.id,
      title: "ECU Remap - Stage 2 Tune",
      description: "Custom ECU tune for Audi RS5 2.9 V6. Gains 80hp/100nm. Plug and play.",
      category: "ELECTRONICS_ECU",
      condition: "NEW",
      price: 1200,
      images: IMAGES.parts.engine,
      brand: "Custom",
      compatibility: { cars: ["Audi RS5", "Audi RS4", "Porsche Panamera 2.9"] },
      status: "active",
    },
  });

  // Workshop with real images
  await prisma.workshop.upsert({
    where: { userId: seller.id },
    update: {
      logo: IMAGES.workshopLogo,
      images: IMAGES.workshops,
    },
    create: {
      userId: seller.id,
      name: "Elite Performance Garage",
      description: "Premium dyno tuning, ECU remapping, and performance upgrades. State-of-the-art facility.",
      logo: IMAGES.workshopLogo,
      images: IMAGES.workshops,
      address: "123 Racing Street",
      city: "Los Angeles",
      country: "USA",
      email: "contact@elitegarage.com",
      services: ["dyno", "ecu", "wrapping", "body_kit"],
      rating: 4.9,
      isActive: true,
    },
  });

  // Create second workshop for variety
  const workshopUser = await prisma.user.upsert({
    where: { email: "workshop@exoticcars.com" },
    update: {},
    create: {
      email: "workshop@exoticcars.com",
      passwordHash: hash,
      name: "Mike's Tuning",
      role: "WORKSHOP",
      avatar: IMAGES.userAvatar,
    },
  });
  await prisma.userProfile.upsert({
    where: { userId: workshopUser.id },
    update: {},
    create: { userId: workshopUser.id },
  });
  await prisma.workshop.create({
    data: {
      userId: workshopUser.id,
      name: "Mike's Premium Tuning",
      description: "Specialists in European performance tuning. Dyno, ECU, exhaust fabrication.",
      logo: IMAGES.workshopLogo,
      images: IMAGES.workshops,
      address: "456 Motorsport Ave",
      city: "Miami",
      country: "USA",
      email: "info@mikestuning.com",
      services: ["dyno", "ecu", "exhaust", "suspension"],
      rating: 4.8,
      isActive: true,
    },
  });

  // Events with real cover images
  const existingEvent = await prisma.event.findFirst({
    where: { title: "Exotic Cars Meet - Downtown" },
  });
  if (existingEvent) {
    await prisma.event.update({
      where: { id: existingEvent.id },
      data: { coverImage: IMAGES.events[0] },
    });
  } else {
    await prisma.event.create({
      data: {
        title: "Exotic Cars Meet - Downtown",
      description: "Monthly exotic car meetup. All welcome. Coffee, cars, and community.",
      coverImage: IMAGES.events[0],
      location: "Central Park",
      city: "New York",
      country: "USA",
      startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        status: "PUBLISHED",
      },
    });
  }

  await prisma.event.create({
    data: {
      title: "Supercar Sunday - Pacific Coast",
      description: "Coastal drive and meet. Ferraris, Lamborghinis, McLarens welcome.",
      coverImage: IMAGES.events[1],
      location: "Malibu Pier",
      city: "Los Angeles",
      country: "USA",
      startTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      status: "PUBLISHED",
    },
  });

  await prisma.event.create({
    data: {
      title: "Track Day - Circuit Experience",
      description: "Full day at the track. Bring your modified car and push it to the limit.",
      coverImage: IMAGES.events[2],
      location: "Laguna Seca",
      city: "Monterey",
      country: "USA",
      startTime: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
      status: "PUBLISHED",
    },
  });

  // Create auction listing
  const auctionCar = await prisma.carListing.create({
    data: {
      sellerId: seller.id,
      title: "Ferrari F8 Tributo - Auction",
      description: "Rare F8 Tributo going to auction. Rosso Corsa, full service history.",
      brand: "Ferrari",
      model: "F8 Tributo",
      year: 2020,
      listingType: "AUCTION",
      modificationLevel: "STOCK",
      horsepower: 710,
      engine: "3.9L Twin-Turbo V8",
      mileage: 12000,
      location: "Monaco",
      country: "Monaco",
      city: "Monte Carlo",
      images: IMAGES.cars.ferrari,
      isFeatured: true,
      status: "active",
    },
  });

  await prisma.auction.create({
    data: {
      carListingId: auctionCar.id,
      startPrice: 250000,
      reservePrice: 280000,
      currentPrice: 250000,
      startTime: new Date(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      extendMinutes: 5,
      status: "SCHEDULED",
    },
  });

  console.log("Seed complete with real images:", {
    admin: admin.email,
    seller: seller.email,
    buyer: buyer.email,
    cars: 6,
    parts: 5,
    workshops: 2,
    events: 3,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
