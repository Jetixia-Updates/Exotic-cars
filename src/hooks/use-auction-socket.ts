"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth-store";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || (typeof window !== "undefined" ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.hostname}:3002` : "");

export interface AuctionState {
  id: string;
  currentPrice: number;
  currentBidderId: string | null;
  bidCount: number;
  endTime: string;
  status: string;
  carListing: unknown;
  bids: { id: string; amount: number; createdAt: string; user?: { id: string; name: string } }[];
}

export function useAuctionSocket(auctionId: string | null) {
  const [auction, setAuction] = useState<AuctionState | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!auctionId || !WS_BASE) return;
    const socket = io(`${WS_BASE}/auctions`, {
      auth: { token: token || undefined },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;
    socket.on("connect", () => {
      setConnected(true);
      setError(null);
      socket.emit("join:auction", auctionId);
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("error", (payload: { message?: string }) => setError(payload?.message || "Error"));
    socket.on("auction:state", (state: AuctionState) => setAuction(state));
    socket.on("bid:new", (payload: { auction: AuctionState }) => setAuction(payload.auction));
    return () => {
      socket.emit("leave:auction", auctionId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [auctionId, token]);

  return { auction, setAuction, connected, error };
}
