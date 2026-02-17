import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-11-20.acacia" });

export const ordersRouter = Router();

ordersRouter.get("/", authenticate, async (req: AuthRequest, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.userId },
    include: { items: { include: { part: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
});

ordersRouter.post("/create-payment-intent", authenticate, async (req: AuthRequest, res) => {
  const { cartItemIds } = req.body;
  const where: { userId: string; id?: { in: string[] } } = { userId: req.user!.userId };
  if (cartItemIds?.length) where.id = { in: cartItemIds };
  const items = await prisma.cartItem.findMany({
    where,
    include: { part: true },
  });
  if (items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }
  const total = items.reduce((sum, i) => sum + i.part.price * i.quantity, 0);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(total * 100),
    currency: "usd",
    metadata: {
      userId: req.user!.userId,
      items: JSON.stringify(items.map((i) => ({ partListingId: i.partListingId, quantity: i.quantity }))),
    },
  });
  res.json({ clientSecret: paymentIntent.client_secret });
});

ordersRouter.post("/confirm", authenticate, async (req: AuthRequest, res) => {
  const { paymentIntentId } = req.body;
  const items = await prisma.cartItem.findMany({
    where: { userId: req.user!.userId },
    include: { part: true },
  });
  const total = items.reduce((sum, i) => sum + i.part.price * i.quantity, 0);
  const order = await prisma.order.create({
    data: {
      userId: req.user!.userId,
      totalAmount: total,
      paymentIntentId,
      stripePaymentId: paymentIntentId,
      status: "paid",
    },
  });
  for (const item of items) {
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        partListingId: item.partListingId,
        quantity: item.quantity,
        price: item.part.price,
      },
    });
  }
  await prisma.cartItem.deleteMany({ where: { userId: req.user!.userId } });
  const fullOrder = await prisma.order.findUnique({
    where: { id: order.id },
    include: { items: { include: { part: true } } },
  });
  res.json(fullOrder);
});
