# Docker Deep Clean & Rebuild Guide

## Overview

The `run.sh` script now includes a **Deep Clean & Rebuild** option (Option 7) to resolve Docker-related issues, particularly ESM/TypeScript module loading errors.

## When to Use Deep Clean

Use this option when you encounter:

- ❌ `HH19: Your project is an ESM project` errors in Docker
- ❌ `Must use import to load ES Module` errors
- ❌ Dependency version mismatches between local and Docker
- ❌ Corrupted node_modules in Docker volume
- ❌ Changes to `package.json` not reflecting in Docker
- ❌ Mysterious compilation or runtime errors in Docker container

## What It Does

The deep clean process performs these steps automatically:

1. **Stops containers** - Shuts down the running xdc-contract-dev container
2. **Removes volumes** - Deletes the `xdc_node_modules` Docker volume
3. **Clears cache** - Purges Docker build cache for fresh builds
4. **Rebuilds image** - Rebuilds the container image from scratch
5. **Starts container** - Launches the newly built container
6. **Tests compilation** (optional) - Verifies the rebuild fixed issues

## How to Use

### Via run.sh Menu

```bash
cd contracts
./run.sh
# Select option: 7
```

### Manual Command (if needed)

```bash
cd contracts

# Stop containers
docker compose down

# Remove volume
docker volume rm xdc_node_modules

# Clear cache
docker builder prune -f

# Rebuild
docker compose build --no-cache
docker compose up -d

# Test
docker exec xdc-contract-dev npm run compile
```

## Expected Output

```
═══════════════════════════════════════
    Deep Clean & Rebuild Process
═══════════════════════════════════════
WARNING: This will:
  • Stop and remove the contract container
  • Delete the node_modules Docker volume
  • Clear Docker build cache
  • Rebuild container from scratch
  • Reinstall all npm dependencies

Are you sure you want to continue? (y/n): y

Step 1/5: Stopping containers...
Step 2/5: Removing node_modules volume...
✓ Volume removed
Step 3/5: Clearing Docker build cache...
✓ Cache cleared
Step 4/5: Rebuilding container...
[build output...]
Step 5/5: Starting container...
Waiting for container to initialize...

════════════════════════════════════
✓ Clean rebuild completed successfully!
════════════════════════════════════

Test compilation now? (y/n): y
Testing compilation...
Compiled 2 Solidity files successfully
```

## Time Estimate

The process typically takes:
- **2-5 minutes** on fast systems with good internet
- **5-10 minutes** on slower systems

## What Gets Deleted

✅ **Safe to delete:**
- Docker volumes (node_modules)
- Docker build cache
- Container instances

❌ **NOT deleted:**
- Your source code
- Compiled contracts (./compiled)
- Deployment data (./deployed)
- Configuration files
- Local node_modules (outside Docker)

## Troubleshooting

### "Volume doesn't exist" message
This is normal if you haven't run Docker before. The script continues safely.

### Build fails during Step 4
Check your internet connection and Docker daemon status. The error messages will indicate the specific issue.

### Container fails to start (Step 5)
Run `docker compose logs` to see detailed error messages.

### Still getting errors after clean rebuild
1. Check that your local `npm run compile` works
2. Verify Docker has enough resources (RAM, disk space)
3. Ensure no firewall blocking npm registry
4. Try updating Docker to the latest version

## Difference vs Regular Docker Commands

| Action | Regular Docker | Deep Clean |
|--------|---------------|------------|
| `docker compose down` | Stops containers only | + Removes volumes |
| `docker compose build` | Uses cache | Builds fresh (`--no-cache`) |
| `docker compose up` | Reuses volumes | Creates new volumes |
| Result | May keep stale deps | Fresh installation |

## Best Practices

1. **Before using deep clean:**
   - Commit your code changes
   - Save any work in the container

2. **After deep clean:**
   - Test compilation immediately
   - Verify your workflow works

3. **When to avoid:**
   - During active development (slow)
   - If local and Docker both work fine

## Related Commands

```bash
# Check Docker volume size
docker volume inspect xdc_node_modules

# View all Docker volumes
docker volume ls

# Check running containers
docker ps

# View container logs
docker logs xdc-contract-dev

# Interactive shell
docker exec -it xdc-contract-dev bash
```

## Support

If deep clean doesn't resolve your issue:

1. Check the [Hardhat ESM documentation](https://hardhat.org/hardhat-runner/docs/advanced/using-esm)
2. Verify your `tsconfig.json` settings
3. Review `package.json` for correct `"type": "module"` setting
4. Ensure Node.js version compatibility (22.x)

## See Also

- [Dockerfile](./Dockerfile) - Container build configuration
- [docker-compose.yml](./docker-compose.yml) - Container orchestration
- [package.json](./package.json) - Dependency definitions
- [tsconfig.json](./tsconfig.json) - TypeScript configuration
