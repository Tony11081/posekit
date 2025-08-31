# Multi-stage build for PoseKit application
# Stage 1: Build API
FROM node:18-alpine AS api-builder
WORKDIR /app
COPY package.json turbo.json ./
COPY apps/api/package.json ./apps/api/
RUN npm install
COPY apps/api ./apps/api
RUN npm run build --workspace=api

# Stage 2: Build Web
FROM node:18-alpine AS web-builder
WORKDIR /app
COPY package.json turbo.json ./
COPY apps/web/package.json ./apps/web/
RUN npm install
COPY apps/web ./apps/web
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_CDN_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_CDN_URL=$NEXT_PUBLIC_CDN_URL
RUN npm run build --workspace=web

# Stage 3: Production API
FROM node:18-alpine AS api-production
RUN apk add --no-cache curl
WORKDIR /app
COPY --from=api-builder /app/apps/api/dist ./
COPY --from=api-builder /app/apps/api/package.json ./
COPY --from=api-builder /app/node_modules ./node_modules
COPY apps/api/src/db/schema.sql ./db/
RUN mkdir -p uploads
EXPOSE 3001
CMD ["node", "index.js"]

# Stage 4: Production Web
FROM node:18-alpine AS web-production
RUN apk add --no-cache curl
WORKDIR /app
COPY --from=web-builder /app/apps/web/.next ./.next
COPY --from=web-builder /app/apps/web/package.json ./
COPY --from=web-builder /app/apps/web/public ./public
COPY --from=web-builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "start"]