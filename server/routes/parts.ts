import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { z } from "zod";

export const partsRouter = Router();

const createPartSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.enum([
    "ENGINES", "TURBO_KITS", "EXHAUST_SYSTEMS", "BODY_KITS",
    "WHEELS_TIRES", "ELECTRONICS_ECU", "SUSPENSION", "BRAKES", "INTERIOR", "OTHER",
  ]),
  condition: z.enum(["NEW", "USED", "REFURBISHED"]),
  price: z.number().positive(),
  currency: z.string().default("USD"),
  images: z.array(z.string()).default([]),
  compatibility: z.any().optional(),
  brand: z.string().optional(),
  partNumber: z.string().optional(),
  location: z.string().optional(),
  country: z.string().optional(),
});

partsRouter.get("/", async (req, res) => {
  const { category, condition, minPrice, maxPrice, search, page = "1", limit = "12" } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where: Record<string, unknown> = { status: "active" };
  if (category) where.category = category;
  if (condition) where.condition = condition;
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) (where.price as Record<string, number>).gte = Number(minPrice);
    if (maxPrice) (where.price as Record<string, number>).lte = Number(maxPrice);
  }
  if (search) {
    where.OR = [
      { title: { contains: String(search), mode: "insensitive" } },
      { description: { contains: String(search), mode: "insensitive" } },
    ];
  }

  const [parts, total] = await Promise.all([
    prisma.partListing.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
      include: { seller: { select: { id: true, name: true } } },
    }),
    prisma.partListing.count({ where }),
  ]);
  res.json({ parts, total, page: Number(page), limit: Number(limit) });
});

partsRouter.get("/categories", (_, res) => {
  res.json([
    "ENGINES", "TURBO_KITS", "EXHAUST_SYSTEMS", "BODY_KITS",
    "WHEELS_TIRES", "ELECTRONICS_ECU", "SUSPENSION", "BRAKES", "INTERIOR", "OTHER",
  ]);
});

partsRouter.get("/:id", async (req, res) => {
  const part = await prisma.partListing.findUnique({
    where: { id: req.params.id },
    include: { seller: { select: { id: true, name: true, avatar: true } } },
  });
  if (!part) return res.status(404).json({ error: "Part not found" });
  await prisma.partListing.update({
    where: { id: part.id },
    data: { viewCount: { increment: 1 } },
  });
  res.json({ ...part, viewCount: part.viewCount + 1 });
});

partsRouter.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const body = createPartSchema.parse(req.body);
    const part = await prisma.partListing.create({
      data: { ...body, sellerId: req.user!.userId },
    });
    res.status(201).json(part);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    throw e;
  }
});
