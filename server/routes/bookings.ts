import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { z } from "zod";

export const bookingsRouter = Router();

const createBookingSchema = z.object({
  workshopId: z.string(),
  slotId: z.string().optional(),
  service: z.string().min(2),
  description: z.string().optional(),
  carInfo: z.string().optional(),
});

bookingsRouter.get("/", authenticate, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const role = req.user!.role;
  if (role === "WORKSHOP") {
    const workshop = await prisma.workshop.findUnique({
      where: { userId },
    });
    if (!workshop) return res.json([]);
    const bookings = await prisma.booking.findMany({
      where: { workshopId: workshop.id },
      include: { user: { select: { id: true, name: true, phone: true } }, slot: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(bookings);
  }
  const bookings = await prisma.booking.findMany({
    where: { userId },
    include: { workshop: true, slot: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(bookings);
});

bookingsRouter.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const body = createBookingSchema.parse(req.body);
    const booking = await prisma.booking.create({
      data: {
        userId: req.user!.userId,
        workshopId: body.workshopId,
        slotId: body.slotId,
        service: body.service,
        description: body.description,
        carInfo: body.carInfo,
      },
      include: { workshop: true },
    });
    if (body.slotId) {
      await prisma.workshopSlot.update({
        where: { id: body.slotId },
        data: { isAvailable: false },
      });
    }
    res.status(201).json(booking);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    throw e;
  }
});

bookingsRouter.patch("/:id/status", authenticate, async (req: AuthRequest, res) => {
  const { status } = req.body;
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  const workshop = await prisma.workshop.findUnique({
    where: { id: booking.workshopId },
  });
  if (!workshop || workshop.userId !== req.user!.userId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const updated = await prisma.booking.update({
    where: { id: req.params.id },
    data: { status },
  });
  res.json(updated);
});
