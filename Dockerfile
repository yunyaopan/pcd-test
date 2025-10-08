# syntax=docker/dockerfile:1

# Build stage using Airbase managed image
FROM gdssingapore/airbase:node-20-builder AS builder

WORKDIR /app

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Accept build arguments for Next.js public environment variables (for override)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY

# Use build args if provided, otherwise .env files will be used by Next.js
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL:-}
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY:-}

# Create public directory if it doesn't exist (Next.js may not create it if empty)
RUN mkdir -p public

# Build the Next.js application
RUN npm run build

# Production stage using Airbase managed image
FROM gdssingapore/airbase:node-20 AS runner

WORKDIR /app

# Set to production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create necessary directories with correct ownership
RUN mkdir .next && chown app:app .next
RUN mkdir .npm && chown app:app .npm

# Copy necessary files from builder with correct ownership
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public

# Switch to non-root user (pre-configured in managed image)
USER app

# Expose the port the app runs on
EXPOSE 3000

# Set default port and hostname (Airbase will override PORT at runtime)
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application using shell form to properly expand environment variables
CMD node server.js

