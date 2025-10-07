# syntax=docker/dockerfile:1

# Build stage
FROM --platform=linux/amd64 node:20-alpine AS builder

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Accept build arguments for Next.js public environment variables (for override)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY

# Set environment variables for build
# Note: NEXT_PUBLIC_* variables must be set at build time to be embedded in the client bundle
ENV NEXT_TELEMETRY_DISABLED=1

# Use build args if provided, otherwise .env files will be used by Next.js
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL:-}
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY:-}

# Create public directory if it doesn't exist (Next.js may not create it if empty)
RUN mkdir -p public

# Build the Next.js application
RUN npm run build

# Production stage
FROM --platform=linux/amd64 node:20-alpine AS runner

WORKDIR /app

# Set to production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user (Airbase requires UID 999)
# Create group with GID 999, ignore if it already exists
RUN addgroup --system --gid 999 nodejs || true
RUN adduser --system --uid 999 --ingroup nodejs nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose the port the app runs on (Airbase will set PORT at runtime)
EXPOSE $PORT

# Set default port and hostname (Airbase will override PORT at runtime)
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]

