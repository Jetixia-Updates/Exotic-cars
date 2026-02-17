# Exotic Cars

Elite global platform for exotic modified cars marketplace, live auctions, spare parts, workshops, and automotive community.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, ShadCN-style UI, Framer Motion, Zustand, React Query
- **Backend**: Express.js, REST API, Socket.io (WebSocket for auctions)
- **Database**: Neon PostgreSQL, Prisma ORM
- **Auth**: JWT + Refresh tokens, Role-based access (Buyer, Seller, Workshop, Admin)
- **Payments**: Stripe integration ready

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm
- Neon PostgreSQL database

### Setup

1. Clone and install:

```bash
cd "cars Exoric"
pnpm install
```

2. Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

3. Set your `DATABASE_URL` and `DIRECT_URL` (Neon PostgreSQL connection strings).

4. Generate Prisma client and push schema:

```bash
pnpm db:generate
pnpm db:push
```

5. Seed sample data (optional):

```bash
pnpm db:seed
```

6. Run development:

```bash
pnpm dev
```

- Frontend: http://localhost:3000
- API + WebSocket: http://localhost:3001

### Seed Accounts

| Email               | Password   | Role   |
|---------------------|------------|--------|
| admin@exoticcars.com| password123| Admin  |
| seller@exoticcars.com| password123| Seller |
| buyer@exoticcars.com | password123| Buyer  |

## Project Structure

```
├── prisma/
│   ├── schema.prisma   # Full database schema
│   └── seed.ts         # Sample data
├── server/
│   ├── index.ts        # Express + Socket.io
│   ├── routes/         # API routes
│   ├── middleware/     # Auth
│   └── ws/             # Auction WebSocket
├── src/
│   ├── app/            # Next.js App Router pages
│   ├── components/     # UI components
│   ├── lib/            # API client, utils
│   └── store/          # Zustand stores
└── netlify.toml        # Deployment config
```

## Main Modules

1. **User System** – Roles, profiles, garage, reviews
2. **Cars Marketplace** – Listings, filters, specs, images
3. **Live Auctions** – Real-time bidding via WebSocket
4. **Spare Parts** – Categories, compatibility, cart
5. **Workshops** – Directory, bookings, slots
6. **Events & Community** – Meetups, attendance
7. **Admin Dashboard** – Stats, user/car management

## Deployment

### Frontend (Netlify)

1. Connect your repo to Netlify
2. Build command: `pnpm build`
3. Publish directory: `.next`
4. Add env vars: `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`

### Backend (Render / Railway)

Deploy the `server/` as a Node.js service. The WebSocket server requires a persistent process (not serverless).

### Database (Neon)

1. Create a project at neon.tech
2. Copy connection strings to `.env`

## License

Proprietary - Exotic Cars
