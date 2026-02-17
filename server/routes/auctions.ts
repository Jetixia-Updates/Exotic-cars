import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { z } from "zod";

export const auctionsRouter = Router();

const createAuctionSchema = z.object({
  carListingId: z.string(),
  startPrice: z.number().positive(),
  reservePrice: z.number().positive().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  extendMinutes: z.number().int().min(1).max(15).default(5),
});

auctionsRouter.get("/", async (req, res) => {
  const { status, page = "1", limit = "12" } = req.query;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [auctions, total] = await Promise.all([
    prisma.auction.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { startTime: "desc" },
      include: {
        carListing: {
          include: { seller: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.auction.count({ where }),
  ]);
  res.json({ auctions, total, page: Number(page), limit: Number(limit) });
});

auctionsRouter.get("/live", async (req, res) => {
  const now = new Date();
  const auctions = await prisma.auction.findMany({
    where: { status: "LIVE", endTime: { gt: now } },
    include: {
      carListing: {
        include: { seller: { select: { id: true, name: true } } },
      },
    },
  });
  res.json(auctions);
});

auctionsRouter.get("/:id", async (req, res) => {
  const auction = await prisma.auction.findUnique({
    where: { id: req.params.id },
    include: {
      carListing: { include: { seller: { select: { id: true, name: true, avatar: true } } } },
      bids: { orderBy: { createdAt: "desc" }, take: 50, include: { user: { select: { name: true } } } },
    },
  });
  if (!auction) return res.status(404).json({ error: "Auction not found" });
  res.json(auction);
});

auctionsRouter.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const body = createAuctionSchema.parse(req.body);
    const car = await prisma.carListing.findUnique({
      where: { id: body.carListingId },
    });
    if (!car || car.sellerId !== req.user!.userId) {
      return res.status(403).json({ error: "Car not found or not yours" });
    }
    if (car.listingType !== "AUCTION") {
      await prisma.carListing.update({
        where: { id: car.id },
        data: { listingType: "AUCTION" },
      });
    }
    const auction = await prisma.auction.create({
      data: {
        carListingId: body.carListingId,
        startPrice: body.startPrice,
        reservePrice: body.reservePrice,
        currentPrice: body.startPrice,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        extendMinutes: body.extendMinutes,
        status: "SCHEDULED",
      },
      include: { carListing: true },
    });
    res.status(201).json(auction);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    throw e;
  }
});

auctionsRouter.post("/:id/bid", authenticate, async (req: AuthRequest, res) => {
  const { amount } = req.body;
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ error: "Invalid bid amount" });
  }
  const auction = await prisma.auction.findUnique({
    where: { id: req.params.id },
    include: { carListing: true },
  });
  if (!auction) return res.status(404).json({ error: "Auction not found" });
  if (auction.status !== "LIVE") {
    return res.status(400).json({ error: "Auction is not live" });
  }
  if (new Date() > auction.endTime) {
    return res.status(400).json({ error: "Auction has ended" });
  }
  if (numAmount <= auction.currentPrice) {
    return res.status(400).json({ error: "Bid must be higher than current price" });
  }
  const bid = await prisma.bid.create({
    data: {
      auctionId: auction.id,
      userId: req.user!.userId,
      amount: numAmount,
    },
  });
  const updated = await prisma.auction.update({
    where: { id: auction.id },
    data: {
      currentPrice: numAmount,
      currentBidderId: req.user!.userId,
      bidCount: { increment: 1 },
    },
  });
  res.json({ bid, auction: updated });
});
