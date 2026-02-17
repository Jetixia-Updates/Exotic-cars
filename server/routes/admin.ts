import { Router } from "express";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { z } from "zod";

export const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(requireRole("ADMIN"));

// —— Stats ——
adminRouter.get("/stats", async (_req, res) => {
  const [users, cars, auctions, workshops, orders, parts] = await Promise.all([
    prisma.user.count(),
    prisma.carListing.count(),
    prisma.auction.count(),
    prisma.workshop.count(),
    prisma.order.count(),
    prisma.partListing.count(),
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
    parts,
    revenue: revenue._sum.totalAmount ?? 0,
  });
});

// —— Users ——
adminRouter.get("/users", async (req, res) => {
  const { page = "1", limit = "20", role, search } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where: Record<string, unknown> = {};
  if (role) where.role = role;
  if (search && String(search).trim()) {
    where.OR = [
      { email: { contains: String(search), mode: "insensitive" } },
      { name: { contains: String(search), mode: "insensitive" } },
    ];
  }
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: Number(limit),
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);
  res.json({ users, total, page: Number(page), limit: Number(limit) });
});

adminRouter.get("/users/:id", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      phone: true,
      role: true,
      isActive: true,
      isVerified: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  const [profile, listingsCount, bidsCount, ordersCount] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId: user.id } }),
    prisma.carListing.count({ where: { sellerId: user.id } }),
    prisma.bid.count({ where: { userId: user.id } }),
    prisma.order.count({ where: { userId: user.id } }),
  ]);
  res.json({ ...user, profile, listingsCount, bidsCount, ordersCount });
});

const adminUserPatchSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(["BUYER", "SELLER", "WORKSHOP", "ADMIN"]).optional(),
});

adminRouter.patch("/users/:id", async (req, res) => {
  try {
    const body = adminUserPatchSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: body,
    });
    const { passwordHash, ...safe } = user;
    res.json(safe);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: e.errors });
    }
    throw e;
  }
});

// —— Cars ——
adminRouter.get("/cars", async (req, res) => {
  const { page = "1", limit = "20", status } = req.query;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  const [cars, total] = await Promise.all([
    prisma.carListing.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: { seller: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.carListing.count({ where }),
  ]);
  res.json({ cars, total, page: Number(page), limit: Number(limit) });
});

adminRouter.get("/cars/:id", async (req, res) => {
  const car = await prisma.carListing.findUnique({
    where: { id: req.params.id },
    include: { seller: true, auction: true },
  });
  if (!car) return res.status(404).json({ error: "Car not found" });
  const { passwordHash, ...sellerSafe } = car.seller;
  res.json({ ...car, seller: sellerSafe });
});

adminRouter.patch("/cars/:id", async (req, res) => {
  const { isFeatured, status } = req.body;
  const data: Record<string, unknown> = {};
  if (typeof isFeatured === "boolean") data.isFeatured = isFeatured;
  if (status && ["active", "sold", "reserved"].includes(status)) data.status = status;
  const car = await prisma.carListing.update({
    where: { id: req.params.id },
    data,
  });
  res.json(car);
});

adminRouter.patch("/cars/:id/featured", async (req, res) => {
  const { isFeatured } = req.body;
  const car = await prisma.carListing.update({
    where: { id: req.params.id },
    data: { isFeatured: Boolean(isFeatured) },
  });
  res.json(car);
});

// —— Auctions ——
adminRouter.get("/auctions", async (req, res) => {
  const { status } = req.query;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  const auctions = await prisma.auction.findMany({
    where,
    include: { carListing: { include: { seller: { select: { id: true, name: true } } } } },
    orderBy: { startTime: "desc" },
  });
  res.json(auctions);
});

// —— Parts ——
adminRouter.get("/parts", async (req, res) => {
  const { page = "1", limit = "20", status } = req.query;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  const [parts, total] = await Promise.all([
    prisma.partListing.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: { seller: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.partListing.count({ where }),
  ]);
  res.json({ parts, total, page: Number(page), limit: Number(limit) });
});

adminRouter.patch("/parts/:id", async (req, res) => {
  const { status } = req.body;
  if (!status || !["active", "inactive"].includes(status)) {
    return res.status(400).json({ error: "status must be 'active' or 'inactive'" });
  }
  const part = await prisma.partListing.update({
    where: { id: req.params.id },
    data: { status },
  });
  res.json(part);
});

// —— Workshops ——
adminRouter.get("/workshops", async (req, res) => {
  const { page = "1", limit = "20", isActive } = req.query;
  const where: Record<string, unknown> = {};
  if (isActive !== undefined) where.isActive = isActive === "true";
  const [workshops, total] = await Promise.all([
    prisma.workshop.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.workshop.count({ where }),
  ]);
  res.json({ workshops, total, page: Number(page), limit: Number(limit) });
});

adminRouter.patch("/workshops/:id", async (req, res) => {
  const { isActive, isVerified } = req.body;
  const data: Record<string, unknown> = {};
  if (typeof isActive === "boolean") data.isActive = isActive;
  if (typeof isVerified === "boolean") data.isVerified = isVerified;
  const workshop = await prisma.workshop.update({
    where: { id: req.params.id },
    data,
  });
  res.json(workshop);
});

// —— Events ——
adminRouter.get("/events", async (req, res) => {
  const { status } = req.query;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  const events = await prisma.event.findMany({
    where,
    orderBy: { startTime: "asc" },
  });
  res.json(events);
});

adminRouter.patch("/events/:id", async (req, res) => {
  const { status } = req.body;
  if (!status || !["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  const event = await prisma.event.update({
    where: { id: req.params.id },
    data: { status },
  });
  res.json(event);
});

// —— Bookings ——
adminRouter.get("/bookings", async (req, res) => {
  const { page = "1", limit = "20", status } = req.query;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: {
        user: { select: { id: true, name: true, email: true } },
        workshop: true,
        slot: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.count({ where }),
  ]);
  res.json({ bookings, total, page: Number(page), limit: Number(limit) });
});

// —— Orders ——
adminRouter.get("/orders", async (req, res) => {
  const { page = "1", limit = "20", status } = req.query;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { part: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.count({ where }),
  ]);
  res.json({ orders, total, page: Number(page), limit: Number(limit) });
});

// —— Notifications (admin: list recent or by user) ——
adminRouter.get("/notifications", async (req, res) => {
  const { userId, page = "1", limit = "50" } = req.query;
  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({ where }),
  ]);
  res.json({ notifications, total, page: Number(page), limit: Number(limit) });
});

adminRouter.post("/notifications", async (req: AuthRequest, res) => {
  const { userId, title, body, type, data } = req.body;
  if (!userId || !title) return res.status(400).json({ error: "userId and title required" });
  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      body: body ?? null,
      type: type ?? "admin",
      data: data ?? undefined,
    },
  });
  res.status(201).json(notification);
});
