# XDC Subnet Contracts

Smart contract development for XDC Subnet deployment, featuring the NetworkManager contract for decentralized node membership governance.

## Overview

This directory contains the smart contracts and deployment infrastructure for managing XDC subnet nodes. The primary contract, `NetworkManager`, provides on-chain governance for network membership using X.500 distinguished names and cryptographic identities.

## Features

- **NetworkManager Contract**: Manages network node membership with X.500 name format
- **Docker-based Development**: Isolated development environment with pre-configured XDC subnet connection
- **TypeScript Integration**: Full TypeScript support for deployment and interaction scripts
- **Hardhat 3**: Latest Hardhat framework with viem for Ethereum interactions
- **OpenZeppelin**: Secure, audited base contracts (Ownable, ReentrancyGuard)
- **Foundry-compatible Tests**: Solidity unit tests alongside TypeScript integration tests

## Prerequisites

- Docker and Docker Compose
- Node.js (v16 or higher)
- Access to an XDC subnet (pre-configured for 192.168.25.11:8545)

## Quick Start

### Option A: Using run.sh Script (Recommended)

The easiest way to manage the development environment:

```bash
cd contracts
./run.sh
```

This interactive menu provides options to:
- Compile contracts
- Deploy to XDC subnet
- Interact with deployed contracts
- Access container shell
- View logs
- Deep clean & rebuild (fix Docker issues)

### Option B: Manual Docker Setup

#### 1. Setup Environment

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration (private key, network settings, etc.).

#### 2. Build Docker Environment

```bash
docker-compose build
docker-compose up -d
```

#### 3. Access Container

```bash
docker exec -it xdc-contract-dev /bin/bash
```

#### 4. Install Dependencies

Inside the container:

```bash
npm install
```

## Development Workflow

### Compile Contracts

```bash
npm run compile
```

This compiles all Solidity contracts in the `contracts/` directory and generates artifacts in the `compiled/` directory.

### Run Tests

Execute all tests (both Solidity and TypeScript):

```bash
npm test
```

Run specific test suites:

```bash
npx hardhat test test/NetworkManager.test.ts
```

### Deploy to XDC Subnet

Deploy the NetworkManager contract:

```bash
npm run deploy
```

This will:
- Connect to the XDC subnet at the configured RPC URL
- Deploy the NetworkManager contract
- Save deployment information to `deployed/NetworkManager-{chainId}.json`

### Interact with Deployed Contract

Use the interaction script to test contract functions:

```bash
npm run interact
```

Or manually with Hardhat console:

```bash
npx hardhat console --network subnet
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run compile` | Compile all Solidity contracts |
| `npm run deploy` | Deploy NetworkManager to XDC subnet |
| `npm run interact` | Run interaction script with deployed contract |
| `npm test` | Run all tests (Solidity + TypeScript) |
| `npm run node` | Start a local Hardhat node |

## Project Structure

```
contracts/
├── contracts/              # Solidity source files
│   ├── NetworkManager.sol  # Main contract for node membership
│   ├── NetworkManager.t.sol # Solidity unit tests
│   └── Counter.sol         # Example contract
├── scripts/               # Deployment and interaction scripts
│   ├── deploy.ts          # Deployment script
│   └── hardhat-interact.ts # Contract interaction examples
├── test/                  # TypeScript integration tests
│   └── NetworkManager.test.ts
├── compiled/              # Compiled contract artifacts
├── deployed/              # Deployment records (address, ABI, etc.)
├── ignition/              # Hardhat Ignition modules
├── hardhat.config.ts      # Hardhat configuration
├── docker-compose.yml     # Docker environment setup
├── Dockerfile             # Container definition
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## NetworkManager Contract

The `NetworkManager` contract provides secure, on-chain management of network node membership with comprehensive node information storage.

### Key Features

- **X.500 Distinguished Names**: Store node identities using X.500 DN format
- **Comprehensive Node Data**: 10 fields per member including identity, network, and platform information
- **Membership Control**: Add, remove, and update node members
- **Status Management**: Activate/deactivate members without removing them
- **Access Control**: Owner-only administrative functions (OpenZeppelin Ownable)
- **Reentrancy Protection**: Uses OpenZeppelin ReentrancyGuard
- **Event Logging**: All state changes emit events for transparency
- **Efficient Storage**: O(1) lookups with array enumeration support

### NodeMember Structure

Each member stores the following information:

| Field | Type | Description |
|-------|------|-------------|
| `x500Name` | `string` | X.500 distinguished name (e.g., "CN=Node1, O=Org, C=US") |
| `memberAddress` | `address` | Ethereum address of the member |
| `publicKey` | `bytes` | Node's public key |
| `isActive` | `bool` | Active/inactive status |
| `joinedAt` | `uint256` | Timestamp when member joined |
| `lastUpdated` | `uint256` | Timestamp of last update |
| `serial` | `uint256` | Node serial number |
| `platformVersion` | `uint16` | Platform version number |
| `host` | `string` | Node hostname or IP address |
| `port` | `uint16` | Node port number |

### Core Functions

**Administrative Functions (Owner only):**
```solidity
addMember(address, string x500Name, bytes publicKey, uint256 serial, 
          uint16 platformVersion, string host, uint16 port)
