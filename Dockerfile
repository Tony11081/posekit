# Build stage for web frontend
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN npm install

# Copy source code
COPY apps/web ./apps/web
COPY apps/api ./apps/api

# Build arguments
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_CDN_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_CDN_URL=$NEXT_PUBLIC_CDN_URL

# Build web application
RUN npm run build --workspace=web

# Production stage
FROM node:18-alpine AS production
RUN apk add --no-cache curl

WORKDIR /app

# Copy built application
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/package.json ./package.json
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start the application
CMD ["npm", "start"]