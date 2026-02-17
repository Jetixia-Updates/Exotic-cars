import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { z } from "zod";

export const carsRouter = Router();

const createCarSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  brand: z.string().min(2),
  model: z.string().min(2),
  year: z.number().int().min(1900).max(2030),
  price: z.number().positive().optional(),
  listingType: z.enum(["FIXED_PRICE", "AUCTION"]).default("FIXED_PRICE"),
  modificationLevel: z.enum(["STOCK", "STAGE1", "STAGE2", "STAGE3", "CUSTOM"]),
  horsepower: z.number().int().min(0),
  engine: z.string().optional(),
  torque: z.number().int().optional(),
  transmission: z.string().optional(),
  driveType: z.string().optional(),
  mileage: z.number().int().optional(),
  location: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  images: z.array(z.string()).default([]),
  videos: z.array(z.string()).default([]),
  modifications: z.any().optional(),
  specs: z.any().optional(),
});

carsRouter.get("/", async (req, res) => {
  const { brand, minHp, maxHp, country, minPrice, maxPrice, level, page = "1", limit = "12" } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where: Record<string, unknown> = { status: "active" };
  if (brand) where.brand = { contains: String(brand), mode: "insensitive" };
  if (minHp) where.horsepower = { ...(where.horsepower as object || {}), gte: Number(minHp) };
  if (maxHp) where.horsepower = { ...(where.horsepower as object || {}), lte: Number(maxHp) };
  if (country) where.country = { contains: String(country), mode: "insensitive" };
  if (minPrice) where.price = { ...(where.price as object || {}), gte: Number(minPrice) };
  if (maxPrice) where.price = { ...(where.price as object || {}), lte: Number(maxPrice) };
  if (level) where.modificationLevel = level;

  const [cars, total] = await Promise.all([
    prisma.carListing.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
      include: { seller: { select: { id: true, name: true, avatar: true } }, auction: true },
    }),
    prisma.carListing.count({ where }),
  ]);
  res.json({ cars, total, page: Number(page), limit: Number(limit) });
});

carsRouter.get("/featured", async (req, res) => {
  const cars = await prisma.carListing.findMany({
    where: { isFeatured: true, status: "active" },
    take: 8,
    orderBy: { createdAt: "desc" },
    include: { seller: { select: { id: true, name: true } } },
  });
  res.json(cars);
});

carsRouter.get("/:id", async (req, res) => {
  const car = await prisma.carListing.findUnique({
    where: { id: req.params.id },
    include: {
      seller: { select: { id: true, name: true, avatar: true } },
      auction: true,
    },
  });
  if (!car) return res.status(404).json({ error: "Car not found" });
  await prisma.carListing.update({
    where: { id: car.id },
    data: { viewCount: { increment: 1 } },
  });
  res.json({ ...car, viewCount: car.viewCount + 1 });
});

carsRouter.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const body = createCarSchema.parse(req.body);
    const car = await prisma.carListing.create({
      data: { ...body, sellerId: req.user!.userId },
      include: { seller: { select: { id: true, name: true } } },
    });
    if (body.listingType === "AUCTION") {
      // Auction creation handled by auctions route with car id
    }
    res.status(201).json(car);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    throw e;
  }
});
