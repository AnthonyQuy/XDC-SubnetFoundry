# NetworkManager Contract API Reference

Complete API documentation for the NetworkManager smart contract.

## Table of Contents

- [Contract Overview](#contract-overview)
- [Data Structures](#data-structures)
- [State Variables](#state-variables)
- [Modifiers](#modifiers)
- [Functions](#functions)
  - [Administrative Functions](#administrative-functions)
  - [Query Functions](#query-functions)
- [Events](#events)
- [Usage Examples](#usage-examples)

## Contract Overview

**Contract Name:** `NetworkManager`  
**Solidity Version:** `0.8.28`  
**License:** MIT  
**Inherits:** `Ownable`, `ReentrancyGuard`

The NetworkManager contract provides on-chain governance for network node membership, storing comprehensive node information including X.500 distinguished names, cryptographic keys, and network connectivity details.

### Key Features

- **Access Control:** Uses OpenZeppelin's Ownable pattern - only the contract owner can perform administrative operations
- **Reentrancy Protection:** Inherits ReentrancyGuard for secure state changes
- **Comprehensive Node Data:** Stores 10 fields per member including identity, network, and platform information
- **Event-Driven:** All state changes emit events for transparency and off-chain monitoring
- **Efficient Storage:** Uses mappings for O(1) lookups and an array for enumeration

## Data Structures

### NodeMember Struct

Complete node member information stored on-chain:

```solidity
struct NodeMember {
    string x500Name;           // X.500 distinguished name (e.g., "CN=Node1, O=Org, L=City, C=US")
    address memberAddress;     // Ethereum address of the member
    bytes publicKey;           // Node's public key (variable length)
    bool isActive;             // Active/inactive status flag
    uint256 joinedAt;          // Unix timestamp when member was added
    uint256 lastUpdated;       // Unix timestamp of last update
    uint256 serial;            // Node serial number/identifier
    uint16 platformVersion;    // Node platform version number
    string host;               // Node hostname or IP address
    uint16 port;               // Node port number
}
```

**Field Details:**

| Field | Type | Description |
|-------|------|-------------|
| `x500Name` | `string` | X.500 distinguished name following the format "CN=Common Name, O=Organization, L=Location, C=Country" |
| `memberAddress` | `address` | Unique Ethereum address identifying the member |
| `publicKey` | `bytes` | Node's public key in bytes format (length varies by key type) |
| `isActive` | `bool` | Status flag: `true` = active, `false` = inactive (but not removed) |
| `joinedAt` | `uint256` | Block timestamp when member was first added (immutable) |
| `lastUpdated` | `uint256` | Block timestamp of the most recent update to member data |
| `serial` | `uint256` | Node serial number or unique identifier |
| `platformVersion` | `uint16` | Platform/software version number (0-65535) |
| `host` | `string` | Network hostname, domain, or IP address where node is reachable |
| `port` | `uint16` | Network port number (0-65535) |

## State Variables

### Private Storage

```solidity
mapping(address => NodeMember) private members;
mapping(address => uint256) private memberIndex;
address[] private memberAddresses;
```

**Storage Layout:**

- `members`: Maps member addresses to their complete NodeMember data
- `memberIndex`: Maps member addresses to their position in the memberAddresses array
- `memberAddresses`: Array of all member addresses for enumeration

**Gas Optimization Note:** The dual mapping + array structure allows:
- O(1) member lookups via `members` mapping
- O(1) member existence checks
- O(1) member removal with array swap-and-pop
- Enumeration of all members via `memberAddresses` array

## Modifiers

### memberExists

```solidity
modifier memberExists(address memberAddress)
```

**Purpose:** Ensures a member exists before allowing function execution.

**Reverts with:** `"Member does not exist"`

**Used by:** `removeMember`, `updateMemberStatus`, `updateMemberDetails`, `getMember`

### memberDoesNotExist

```solidity
modifier memberDoesNotExist(address memberAddress)
```

**Purpose:** Ensures a member doesn't already exist before allowing function execution.

**Reverts with:** `"Member already exists"`

**Used by:** `addMember`

## Functions

### Administrative Functions

All administrative functions require the caller to be the contract owner.

---

#### addMember

```solidity
function addMember(
    address memberAddress,
    string calldata x500Name,
    bytes calldata publicKey,
    uint256 serial,
    uint16 platformVersion,
    string calldata host,
    uint16 port
) external onlyOwner memberDoesNotExist(memberAddress)
```

**Description:** Adds a new member to the network with complete node information.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `memberAddress` | `address` | Ethereum address of the new member (must not already exist) |
| `x500Name` | `string` | X.500 distinguished name |
| `publicKey` | `bytes` | Node's public key |
| `serial` | `uint256` | Node serial number |
| `platformVersion` | `uint16` | Platform version |
| `host` | `string` | Node hostname or IP |
| `port` | `uint16` | Node port number |

**Effects:**
- Creates new NodeMember with provided data
- Sets `isActive` to `true`
- Sets `joinedAt` and `lastUpdated` to current block timestamp
- Adds address to `memberAddresses` array
- Emits `MemberAdded` event

**Requirements:**
- Caller must be contract owner
- Member address must not already exist

**Gas Cost:** ~150,000-200,000 gas (varies with data length)

**Example:**
```typescript
await networkManager.write.addMember([
  '0x1234567890123456789012345678901234567890',
  'CN=Node1, O=MyOrg, L=Singapore, C=SG',
  '0xabcdef...',  // public key bytes
  1001n,
  1,
  'node1.example.com',
  30303
]);
```

---

#### removeMember

```solidity
function removeMember(
    address memberAddress
) external onlyOwner memberExists(memberAddress)
```

**Description:** Permanently removes a member from the network.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `memberAddress` | `address` | Ethereum address of the member to remove |

**Effects:**
- Removes member from `members` mapping
- Removes member from `memberIndex` mapping
- Removes address from `memberAddresses` array (swap with last element)
- Emits `MemberRemoved` event

**Requirements:**
- Caller must be contract owner
- Member must exist

**Gas Cost:** ~30,000-50,000 gas

**Implementation Note:** Uses swap-and-pop for efficient array removal - last element is moved to the removed member's position.

**Example:**
```typescript
await networkManager.write.removeMember([
  '0x1234567890123456789012345678901234567890'
]);
```

---

#### updateMemberStatus

```solidity
function updateMemberStatus(
    address memberAddress,
    bool isActive
) external onlyOwner memberExists(memberAddress)
```

**Description:** Updates a member's active/inactive status without removing them.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `memberAddress` | `address` | Ethereum address of the member |
| `isActive` | `bool` | New status: `true` for active, `false` for inactive |

**Effects:**
- Updates member's `isActive` field
- Updates `lastUpdated` timestamp
- Emits `MemberUpdated` event

**Requirements:**
- Caller must be contract owner
- Member must exist

**Gas Cost:** ~30,000-40,000 gas

**Use Case:** Temporarily deactivate members without losing their data or permanently removing them.

**Example:**
```typescript
// Deactivate a member
await networkManager.write.updateMemberStatus([
  '0x1234567890123456789012345678901234567890',
  false
]);

// Reactivate a member
await networkManager.write.updateMemberStatus([
  '0x1234567890123456789012345678901234567890',
  true
]);
```

---

#### updateMemberDetails

```solidity
function updateMemberDetails(
    address memberAddress,
    string calldata x500Name,
    bytes calldata publicKey,
    uint256 serial,
    uint16 platformVersion,
    string calldata host,
    uint16 port
) external onlyOwner memberExists(memberAddress)
```

**Description:** Updates all mutable fields of an existing member.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `memberAddress` | `address` | Ethereum address of the member |
| `x500Name` | `string` | New X.500 distinguished name |
| `publicKey` | `bytes` | New public key |
| `serial` | `uint256` | New serial number |
| `platformVersion` | `uint16` | New platform version |
| `host` | `string` | New hostname or IP |
| `port` | `uint16` | New port number |

**Effects:**
- Updates all member fields except `memberAddress`, `joinedAt`, and `isActive`
- Updates `lastUpdated` timestamp
- Emits `MemberUpdated` event

**Requirements:**
- Caller must be contract owner
- Member must exist

**Gas Cost:** ~50,000-100,000 gas (varies with data length)

**Immutable Fields:** `memberAddress` (cannot be changed), `joinedAt` (set at creation), `isActive` (use `updateMemberStatus`)

**Example:**
```typescript
await networkManager.write.updateMemberDetails([
  '0x1234567890123456789012345678901234567890',
  'CN=NodeUpdated, O=NewOrg, L=Singapore, C=SG',
  '0xnewpublickey...',
  2002n,
  2,
  'updated.example.com',
  30304
]);
```

---

### Query Functions

All query functions are public view functions - they don't modify state and don't require ownership.

---

#### getMember

```solidity
function getMember(
    address memberAddress
) external view memberExists(memberAddress) returns (NodeMember memory)
```

**Description:** Retrieves complete information for a specific member.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `memberAddress` | `address` | Ethereum address of the member |

**Returns:** Complete `NodeMember` struct

**Requirements:**
- Member must exist (reverts with "Member does not exist" otherwise)

**Gas Cost:** ~5,000-10,000 gas (view function)

**Example:**
```typescript
const member = await networkManager.read.getMember([
  '0x1234567890123456789012345678901234567890'
]);

console.log('X500 Name:', member.x500Name);
console.log('Is Active:', member.isActive);
console.log('Host:', member.host);
console.log('Port:', member.port);
```

---

#### getAllMembers

```solidity
function getAllMembers() external view returns (address[] memory)
```

**Description:** Returns an array of all member addresses.

**Parameters:** None

**Returns:** Array of member addresses

**Gas Cost:** ~5,000 + (700 × number of members) gas (view function)

**Use Cases:**
- Enumerate all members
- Get member count via array length
- Iterate through members to get full details

**Example:**
```typescript
const memberAddresses = await networkManager.read.getAllMembers();
console.log(`Total members: ${memberAddresses.length}`);

// Get details for each member
for (const address of memberAddresses) {
  const member = await networkManager.read.getMember([address]);
  console.log(`${member.x500Name} - Active: ${member.isActive}`);
}
```

---

#### isMember

```solidity
function isMember(
    address memberAddress
) external view returns (bool)
```

**Description:** Checks if an address is a registered member.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `memberAddress` | `address` | Address to check |

**Returns:** `true` if address is a member, `false` otherwise

**Gas Cost:** ~2,000-3,000 gas (view function)

**Use Cases:**
- Quick membership verification
- Access control checks in external contracts
- Pre-validation before calling other functions

**Example:**
```typescript
const isRegistered = await networkManager.read.isMember([
  '0x1234567890123456789012345678901234567890'
]);

if (isRegistered) {
  console.log('Address is a registered member');
} else {
  console.log('Address is not a member');
}
```

---

#### owner

```solidity
function owner() public view virtual returns (address)
```

**Description:** Returns the current contract owner address (inherited from Ownable).

**Parameters:** None

**Returns:** Owner's address

**Gas Cost:** ~2,000 gas (view function)

**Example:**
```typescript
const ownerAddress = await networkManager.read.owner();
console.log('Contract owner:', ownerAddress);
```

---

## Events

### MemberAdded

```solidity
event MemberAdded(address indexed memberAddress, string x500Name)
```

**Description:** Emitted when a new member is added to the network.

**Parameters:**

| Parameter | Type | Indexed | Description |
|-----------|------|---------|-------------|
| `memberAddress` | `address` | Yes | Address of the newly added member |
| `x500Name` | `string` | No | X.500 distinguished name of the member |

**Emitted by:** `addMember()`

**Example Usage:**
```typescript
// Listen for new members
const events = await publicClient.getContractEvents({
  address: contractAddress,
  abi: contractAbi,
  eventName: 'MemberAdded',
  fromBlock: 'latest'
});

for (const event of events) {
  console.log(`New member: ${event.args.x500Name} at ${event.args.memberAddress}`);
}
```

---

### MemberRemoved

```solidity
event MemberRemoved(address indexed memberAddress)
```

**Description:** Emitted when a member is removed from the network.

**Parameters:**

| Parameter | Type | Indexed | Description |
|-----------|------|---------|-------------|
| `memberAddress` | `address` | Yes | Address of the removed member |

**Emitted by:** `removeMember()`

---

### MemberUpdated

```solidity
event MemberUpdated(address indexed memberAddress)
```

**Description:** Emitted when a member's information is updated.

**Parameters:**

| Parameter | Type | Indexed | Description |
|-----------|------|---------|-------------|
| `memberAddress` | `address` | Yes | Address of the updated member |

**Emitted by:** `updateMemberStatus()`, `updateMemberDetails()`

**Note:** This event is emitted for both status updates and detail updates. To determine what changed, you need to query the member's current state or track previous states off-chain.

---

## Usage Examples

### Complete Workflow Example

```typescript
import { createPublicClient, createWalletClient, http, getContract } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { toHex } from 'viem';

// Setup clients
const publicClient = createPublicClient({
  transport: http('http://192.168.25.11:8545')
});

const account = privateKeyToAccount('0xYourPrivateKey');
const walletClient = createWalletClient({
  account,
  transport: http('http://192.168.25.11:8545')
});

const networkManager = getContract({
  address: '0xYourContractAddress',
  abi: contractAbi,
  client: { public: publicClient, wallet: walletClient }
});

// 1. Add a new member
console.log('Adding member...');
const addHash = await networkManager.write.addMember([
  '0x1234567890123456789012345678901234567890',
  'CN=Node1, O=MyOrg, L=Singapore, C=SG',
  toHex('publicKey123'),
  1001n,
  1,
  'node1.example.com',
  30303
]);
await publicClient.waitForTransactionReceipt({ hash: addHash });

// 2. Verify member was added
const isMember = await networkManager.read.isMember([
  '0x1234567890123456789012345678901234567890'
]);
console.log('Is member:', isMember); // true

// 3. Get member details
const member = await networkManager.read.getMember([
  '0x1234567890123456789012345678901234567890'
]);
console.log('Member details:', {
  name: member.x500Name,
  active: member.isActive,
  host: member.host,
  port: member.port
});

// 4. Update member status
console.log('Deactivating member...');
const statusHash = await networkManager.write.updateMemberStatus([
  '0x1234567890123456789012345678901234567890',
  false
]);
await publicClient.waitForTransactionReceipt({ hash: statusHash });

// 5. List all members
const allMembers = await networkManager.read.getAllMembers();
console.log(`Total members: ${allMembers.length}`);

// 6. Remove member
console.log('Removing member...');
const removeHash = await networkManager.write.removeMember([
  '0x1234567890123456789012345678901234567890'
]);
await publicClient.waitForTransactionReceipt({ hash: removeHash });
```

### Bulk Operations

```typescript
// Add multiple members
const members = [
  {
    address: '0x1111111111111111111111111111111111111111',
    x500Name: 'CN=Node1, O=Org, C=US',
    publicKey: toHex('key1'),
    serial: 1001n,
    platformVersion: 1,
    host: 'node1.example.com',
    port: 30303
  },
  {
    address: '0x2222222222222222222222222222222222222222',
    x500Name: 'CN=Node2, O=Org, C=US',
    publicKey: toHex('key2'),
    serial: 1002n,
    platformVersion: 1,
    host: 'node2.example.com',
    port: 30304
  }
];

for (const member of members) {
  const hash = await networkManager.write.addMember([
    member.address,
    member.x500Name,
    member.publicKey,
    member.serial,
    member.platformVersion,
    member.host,
    member.port
  ]);
  await publicClient.waitForTransactionReceipt({ hash });
  console.log(`Added ${member.x500Name}`);
}
```

### Event Monitoring

```typescript
// Monitor all contract events
publicClient.watchContractEvent({
  address: contractAddress,
  abi: contractAbi,
  onLogs: (logs) => {
    for (const log of logs) {
      if (log.eventName === 'MemberAdded') {
        console.log(`Member added: ${log.args.x500Name}`);
      } else if (log.eventName === 'MemberRemoved') {
        console.log(`Member removed: ${log.args.memberAddress}`);
      } else if (log.eventName === 'MemberUpdated') {
        console.log(`Member updated: ${log.args.memberAddress}`);
      }
    }
  }
});
```

## Best Practices

### Security

1. **Owner Key Management:** Store owner private key in secure hardware wallet or HSM
2. **Multi-sig Consideration:** Use Gnosis Safe or similar for production deployments
3. **Access Control:** Verify owner before performing administrative operations
4. **Event Monitoring:** Monitor events for unauthorized changes

### Gas Optimization

1. **Batch Operations:** If adding multiple members, consider batching in a single transaction
2. **Data Length:** Keep x500Name and host strings reasonably short
3. **Public Key Size:** Use compressed keys when possible (33 bytes vs 65 bytes)

### Integration

1. **Error Handling:** Always check for transaction success
2. **State Verification:** Query state after writes to confirm changes
3. **Event Indexing:** Use indexed parameters for efficient event filtering
4. **Pagination:** For large member lists, implement pagination off-chain

## Additional Resources

- [OpenZeppelin Ownable Documentation](https://docs.openzeppelin.com/contracts/4.x/api/access#Ownable)
- [OpenZeppelin ReentrancyGuard Documentation](https://docs.openzeppelin.com/contracts/4.x/api/security#ReentrancyGuard)
- [Viem Documentation](https://viem.sh/)
- [X.500 Distinguished Names](https://en.wikipedia.org/wiki/X.500)
