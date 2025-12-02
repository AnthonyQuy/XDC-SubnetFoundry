import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * NetworkManager Ignition Deployment Module
 * 
 * This module deploys the NetworkManager contract using Hardhat Ignition.
 * The contract manages network nodes and their associated metadata for the XDC subnet.
 * 
 * Constructor automatically receives msg.sender as the contract owner (via Ownable).
 * 
 * Usage:
 *   npx hardhat ignition deploy ./ignition/modules/NetworkManager.ts --network subnet
 * 
 * Options:
 *   --verify              Verify contract on block explorer after deployment
 *   --reset               Start fresh deployment (ignore previous state)
 *   --deployment-id <id>  Use a specific deployment ID
 */
export default buildModule("NetworkManagerModule", (m) => {
  // Deploy the NetworkManager contract
  // The constructor receives msg.sender as owner automatically through Ownable(msg.sender)
  const networkManager = m.contract("NetworkManager", []);

  // Optional: You can add initial member registration here
  // Uncomment and modify if you want to add members during deployment
  // 
  // Example:
  // const owner = m.getAccount(0);
  // m.call(networkManager, "addMember", [
  //   "0x1234567890123456789012345678901234567890", // memberAddress
  //   "CN=Node1,O=XDC,L=Singapore,C=SG",            // x500Name
  //   "0x04...",                                     // publicKey (compressed or uncompressed)
  //   1n,                                            // serial
  //   1n,                                            // platformVersion
  //   "192.168.25.11",                              // host
  //   30303                                          // port
  // ]);

  return { networkManager };
});
