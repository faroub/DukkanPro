# Docker Guide

Running the DukkanOS mobile app via Docker using Expo's development container.

## Overview

This guide explains how to run the DukkanOS app in a Docker container using the official `expo/devcontainer` image. This provides a consistent development environment across all platforms.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (version 20.10+)
- [Docker Compose](https://docs.docker.com/compose/) (v2+, included with Docker Desktop)
- [Git](https://git-scm.com/)
- Host machine with:
  - **Linux**: Kernel 5.10+, Docker group membership
  - **macOS**: Apple Silicon or Intel with Docker Desktop
  - **Windows**: Docker Desktop with WSL 2

## Docker Setup

### 1. Directory Structure

The `Dockerfile` and `docker-compose.yml` are already placed in `setup_and_run/`.

### 2. Build and Start

```bash
# From the project root
cd DukkanOS

# Build and start the development container
docker-compose up -d
```

This will:
- Create a container named `dukkanos-dev`
- Mount the current directory into `/workspace`
- Forward ports: 19000 (Expo dev server), 19001 (React Native), 19002 (Expo tools), 3000 (web)
- Start a bash shell inside the container

### 3. Access the Development Environment

```bash
# To enter the running container
docker exec -it dukkanos-dev bash

# Or, if you need to run commands directly
docker compose run --rm dukkanos-dev <command>
```

### 4. Inside the Container

Once inside the container, run:

```bash
# Install dependencies
npm install

# Start the Expo development server
npm run dev

# Or run on Android emulator
npm run android

# Or run on web
npm run web
```

## Docker Configuration

### `docker-compose.yml`

```yaml
version: '3.8'

services:
  dukkanos-dev:
    image: expo/devcontainer:expo-57
    container_name: dukkanos-dev
    restart: unless-stopped
    volumes:
      - .:/workspace
      - dukkanos-node-modules:/workspace/node_modules
      - dukkanos-.expo:/workspace/.expo
      - /tmp/.X11-unix:/tmp/.X11-unix  # Linux only for GUI
    environment:
      - NODE_ENV=development
      - CHOKIDAR_USEPOLLING=true
    ports:
      - "19000:19000"  # Expo dev server
      - "19001:19001"  # React Native
      - "19002:19002"  # Expo tools
      - "3000:3000"    # Web preview
    working_dir: /workspace
    tty: true

volumes:
  dukkanos-node-modules:
  dukkanos-.expo:
```

### `Dockerfile` (if customization is needed)

```dockerfile
FROM expo/devcontainer:expo-57

# Additional setup if needed
WORKDIR /workspace

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the source
COPY . .

# Expose ports
EXPOSE 19000 19001 19002 3000

# Default command
CMD ["npm", "run", "dev"]
```

## Using Docker with Android Emulator

To run the app inside an Android emulator within Docker:

### Option 1: Forward Android Debug Bridge (adb)

```bash
# On host machine, start adb server
adb start-server

# Forward ports from container to host
docker compose exec dukkanos-dev adb forward tcp:5555 tcp:5555

# Inside container, connect to emulator
# The emulator should be running inside the container or forwarded
```

### Option 2: Run Expo with Android inside container

The `expo/devcontainer` image includes Expo Go. To launch on Android:

```bash
# Inside the container
npm run android
```

This will launch the app on an connected Android device/emulator if available, or show a QR code.

### Option 3: Genymotion or Android Studio Emulator

1. Start your emulator on the host machine
2. Forward adb:
   ```bash
   adb connect 127.0.0.1:5554
   ```
3. Inside the Docker container:
   ```bash
   npm run android
   ```

## Common Docker Commands

| Action | Command |
|--------|---------|
| Start container | `docker compose up -d` |
| Stop container | `docker compose down` |
| Rebuild container | `docker compose up --build -d` |
| Enter container | `docker exec -it dukkanos-dev bash` |
| View logs | `docker compose logs -f dukkanos-dev` |
| Remove volume data | `docker compose down -v` |
| Reinstall dependencies | `docker exec dukkanos-dev rm -rf node_modules && docker exec dukkanos-dev npm install` |

## Troubleshooting Docker

### Issue: "Permission denied" connecting to Docker

```bash
# Add current user to Docker group
sudo usermod -aG docker $USER
# Log out and log back in, or run:
newgrp docker
```

### Issue: Port already in use

The development ports (19000, 19001, 19002) may already be in use. To resolve:

```bash
# Kill processes on those ports
lsof -i :19000
kill <PID>
# Or modify docker-compose.yml to use different ports
```

### Issue: Node modules not resolving inside container

```bash
# Delete and reinstall
docker exec dukkanos-dev rm -rf node_modules
docker exec dukkanos-dev npm install --legacy-peer-deps
```

### Issue: Android emulator not starting in Docker

Linux containers may have limited GPU access. To work around:

```bash
# Use GPU-accelerated emulator if available
# Or run the app on a physical device instead
# For physical device: scan QR code shown in container logs
```

### Issue: File changes not reflecting

Ensure volumes are mounted correctly and `CHOKIDAR_USEPOLLING=true` is set in the environment (already included in docker-compose.yml).

### Issue: Slow performance inside Docker

- Use host-mounted volumes for faster I/O
- Allocate more CPU/memory to Docker Desktop
- Consider running native Expo on host if Docker adds too much latency

## Benefits of Docker Development

✅ **Consistent environment** across all developer machines  
✅ **No "works on my machine" issues**  
✅ **Easy onboarding** for new team members  
✅ **Isolation** from host node_modules conflicts  
✅ **Portable** development setups  
✅ **Resource control** via Docker limits  

## When to Use Native vs Docker

| Use Case | Recommended |
|----------|-------------|
| Daily development on personal machine | Native (host) |
| New team member onboarding | Docker |
| CI/CD pipelines | Docker |
| Testing across multiple OS | Docker |
| Resource-intensive builds | Native |
| Quick local testing | Native |