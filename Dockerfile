# Multi-stage Dockerfile for Document Compressor
# Includes Node.js 20, Ghostscript, QPDF, and LibreOffice for full document optimization

FROM node:20-bookworm-slim AS base

# Install system dependencies: Ghostscript, QPDF, and LibreOffice
RUN apt-get update && apt-get install -y --no-install-recommends \
    ghostscript \
    qpdf \
    libreoffice-nogui \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Create persistent storage and data directories
RUN mkdir -p /app/data /app/storage/compressed /app/storage/temp

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
