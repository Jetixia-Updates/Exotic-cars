import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(["BUYER", "SELLER", "WORKSHOP"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post("/register", async (req, res) => {
  try {
    const body = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        name: body.name,
        role: body.role || "BUYER",
      },
      select: { id: true, email: true, name: true, role: true, avatar: true },
    });
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user.id);
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.userProfile.create({
      data: { userId: user.id },
    });
    res.json({ user, accessToken, refreshToken, expiresIn: 900 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: e.errors });
    }
    throw e;
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    if (!user.isActive) {
      return res.status(401).json({ error: "Account is deactivated" });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user.id);
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    const { passwordHash, ...safeUser } = user;
    res.json({
      user: safeUser,
      accessToken,
      refreshToken,
      expiresIn: 900,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: e.errors });
    }
    throw e;
  }
});

authRouter.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "Refresh token required" });
  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });
  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
  const accessToken = generateAccessToken(stored.user);
  const { passwordHash, ...safeUser } = stored.user;
  res.json({ user: safeUser, accessToken, expiresIn: 900 });
});

function generateAccessToken(user: { id: string; email: string; role: string }) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
  );
}

function generateRefreshToken(userId: string) {
  return jwt.sign(
    { userId, jti: uuidv4() },
    process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );
}
