# server/Dockerfile
FROM node:lts-alpine AS deps
WORKDIR /app
COPY package.json package*.json ./
RUN npm install

FROM node:lts-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

FROM node:lts-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Install only production dependencies in final image
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
# Copy compiled app
COPY --from=builder /app/dist ./dist
EXPOSE 8054
CMD ["node", "dist/main.js"]
