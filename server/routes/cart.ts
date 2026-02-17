import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

export const cartRouter = Router();

cartRouter.get("/", authenticate, async (req: AuthRequest, res) => {
  const items = await prisma.cartItem.findMany({
    where: { userId: req.user!.userId },
    include: { part: true },
  });
  res.json(items);
});

cartRouter.post("/", authenticate, async (req: AuthRequest, res) => {
  const { partListingId, quantity = 1 } = req.body;
  const item = await prisma.cartItem.upsert({
    where: {
      userId_partListingId: {
        userId: req.user!.userId,
        partListingId,
      },
    },
    create: {
      userId: req.user!.userId,
      partListingId,
      quantity,
    },
    update: { quantity: { increment: quantity || 1 } },
    include: { part: true },
  });
  res.json(item);
});

cartRouter.delete("/:partId", authenticate, async (req: AuthRequest, res) => {
  await prisma.cartItem.deleteMany({
    where: {
      userId: req.user!.userId,
      partListingId: req.params.partId,
    },
  });
  res.status(204).send();
});
