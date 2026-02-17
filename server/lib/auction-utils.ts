import { prisma } from "./prisma";

const MIN_BID_INCREMENT_PERCENT = 0.01; // 1%
const MIN_BID_INCREMENT_ABS = 500;

export function getMinNextBid(currentPrice: number): number {
  const byPercent = currentPrice * (1 + MIN_BID_INCREMENT_PERCENT);
  const byAbs = currentPrice + MIN_BID_INCREMENT_ABS;
  return Math.ceil(Math.max(byPercent, byAbs) / 100) * 100; // round up to nearest 100
}

export async function syncAuctionStatus(auctionId: string): Promise<"LIVE" | "ENDED" | "SCHEDULED" | null> {
  const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
  if (!auction) return null;
  const now = new Date();
  if (auction.endTime < now) {
    await prisma.auction.update({ where: { id: auctionId }, data: { status: "ENDED" } });
    return "ENDED";
  }
  if (auction.status === "SCHEDULED" && auction.startTime <= now) {
    await prisma.auction.update({ where: { id: auctionId }, data: { status: "LIVE" } });
    return "LIVE";
  }
  return auction.status as "LIVE" | "ENDED" | "SCHEDULED";
}

/** Anti-sniping: if bid is within extendMinutes of end, extend endTime */
export function getExtendedEndTime(
  currentEndTime: Date,
  extendMinutes: number
): Date {
  const now = new Date();
  const threshold = new Date(currentEndTime.getTime() - extendMinutes * 60 * 1000);
  if (now >= threshold) {
    return new Date(now.getTime() + extendMinutes * 60 * 1000);
  }
  return currentEndTime;
}
