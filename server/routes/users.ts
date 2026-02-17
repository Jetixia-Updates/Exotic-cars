import { Router } from "express";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

export const usersRouter = Router();

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
      createdAt: true,
    },
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
  });
  const followerCount = await prisma.follow.count({ where: { followingId: user.id } });
  const followingCount = await prisma.follow.count({ where: { followerId: user.id } });
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
  res.json({ ...user, profile, garage });
});
