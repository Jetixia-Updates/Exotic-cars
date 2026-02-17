import { Router } from "express";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

export const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(requireRole("ADMIN"));

adminRouter.get("/stats", async (_req, res) => {
  const [users, cars, auctions, workshops, orders] = await Promise.all([
    prisma.user.count(),
    prisma.carListing.count(),
    prisma.auction.count(),
    prisma.workshop.count(),
    prisma.order.count(),
  ]);
  const revenue = await prisma.order.aggregate({
    where: { status: "paid" },
    _sum: { totalAmount: true },
  });
  res.json({
    users,
    cars,
    auctions,
    workshops,
    orders,
    revenue: revenue._sum.totalAmount || 0,
  });
});

adminRouter.get("/users", async (req, res) => {
  const { page = "1", limit = "20" } = req.query;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    }),
    prisma.user.count(),
  ]);
  res.json({ users, total, page: Number(page), limit: Number(limit) });
});

adminRouter.patch("/users/:id", async (req, res) => {
  const { isActive } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive },
  });
  const { passwordHash, ...safe } = user;
  res.json(safe);
});

adminRouter.get("/cars", async (req, res) => {
  const { page = "1", limit = "20" } = req.query;
  const [cars, total] = await Promise.all([
    prisma.carListing.findMany({
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: { seller: { select: { id: true, name: true } } },
    }),
    prisma.carListing.count(),
  ]);
  res.json({ cars, total, page: Number(page), limit: Number(limit) });
});

adminRouter.patch("/cars/:id/featured", async (req, res) => {
  const { isFeatured } = req.body;
  const car = await prisma.carListing.update({
    where: { id: req.params.id },
    data: { isFeatured },
  });
  res.json(car);
});

adminRouter.get("/auctions", async (req, res) => {
  const auctions = await prisma.auction.findMany({
    include: { carListing: true },
    orderBy: { startTime: "desc" },
  });
  res.json(auctions);
});
