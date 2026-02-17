import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { z } from "zod";

export const usersRouter = Router();

const profileSchema = z.object({
  bio: z.string().max(500).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

// —— Me (authenticated) —— must be before /:id
usersRouter.get("/me", authenticate, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      phone: true,
      role: true,
      locale: true,
      currency: true,
      isVerified: true,
      createdAt: true,
    },
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
  const [followerCount, followingCount] = await Promise.all([
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
  ]);
  res.json({ ...user, profile, followerCount, followingCount });
});

usersRouter.patch("/me", authenticate, async (req: AuthRequest, res) => {
  const { name, avatar, phone, locale, currency } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: { name, avatar, phone, locale, currency },
  });
  const { passwordHash, ...safe } = user;
  res.json(safe);
});

usersRouter.patch("/me/profile", authenticate, async (req: AuthRequest, res) => {
  try {
    const body = profileSchema.parse(req.body);
    const profile = await prisma.userProfile.upsert({
      where: { userId: req.user!.userId },
      create: { userId: req.user!.userId, ...body },
      update: body,
    });
    res.json(profile);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: e.errors });
    }
    throw e;
  }
});

usersRouter.get("/me/bids", authenticate, async (req: AuthRequest, res) => {
  const bids = await prisma.bid.findMany({
    where: { userId: req.user!.userId },
    include: {
      auction: { include: { carListing: { select: { id: true, title: true, brand: true, model: true, images: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json(bids);
});

usersRouter.get("/me/notifications", authenticate, async (req: AuthRequest, res) => {
  const { page = "1", limit = "20", unreadOnly } = req.query;
  const where = { userId: req.user!.userId };
  if (unreadOnly === "true") (where as Record<string, unknown>).isRead = false;
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

usersRouter.patch("/me/notifications/:id/read", authenticate, async (req: AuthRequest, res) => {
  const n = await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user!.userId },
    data: { isRead: true },
  });
  if (n.count === 0) return res.status(404).json({ error: "Notification not found" });
  res.json({ ok: true });
});

usersRouter.post("/me/notifications/read-all", authenticate, async (req: AuthRequest, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId },
    data: { isRead: true },
  });
  res.json({ ok: true });
});

usersRouter.post("/me/follow/:id", authenticate, async (req: AuthRequest, res) => {
  const targetId = req.params.id;
  if (targetId === req.user!.userId) return res.status(400).json({ error: "Cannot follow yourself" });
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) return res.status(404).json({ error: "User not found" });
  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: req.user!.userId, followingId: targetId } },
    create: { followerId: req.user!.userId, followingId: targetId },
    update: {},
  });
  res.json({ ok: true });
});

usersRouter.delete("/me/follow/:id", authenticate, async (req: AuthRequest, res) => {
  await prisma.follow.deleteMany({
    where: { followerId: req.user!.userId, followingId: req.params.id },
  });
  res.json({ ok: true });
});

// —— Public profile (by id) ——
usersRouter.get("/:id", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      name: true,
      avatar: true,
      createdAt: true,
    },
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
  const garage = await prisma.garage.findMany({
    where: { userId: user.id },
    include: { car: true },
  });
  const [followerCount, followingCount] = await Promise.all([
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
  ]);
  res.json({ ...user, profile, garage, followerCount, followingCount });
});
