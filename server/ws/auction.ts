import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

export function setupAuctionWebSocket(io: Server) {
  const auctionNs = io.of("/auctions");

  auctionNs.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const decoded = jwt.verify(
          token as string,
          process.env.JWT_SECRET || "dev-secret"
        ) as AuthPayload;
        (socket as Socket & { user?: AuthPayload }).user = decoded;
      } catch {
        // Allow anonymous for viewing
      }
    }
    next();
  });

  auctionNs.on("connection", (socket: Socket) => {
    socket.on("join:auction", async (auctionId: string) => {
      socket.join(`auction:${auctionId}`);
      const auction = await prisma.auction.findUnique({
        where: { id: auctionId },
        include: {
          carListing: true,
          bids: { take: 20, orderBy: { createdAt: "desc" } },
        },
      });
      if (auction) {
        socket.emit("auction:state", auction);
      }
    });

    socket.on("leave:auction", (auctionId: string) => {
      socket.leave(`auction:${auctionId}`);
    });

    socket.on("bid", async (data: { auctionId: string; amount: number }) => {
      const user = (socket as Socket & { user?: AuthPayload }).user;
      if (!user) {
        socket.emit("error", { message: "Authentication required to bid" });
        return;
      }
      const { auctionId, amount } = data;
      if (!auctionId || !amount || amount <= 0) return;

      const auction = await prisma.auction.findUnique({
        where: { id: auctionId },
      });
      if (!auction || auction.status !== "LIVE") return;
      if (amount <= auction.currentPrice) return;

      const bid = await prisma.bid.create({
        data: {
          auctionId,
          userId: user.userId,
          amount,
        },
      });

      const updated = await prisma.auction.update({
        where: { id: auctionId },
        data: {
          currentPrice: amount,
          currentBidderId: user.userId,
          bidCount: { increment: 1 },
        },
        include: {
          carListing: true,
          bids: { take: 5, orderBy: { createdAt: "desc" } },
        },
      });

      auctionNs.to(`auction:${auctionId}`).emit("bid:new", {
        bid: { ...bid, user: { id: user.userId } },
        auction: updated,
      });
    });
  });
}
