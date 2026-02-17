import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { getMinNextBid, syncAuctionStatus, getExtendedEndTime } from "../lib/auction-utils";
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

/** Sync status for one auction and return updated */
async function getAuctionWithSync(id: string) {
  await syncAuctionStatus(id);
  return prisma.auction.findUnique({
    where: { id },
    include: {
      carListing: { include: { seller: { select: { id: true, name: true, avatar: true } } } },
      bids: { orderBy: { createdAt: "desc" }, take: 50, include: { user: { select: { id: true, name: true } } } },
    },
  });
}

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
    orderBy: { endTime: "asc" },
    include: {
      carListing: {
        include: { seller: { select: { id: true, name: true } } },
      },
    },
  });
  res.json(auctions);
});

auctionsRouter.get("/upcoming", async (req, res) => {
  const now = new Date();
  const auctions = await prisma.auction.findMany({
    where: { status: "SCHEDULED", startTime: { gt: now } },
    orderBy: { startTime: "asc" },
    take: 20,
    include: {
      carListing: {
        include: { seller: { select: { id: true, name: true } } },
      },
    },
  });
  res.json(auctions);
});

auctionsRouter.get("/ended", async (req, res) => {
  const auctions = await prisma.auction.findMany({
    where: { status: "ENDED" },
    orderBy: { endTime: "desc" },
    take: 20,
    include: {
      carListing: {
        include: { seller: { select: { id: true, name: true } } },
      },
    },
  });
  res.json(auctions);
});

auctionsRouter.get("/min-bid/:id", async (req, res) => {
  const auction = await prisma.auction.findUnique({
    where: { id: req.params.id },
  });
  if (!auction) return res.status(404).json({ error: "Auction not found" });
  const minBid = getMinNextBid(auction.currentPrice);
  res.json({ minBid, currentPrice: auction.currentPrice });
});

auctionsRouter.get("/:id", async (req, res) => {
  const auction = await getAuctionWithSync(req.params.id);
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
    const existingAuction = await prisma.auction.findUnique({
      where: { carListingId: car.id },
    });
    if (existingAuction) {
      return res.status(400).json({ error: "This car already has an auction" });
    }
    if (car.listingType !== "AUCTION") {
      await prisma.carListing.update({
        where: { id: car.id },
        data: { listingType: "AUCTION" },
      });
    }
    const startTime = new Date(body.startTime);
    const endTime = new Date(body.endTime);
    if (endTime <= startTime) {
      return res.status(400).json({ error: "End time must be after start time" });
    }
    const status = startTime <= new Date() ? "LIVE" : "SCHEDULED";
    const auction = await prisma.auction.create({
      data: {
        carListingId: body.carListingId,
        startPrice: body.startPrice,
        reservePrice: body.reservePrice,
        currentPrice: body.startPrice,
        startTime,
        endTime,
        extendMinutes: body.extendMinutes,
        status,
      },
      include: { carListing: true },
    });
    res.status(201).json(auction);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    throw e;
  }
});

auctionsRouter.post("/:id/start", authenticate, async (req: AuthRequest, res) => {
  const auction = await prisma.auction.findUnique({
    where: { id: req.params.id },
    include: { carListing: true },
  });
  if (!auction) return res.status(404).json({ error: "Auction not found" });
  if (auction.carListing.sellerId !== req.user!.userId) {
    return res.status(403).json({ error: "Not your auction" });
  }
  if (auction.status !== "SCHEDULED") {
    return res.status(400).json({ error: "Auction is not scheduled" });
  }
  if (auction.startTime > new Date()) {
    return res.status(400).json({ error: "Start time has not passed yet" });
  }
  const updated = await prisma.auction.update({
    where: { id: auction.id },
    data: { status: "LIVE" },
    include: { carListing: true, bids: true },
  });
  res.json(updated);
});

auctionsRouter.post("/:id/bid", authenticate, async (req: AuthRequest, res) => {
  const { amount } = req.body;
  const numAmount = Number(amount);
  const auction = await prisma.auction.findUnique({
    where: { id: req.params.id },
    include: { carListing: true },
  });
  if (!auction) return res.status(404).json({ error: "Auction not found" });
  await syncAuctionStatus(auction.id);
  const updatedAuction = await prisma.auction.findUnique({ where: { id: auction.id } });
  if (!updatedAuction) return res.status(404).json({ error: "Auction not found" });
  if (updatedAuction.status !== "LIVE") {
    return res.status(400).json({ error: "Auction is not live" });
  }
  if (new Date() > updatedAuction.endTime) {
    return res.status(400).json({ error: "Auction has ended" });
  }
  const minBid = getMinNextBid(updatedAuction.currentPrice);
  if (numAmount < minBid) {
    return res.status(400).json({ error: `Minimum bid is ${minBid}` });
  }
  const newEndTime = getExtendedEndTime(updatedAuction.endTime, updatedAuction.extendMinutes);
  const bid = await prisma.bid.create({
    data: {
      auctionId: updatedAuction.id,
      userId: req.user!.userId,
      amount: numAmount,
    },
  });
  const updated = await prisma.auction.update({
    where: { id: updatedAuction.id },
    data: {
      currentPrice: numAmount,
      currentBidderId: req.user!.userId,
      bidCount: { increment: 1 },
      endTime: newEndTime,
    },
    include: {
      carListing: true,
      bids: { orderBy: { createdAt: "desc" }, take: 20, include: { user: { select: { id: true, name: true } } } },
    },
  });
  res.json({ bid, auction: updated, minNextBid: getMinNextBid(updated.currentPrice) });
});
