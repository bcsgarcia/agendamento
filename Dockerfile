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
# Patch server.js standalone: força bind em 0.0.0.0 (Docker override HOSTNAME=container-id)
RUN node -e "const fs=require('fs');const p='.next/standalone/server.js';let c=fs.readFileSync(p,'utf8');c=c.replace(\"const hostname = process.env.HOSTNAME || '0.0.0.0'\",\"const hostname = '0.0.0.0'\");fs.writeFileSync(p,c);console.log('patched OK');"

FROM node:20 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["sh", "-c", "node node_modules/prisma/build/index.js db push --skip-generate && node server.js"]
