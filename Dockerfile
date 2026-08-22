FROM node:20 AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/middleware.ts ./middleware.ts
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js
EXPOSE 3000
# db push + seed opcional. Se nao tiver ADMIN_EMAIL/ADMIN_PASSWORD, segue sem erro.
CMD ["sh", "-c", "node node_modules/prisma/build/index.js db push --skip-generate && if [ -n \"$ADMIN_EMAIL\" ] && [ -n \"$ADMIN_PASSWORD\" ]; then npx tsx prisma/seed.ts; else echo 'Skipping seed (no ADMIN_EMAIL/ADMIN_PASSWORD). Use prisma/seed.ts manually.'; fi && npx next start"]
