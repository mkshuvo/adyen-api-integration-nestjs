# ui/Dockerfile
FROM node:lts-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm i

FROM node:lts-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci || npm i
RUN npm run build

FROM node:lts-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copy runtime deps and build artifacts from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
EXPOSE 9807
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "9807"]
