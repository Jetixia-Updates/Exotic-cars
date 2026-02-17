import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { carsRouter } from "./routes/cars";
import { auctionsRouter } from "./routes/auctions";
import { partsRouter } from "./routes/parts";
import { workshopsRouter } from "./routes/workshops";
import { eventsRouter } from "./routes/events";
import { bookingsRouter } from "./routes/bookings";
import { cartRouter } from "./routes/cart";
import { ordersRouter } from "./routes/orders";
import { adminRouter } from "./routes/admin";
import { setupAuctionWebSocket } from "./ws/auction";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests" },
});
app.use("/api", limiter);

// Health
app.get("/api/health", (_, res) => res.json({ status: "ok" }));

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/cars", carsRouter);
app.use("/api/auctions", auctionsRouter);
app.use("/api/parts", partsRouter);
app.use("/api/workshops", workshopsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/admin", adminRouter);

// WebSocket
setupAuctionWebSocket(io);

const PORT = process.env.API_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Exotic Cars API + WebSocket running on port ${PORT}`);
});
