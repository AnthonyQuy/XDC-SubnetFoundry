# Network Management Contract Usage Guide

This guide explains how to build, deploy, and interact with the NetworkManager contract using Docker and the XDC Subnet environment.

## Contract Overview

The `NetworkManager` contract provides a system for managing network node membership with X.500 distinguished names, storing comprehensive node information:

**NodeMember Structure:**
- `x500Name` - X.500 distinguished name (e.g., "CN=Node1, O=Org, L=City, C=US")
- `memberAddress` - Ethereum address of the member
- `publicKey` - Node's public key (bytes)
- `isActive` - Active/inactive status
- `joinedAt` - Timestamp when member joined
- `lastUpdated` - Timestamp of last update
- `serial` - Node serial number
- `platformVersion` - Node platform version
- `host` - Node hostname/IP address
- `port` - Node port number

The contract uses OpenZeppelin's Ownable pattern, where the contract owner has administrative privileges to add, remove, and update members.

## Setup Instructions

### Prerequisites

- Docker and Docker Compose installed
- Access to an XDC subnet (the environment is pre-configured for subnet1)
- Basic knowledge of Solidity and blockchain concepts

### Building the Environment

1. Navigate to the contracts directory:
   ```
   cd contracts
   ```

2. Build the Docker container:
   ```
   docker-compose build
   ```

3. Start the container:
   ```
   docker-compose up -d
   ```

## Contract Development Workflow

### Compiling the Contract

1. Access the container shell:
   ```bash
   docker exec -it xdc-contract-dev /bin/bash
   ```

2. Compile the contract:
   ```bash
   npm run compile
   ```

   This compiles the `NetworkManager.sol` contract in the `contracts` directory and places the compiled artifacts in the `compiled` directory.

### Deploying the Contract

1. From inside the container, deploy the contract:
   ```
   npm run deploy
   ```

   This will:
   - Connect to the XDC subnet at http://192.168.25.11:8545
   - Deploy the NetworkManager contract
   - Save deployment information to the `deployed` directory

## Interacting with the Contract

The project uses **Viem** for blockchain interactions (not Web3.js or Ethers.js). There are two main ways to interact with the deployed contract:

### Option A: Using the Interaction Script (Recommended)

The project includes a comprehensive interaction script at `scripts/hardhat-interact.ts`. Use environment variables to specify the command and arguments:

```bash
# Get all members
COMMAND=getAllMembers npm run interact

# Get member details
COMMAND=getMember ARGS=0xYourMemberAddress npm run interact

# Add a new member (use | to separate arguments)
COMMAND=addMember ARGS=0xAddress|CN=Node2,O=XDC,C=SG|publicKey123|1001|1|node2.example.com|30303 npm run interact

# Update member status
COMMAND=updateStatus ARGS=0xAddress|false npm run interact

# Remove a member
COMMAND=removeMember ARGS=0xAddress npm run interact

# Check if address is a member
COMMAND=isMember ARGS=0xAddress npm run interact

# Get current owner/manager
COMMAND=getManager npm run interact

# Transfer ownership
COMMAND=transferManager ARGS=0xNewOwnerAddress npm run interact
```

**Available Commands:**
- `getManager` - Get the current contract owner
- `addMember` - Add a new member (requires 7 args: address|x500Name|publicKey|serial|platformVersion|host|port)
- `removeMember` - Remove a member (requires 1 arg: address)
- `getMember` - Get member details (requires 1 arg: address)
- `getAllMembers` - List all member addresses (no args)
- `updateStatus` - Update member status (requires 2 args: address|true/false)
- `updateDetails` - Update member details (requires 7 args: address|x500Name|publicKey|serial|platformVersion|host|port)
- `transferManager` - Transfer ownership (requires 1 arg: newOwnerAddress)
- `isMember` - Check membership (requires 1 arg: address)
- `updateSubnetMemberDetail` - Update subnet-specific details (requires 5 args: address|serial|platformVersion|host|port)
- `help` - Display help message

### Option B: Using Viem Directly

```typescript
import { createPublicClient, createWalletClient, http, getContract } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { toHex } from 'viem';

// Connect to the XDC subnet
const rpcUrl = 'http://192.168.25.11:8545';
const privateKey = '0xYourPrivateKey';

const publicClient = createPublicClient({
  transport: http(rpcUrl)
});

const account = privateKeyToAccount(privateKey as `0x${string}`);
const walletClient = createWalletClient({
  account,
  transport: http(rpcUrl)
});

// Load contract (deployment info from ignition/deployments)
const networkManager = getContract({
  address: '0xYourContractAddress' as `0x${string}`,
  abi: yourContractAbi,
  client: { public: publicClient, wallet: walletClient }
});

// Example: Add a new member
const addHash = await networkManager.write.addMember([
  '0xMemberAddress' as `0x${string}`,
  'CN=Node2, O=XDC, C=SG',
  toHex('publicKey123'),
  BigInt(1001),      // serial
  1,                  // platformVersion
  'node2.example.com', // host
  30303               // port
]);
await publicClient.waitForTransactionReceipt({ hash: addHash });

// Example: Get member details
const member = await networkManager.read.getMember(['0xMemberAddress' as `0x${string}`]);
console.log('Member:', member);

// Example: List all members
const members = await networkManager.read.getAllMembers();
console.log('All members:', members);

// Example: Update member status
const statusHash = await networkManager.write.updateMemberStatus([
  '0xMemberAddress' as `0x${string}`,
  false // set inactive
]);
await publicClient.waitForTransactionReceipt({ hash: statusHash });
```

