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
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({ error: "Request body must be JSON with email, password, name" });
    }
    const body = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(body.password, 12);
    const role = (body.role === "SELLER" || body.role === "WORKSHOP" ? body.role : "BUYER") as "BUYER" | "SELLER" | "WORKSHOP";

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: body.email,
          passwordHash,
          name: body.name,
          role,
        },
        select: { id: true, email: true, name: true, role: true, avatar: true },
      });
      const refreshTokenValue = generateRefreshToken(user.id);
      await tx.refreshToken.create({
        data: {
          token: refreshTokenValue,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      await tx.userProfile.create({
        data: { userId: user.id },
      });
      return { user, refreshTokenValue };
    });

    const accessToken = generateAccessToken(result.user);
    return res.json({ user: result.user, accessToken, refreshToken: result.refreshTokenValue, expiresIn: 900 });
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: e.errors });
    }
    console.error("[auth/register]", e);
    const raw =
      e instanceof Error ? e.message : e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : String(e);
    const isDbError = /P1001|P1017|P2002|connect|database|ECONNREFUSED|unique constraint/i.test(raw);
    const message = isDbError
      ? raw.includes("unique") || raw.includes("P2002")
        ? "البريد الإلكتروني مستخدم مسبقاً"
        : "لا يمكن الاتصال بقاعدة البيانات. شغّل: pnpm dev"
      : process.env.NODE_ENV !== "production"
        ? raw || "Unknown error"
        : "Registration failed. Try again.";
    return res.status(500).json({ error: message });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({ error: "Request body must be JSON with email and password" });
    }
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    if (!user.isActive) {
      return res.status(401).json({ error: "Account is deactivated. Contact support." });
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
    console.error("[auth/login]", e);
    const raw = e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : String(e);
    const isDbError = /P1001|P1017|connect|database|ECONNREFUSED/i.test(raw);
    const message = isDbError
      ? "لا يمكن الاتصال بقاعدة البيانات. تأكد من تشغيل: pnpm dev"
      : process.env.NODE_ENV !== "production"
        ? raw
        : "Login failed. Try again.";
    return res.status(500).json({ error: message });
  }
});

// First admin: only when zero admins exist; requires FIRST_ADMIN_SECRET in body (and in env)
authRouter.post("/first-admin", async (req, res) => {
  const { secret, email, password, name } = req.body || {};
  const expectedSecret = process.env.FIRST_ADMIN_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return res.status(403).json({ error: "Invalid or missing first-admin secret" });
  }
  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  if (adminCount > 0) {
    return res.status(403).json({ error: "An admin already exists" });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(400).json({ error: "Email already registered" });
  }
  if (!email || !password || !name || password.length < 8) {
    return res.status(400).json({ error: "email, name, and password (min 8) required" });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: "ADMIN",
    },
    select: { id: true, email: true, name: true, role: true, avatar: true },
  });
  await prisma.userProfile.create({ data: { userId: user.id } });
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user.id);
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  res.status(201).json({ user, accessToken, refreshToken, expiresIn: 900 });
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
