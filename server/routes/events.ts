import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

export const eventsRouter = Router();

eventsRouter.get("/", async (req, res) => {
  const { status, country, page = "1", limit = "12" } = req.query;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (country) where.country = { contains: String(country), mode: "insensitive" };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { startTime: "asc" },
    }),
    prisma.event.count({ where }),
  ]);
  res.json({ events, total, page: Number(page), limit: Number(limit) });
});

eventsRouter.get("/:id", async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    include: {
      attendances: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      photos: true,
    },
  });
  if (!event) return res.status(404).json({ error: "Event not found" });
  res.json(event);
});

eventsRouter.post("/", authenticate, async (req: AuthRequest, res) => {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
  const event = await prisma.event.create({
    data: { ...req.body, creatorId: req.user!.userId },
  });
  res.status(201).json(event);
});

eventsRouter.post("/:id/join", authenticate, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.status !== "PUBLISHED") {
    return res.status(400).json({ error: "Event not available" });
  }
  const attendance = await prisma.eventAttendance.upsert({
    where: { eventId_userId: { eventId: id, userId: req.user!.userId } },
    create: { eventId: id, userId: req.user!.userId },
    update: {},
  });
  res.json(attendance);
});
