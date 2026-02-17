import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { z } from "zod";

export const workshopsRouter = Router();

const createWorkshopSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  logo: z.string().optional(),
  images: z.array(z.string()).default([]),
  address: z.string(),
  city: z.string(),
  country: z.string(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  phone: z.string().optional(),
  email: z.string().email(),
  website: z.string().optional(),
  services: z.array(z.string()).default([]),
});

workshopsRouter.get("/", async (req, res) => {
  const { city, country, service, page = "1", limit = "12" } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where: Record<string, unknown> = { isActive: true };
  if (city) where.city = { contains: String(city), mode: "insensitive" };
  if (country) where.country = { contains: String(country), mode: "insensitive" };
  if (service) where.services = { has: String(service) };

  const [workshops, total] = await Promise.all([
    prisma.workshop.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { rating: "desc" },
    }),
    prisma.workshop.count({ where }),
  ]);
  res.json({ workshops, total, page: Number(page), limit: Number(limit) });
});

workshopsRouter.get("/:id", async (req, res) => {
  const workshop = await prisma.workshop.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      slots: { where: { isAvailable: true, date: { gte: new Date() } } },
    },
  });
  if (!workshop) return res.status(404).json({ error: "Workshop not found" });
  res.json(workshop);
});

workshopsRouter.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const body = createWorkshopSchema.parse(req.body);
    const existing = await prisma.workshop.findUnique({
      where: { userId: req.user!.userId },
    });
    if (existing) return res.status(400).json({ error: "Workshop already exists" });
    const workshop = await prisma.workshop.create({
      data: { ...body, userId: req.user!.userId },
    });
    res.status(201).json(workshop);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    throw e;
  }
});

workshopsRouter.post("/:id/slots", authenticate, async (req: AuthRequest, res) => {
  const workshop = await prisma.workshop.findUnique({
    where: { id: req.params.id },
  });
  if (!workshop || workshop.userId !== req.user!.userId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const { date, startTime, endTime } = req.body;
  const slot = await prisma.workshopSlot.create({
    data: {
      workshopId: workshop.id,
      date: new Date(date),
      startTime,
      endTime,
    },
  });
  res.status(201).json(slot);
});