## Available Contract Functions

### Administrative Functions (Owner Only)

All write operations require the caller to be the contract owner (uses OpenZeppelin's Ownable).

- `addMember(address memberAddress, string x500Name, bytes publicKey, uint256 serial, uint16 platformVersion, string host, uint16 port)` - Add a new member with complete node information
- `removeMember(address memberAddress)` - Remove a member from the network
- `updateMemberStatus(address memberAddress, bool isActive)` - Change member active/inactive status
- `updateMemberDetails(address memberAddress, string x500Name, bytes publicKey, uint256 serial, uint16 platformVersion, string host, uint16 port)` - Update all member information
- `transferOwnership(address newOwner)` - Transfer contract ownership (inherited from Ownable)

### Read Functions (Public)

Anyone can call these view functions:

- `getMember(address memberAddress)` - Returns complete NodeMember struct for a given address
- `getAllMembers()` - Returns array of all member addresses
- `isMember(address memberAddress)` - Returns true if address is a registered member
- `owner()` - Returns current contract owner address (inherited from Ownable)

**Note:** To get member count, use `getAllMembers().length` in your code.

## Common Usage Patterns

### 1. Adding Multiple Members

```bash
# Add first member
COMMAND=addMember ARGS=0xMember1Address|CN=Node1,O=Org,C=US|pubkey1|1001|1|node1.example.com|30303 npm run interact

# Add second member
COMMAND=addMember ARGS=0xMember2Address|CN=Node2,O=Org,C=US|pubkey2|1002|1|node2.example.com|30304 npm run interact

# Verify all members were added
COMMAND=getAllMembers npm run interact
```

### 2. Updating Node Information

```bash
# Update only status (active/inactive)
COMMAND=updateStatus ARGS=0xMemberAddress|false npm run interact

# Update complete member details
COMMAND=updateDetails ARGS=0xMemberAddress|CN=NodeUpdated,O=NewOrg,C=US|newPubkey|2001|2|updated.example.com|30305 npm run interact

# Update only subnet-specific details (keeps X500 name and public key)
COMMAND=updateSubnetMemberDetail ARGS=0xMemberAddress|2001|2|updated.example.com|30305 npm run interact
```

### 3. Member Lifecycle Management

```bash
# Check if address is a member
COMMAND=isMember ARGS=0xMemberAddress npm run interact

# Get detailed member information
COMMAND=getMember ARGS=0xMemberAddress npm run interact

# Deactivate member (keeps in system but marks inactive)
COMMAND=updateStatus ARGS=0xMemberAddress|false npm run interact

# Remove member completely
COMMAND=removeMember ARGS=0xMemberAddress npm run interact
```

## Security Considerations

- The contract owner has full control over network membership
- Owner private key must be kept secure - loss means loss of administrative control
- Consider using a multi-signature wallet as the contract owner for production
- The contract uses OpenZeppelin's ReentrancyGuard to prevent reentrancy attacks
- All state-changing functions emit events for transparency and monitoring
- Consider implementing a time-lock contract for sensitive operations in production

## Troubleshooting

### Connection Issues
- Ensure the XDC subnet is running: `docker ps | grep xdc`
- Verify network accessibility: `ping 192.168.25.11`
- Check RPC URL in `.env` file matches your subnet configuration

### Permission Errors
- Only the contract owner can call administrative functions
- Use `COMMAND=getManager` to verify current owner address
- Ensure you're using the correct private key in `.env`

### Transaction Failures
- Check account has sufficient XDC for gas fees
- Verify member address format (must start with 0x)
- Ensure member doesn't already exist when adding
- Ensure member exists when updating/removing

### Contract Interaction Errors
```bash
# If you get "member does not exist" error
COMMAND=getAllMembers npm run interact  # Check current members

# If you get deployment not found error
npm run deploy  # Redeploy the contract

# View interaction script help
COMMAND=help npm run interact
```

### TypeScript/ESM Errors in Docker
See [CLEANUP-GUIDE.md](./CLEANUP-GUIDE.md) for comprehensive Docker troubleshooting.

## Additional Resources

- [README.md](./README.md) - Main project documentation
- [CLEANUP-GUIDE.md](./CLEANUP-GUIDE.md) - Docker troubleshooting guide
- [Hardhat Documentation](https://hardhat.org/docs)
- [Viem Documentation](https://viem.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
