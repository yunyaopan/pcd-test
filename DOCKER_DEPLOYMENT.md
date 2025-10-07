# Docker Deployment Guide

This guide explains how to build and deploy your Next.js application as a Docker image to GitHub Container Registry (GHCR).

## Prerequisites

- Docker installed on your machine
- GitHub account
- GitHub Personal Access Token (PAT) with `write:packages` and `read:packages` permissions

## Creating a GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name (e.g., "GHCR Push")
4. Select scopes: `write:packages`, `read:packages`, `delete:packages` (optional)
5. Click "Generate token" and save it securely

## One-Time Manual Deployment

### Step 1: Log in to GHCR

```bash
echo YOUR_GITHUB_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

Replace:
- `YOUR_GITHUB_PAT` with your Personal Access Token
- `YOUR_GITHUB_USERNAME` with your GitHub username

### Step 2: Build the Docker Image

```bash
docker build --platform linux/amd64 -t ghcr.io/YOUR_GITHUB_USERNAME/pcd-test:latest .
```

**Important:** The `--platform linux/amd64` flag ensures the image is built for AMD64/x86_64 architecture, which is necessary when building on Apple Silicon (M1/M2/M3) Macs but deploying to standard Linux servers.

This will build the image using the Dockerfile in the current directory.

### Step 3: Push to GHCR

```bash
docker push ghcr.io/YOUR_GITHUB_USERNAME/pcd-test:latest
```

### Step 4: Make the Package Public (Optional)

By default, packages are private. To make it public:
1. Go to your GitHub profile
2. Click on "Packages" tab
3. Find your `pcd-test` package
4. Click on it → Package settings
5. Scroll down to "Danger Zone" → "Change visibility" → "Public"

## Running the Docker Image

### Running Locally

Test the image locally before deploying:

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL="your_supabase_url" \
  -e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY="your_supabase_anon_key" \
  ghcr.io/YOUR_GITHUB_USERNAME/pcd-test:latest
```

Or using docker-compose:

```bash
# Create a .env file with your environment variables
cat > .env << EOF
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EOF

# Note: docker-compose.yml maps NEXT_PUBLIC_SUPABASE_ANON_KEY to 
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY which is what the app expects

# Run with docker-compose
docker-compose up
```

### Pulling from GHCR

To pull and run on a server:

```bash
# Log in to GHCR
echo YOUR_GITHUB_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Pull the image
docker pull ghcr.io/YOUR_GITHUB_USERNAME/pcd-test:latest

# Run the container
docker run -d -p 3000:3000 \
  --name pcd-test \
  -e NEXT_PUBLIC_SUPABASE_URL="your_supabase_url" \
  -e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY="your_supabase_anon_key" \
  --restart unless-stopped \
  ghcr.io/YOUR_GITHUB_USERNAME/pcd-test:latest
```

## Useful Docker Commands

### View running containers
```bash
docker ps
```

### View container logs
```bash
docker logs pcd-test
docker logs -f pcd-test  # Follow logs
```

### Stop the container
```bash
docker stop pcd-test
```

### Remove the container
```bash
docker rm pcd-test
```

### View all images
```bash
docker images
```

### Remove an image
```bash
docker rmi ghcr.io/YOUR_GITHUB_USERNAME/pcd-test:latest
```

## Tagging Best Practices

For production deployments, use semantic versioning:

```bash
# Build with version tag
docker build --platform linux/amd64 -t ghcr.io/YOUR_GITHUB_USERNAME/pcd-test:v1.0.0 .
docker build --platform linux/amd64 -t ghcr.io/YOUR_GITHUB_USERNAME/pcd-test:latest .

# Push both tags
docker push ghcr.io/YOUR_GITHUB_USERNAME/pcd-test:v1.0.0
docker push ghcr.io/YOUR_GITHUB_USERNAME/pcd-test:latest
```

## Platform Architecture Notes

### Building on Apple Silicon (M1/M2/M3)

If you're building on an Apple Silicon Mac but deploying to AMD64/x86_64 servers, you **must** specify the platform:

```bash
docker build --platform linux/amd64 -t ghcr.io/YOUR_GITHUB_USERNAME/pcd-test:latest .
```

The Dockerfile already includes `--platform=linux/amd64` in the FROM statements, but you should still use the flag during build to ensure consistency.

### Using Docker Compose

The `docker-compose.yml` file is already configured with `platform: linux/amd64`. Build and run with:

```bash
docker-compose build
docker-compose up
```

## Troubleshooting

### Build fails
- Ensure all dependencies in `package.json` are correct
- Check that `output: "standalone"` is set in `next.config.ts`
- Verify you're in the project root directory

### Platform mismatch errors
- Always use `--platform linux/amd64` when building on Apple Silicon
- If you get "exec format error" when running the container, it means the architecture doesn't match - rebuild with the correct platform flag

### Container won't start
- Check logs: `docker logs pcd-test`
- Verify environment variables are set correctly
- Ensure port 3000 is not already in use

### Can't push to GHCR
- Verify your PAT has correct permissions
- Check that you're logged in: `docker login ghcr.io`
- Ensure the package name is lowercase

### Image size is large
- Current Dockerfile uses multi-stage builds to minimize size
- Consider using `.dockerignore` to exclude unnecessary files (already configured)

## Environment Variables

Required environment variables for the application:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` - Your Supabase anonymous/publishable key

**Important:** The app code expects `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`, not `NEXT_PUBLIC_SUPABASE_ANON_KEY`. 

For convenience in docker-compose, you can use `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your `.env` file and docker-compose.yml will map it to the correct variable name.

When using `docker run` directly, make sure to use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`.

Add any additional environment variables your application needs when running the container.

## Security Notes

1. Never commit `.env` files or tokens to git
2. Use secrets management for production deployments
3. Regularly rotate your GitHub Personal Access Tokens
4. Keep your Docker images updated with security patches