removeMember(address)
updateMemberStatus(address, bool isActive)
updateMemberDetails(address, string x500Name, bytes publicKey, uint256 serial,
                    uint16 platformVersion, string host, uint16 port)
```

**Query Functions (Public):**
```solidity
getMember(address) returns (NodeMember)
getAllMembers() returns (address[])
isMember(address) returns (bool)
owner() returns (address)  // Inherited from Ownable
```

**Events:**
```solidity
event MemberAdded(address indexed memberAddress, string x500Name)
event MemberRemoved(address indexed memberAddress)
event MemberUpdated(address indexed memberAddress)
```

### Documentation

- **[API.md](./API.md)** - Complete API reference with detailed function signatures, examples, and best practices
- **[USAGE.md](./USAGE.md)** - Usage guide with setup and interaction instructions
- **[Test Suite](./test/NetworkManager.test.ts)** - Comprehensive TypeScript tests demonstrating all functionality

## Technology Stack

- **Hardhat 3**: Modern Ethereum development environment
- **TypeScript**: Type-safe scripting and testing
- **viem**: Lightweight, type-safe Ethereum library
- **OpenZeppelin Contracts**: Industry-standard secure smart contracts
- **Foundry**: Fast Solidity testing framework
- **Docker**: Containerized development environment

## Network Configuration

The project is pre-configured for XDC subnet deployment:

- **RPC URL**: http://192.168.25.11:8545
- **Chain ID**: 56316
- **Network**: docker_net (external Docker network)

To modify network settings, edit `hardhat.config.ts` and `.env`.

## Security Considerations

- **Private Keys**: Never commit private keys. Use `.env` files (gitignored)
- **Owner Role**: The contract deployer becomes the owner with full administrative rights
- **Access Control**: Consider multi-signature solutions for production deployments
- **Testing**: Always test thoroughly on testnet before mainnet deployment

## Troubleshooting

### ESM/TypeScript Module Errors in Docker

If you encounter `HH19: Your project is an ESM project` or `Must use import to load ES Module` errors:

**Quick Fix**: Use the deep clean option in `run.sh`:
```bash
./run.sh
# Select option 7: Deep clean & rebuild (fix Docker issues)
```

This automatically:
- Removes stale Docker volumes
- Clears build cache
- Rebuilds with fresh dependencies
- Syncs with your local working setup

See [CLEANUP-GUIDE.md](./CLEANUP-GUIDE.md) for detailed troubleshooting.

### Connection Issues

If you can't connect to the subnet:
```bash
# Check if subnet is running
docker ps | grep xdc

# Verify network connectivity
ping 192.168.25.11
```

### Compilation Errors

```bash
# Clear cache and recompile
npx hardhat clean
npm run compile
```

### Docker Volume Issues

If dependencies seem outdated or corrupted:
```bash
# Option 1: Use run.sh (recommended)
./run.sh  # Select option 7

# Option 2: Manual cleanup
docker-compose down -v
docker volume rm xdc_node_modules
docker builder prune -f
docker-compose build --no-cache
docker-compose up -d
```

## Additional Resources

- [CLEANUP-GUIDE.md](./CLEANUP-GUIDE.md) - Docker troubleshooting and deep clean guide
- [Hardhat Documentation](https://hardhat.org/docs)
- [Hardhat ESM Support](https://hardhat.org/hardhat-runner/docs/advanced/using-esm)
- [viem Documentation](https://viem.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [XDC Network](https://xdc.org/)

## License

MIT License - See [LICENSE](../LICENSE) file for details.
