# Shopify Remix Prisma App

This repository scaffolds a Shopify app using Remix, React, Polaris, App Bridge v3, Prisma, and PostgreSQL. It includes the OAuth installation flow (offline + online tokens), authenticated admin routes, service layers for Shopify API access, storefront script placeholders, and billing boilerplate.

## Getting Started

1. Copy `.env.example` to `.env` and fill in your Shopify + database credentials.
2. Install dependencies:

```bash
npm install
```

3. Generate the Prisma client and run database migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

4. Start the Remix dev server (compatible with `shopify app dev`):

```bash
npm run dev
```

Use `npm run shopify:dev` when running inside the Shopify CLI so tunnels and webhook forwarding are configured automatically.

## Key Structure

- `app/routes` contains the OAuth handlers, webhook endpoint, admin dashboard, product settings, and waitlist placeholders.
- `app/services` centralizes Shopify + Prisma helpers, including the `shopifyApp` instance and API utilities.
- `app/functions/storefront-script.server.ts` is a placeholder for future script injections.
- `prisma/schema.prisma` stores Shopify sessions plus basic installation metadata.
- `shopify.app.toml` seeds Shopify CLI deployment metadata.

Extend the service modules and admin pages to implement your business logic (pre-order, waitlist, billing plans, etc.).
