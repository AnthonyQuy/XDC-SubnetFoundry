const Web3 = require('web3');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

/**
 * Interact with the NetworkManager contract
 * Usage: node interact.js [command] [params]
 * 
 * Commands:
 *  - getManager: Get the current manager address
 *  - addMember [address] [x500Name] [publicKey]: Add a new member
 *  - removeMember [address]: Remove a member
 *  - getMember [address]: Get member details
 *  - getAllMembers: List all member addresses
 *  - updateStatus [address] [isActive]: Update member status (true/false)
 *  - updateDetails [address] [x500Name] [publicKey]: Update member name and public key
 *  - transferManager [newManagerAddress]: Transfer manager role to new address
 *  - isMember [address]: Check if an address is a member
 *  - help: Display this help message
 */

// Check for arguments
const [, , command, ...args] = process.argv;

async function main() {
  try {
    // Connect to XDC subnet
    const subnetUrl = process.env.SUBNET_URL || 'http://192.168.25.11:8545';
    const web3 = new Web3(subnetUrl);

    // Find latest deployment file
    const deployedDir = path.resolve(__dirname, '../deployed');
    if (!fs.existsSync(deployedDir)) {
      console.error('Deployment directory not found! Deploy contract first.');
      process.exit(1);
    }

    const files = fs.readdirSync(deployedDir).filter(f => f.startsWith('NetworkManager-'));
    if (files.length === 0) {
      console.error('No deployed contract found! Deploy contract first.');
      process.exit(1);
    }

    // Sort by modified time (newest first)
    const sortedFiles = files.map(file => ({
      name: file,
      time: fs.statSync(path.join(deployedDir, file)).mtime.getTime()
    }))
      .sort((a, b) => b.time - a.time);

    const latestDeployment = path.join(deployedDir, sortedFiles[0].name);
    const deployment = JSON.parse(fs.readFileSync(latestDeployment, 'utf8'));

    // Create contract instance
    const networkManager = new web3.eth.Contract(deployment.abi, deployment.address);

    // Get private key for transactions
    const privateKey = process.env.SUBNET_PK;
    if (!privateKey) {
      console.error('Private key not found! Set SUBNET_PK environment variable.');
      process.exit(1);
    }

    // Set up account
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);

    // Process command
    switch (command) {
      case 'getManager':
        const manager = await networkManager.methods.manager().call();
        console.log(`Current manager: ${manager}`);
        break;

      case 'addMember':
        if (args.length < 3) {
          console.error('Usage: node interact.js addMember [address] [x500Name] [publicKey]');
          process.exit(1);
        }

        const [memberAddress, x500Name, publicKey] = args;

        const addTx = await networkManager.methods
          .addMember(memberAddress, x500Name, web3.utils.asciiToHex(publicKey))
          .send({
            from: account.address,
            gas: process.env.GAS_LIMIT || 500000,
            gasPrice: process.env.GAS_PRICE || web3.utils.toWei('1', 'gwei')
          });

        console.log(`Member added successfully`);
        break;

      case 'removeMember':
        if (args.length < 1) {
          console.error('Usage: node interact.js removeMember [address]');
          process.exit(1);
        }


        const removeTx = await networkManager.methods
          .removeMember(args[0])
          .send({
            from: account.address,
            gas: process.env.GAS_LIMIT || 500000,
            gasPrice: process.env.GAS_PRICE || web3.utils.toWei('1', 'gwei')
          });

        console.log(`Member removed successfully`);
        break;

      case 'getMember':
        if (args.length < 1) {
          console.error('Usage: node interact.js getMember [address]');
          process.exit(1);
        }

        const member = await networkManager.methods.getMember(args[0]).call();
        console.log('Member details:');
        console.log('  X500 Name:', member.x500Name);
        console.log('  Address:', member.nodeAddress);
        console.log('  Public Key:', web3.utils.hexToAscii(member.publicKey));
        console.log('  Active:', member.isActive);
        console.log('  Joined:', new Date(member.joinedAt * 1000).toLocaleString());
        console.log('  Last Updated:', new Date(member.lastUpdated * 1000).toLocaleString());
        break;

      case 'getAllMembers':
        const memberAddresses = await networkManager.methods.getAllMembers().call();
        console.log('All members:', memberAddresses);
        console.log(`Total member count: ${memberAddresses.length}`);
        break;

      case 'updateStatus':
        if (args.length < 2) {
          console.error('Usage: node interact.js updateStatus [address] [isActive]');
          process.exit(1);
        }

        const isActive = args[1].toLowerCase() === 'true';

        const statusTx = await networkManager.methods
          .updateMemberStatus(args[0], isActive)
          .send({
            from: account.address,
            gas: process.env.GAS_LIMIT || 500000,
            gasPrice: process.env.GAS_PRICE || web3.utils.toWei('1', 'gwei')
          });

        console.log(`Member status updated successfully`);
        break;

      case 'updateDetails':
        if (args.length < 3) {
          console.error('Usage: node interact.js updateDetails [address] [x500Name] [publicKey]');
          process.exit(1);
        }

        const [updateAddress, updateName, updateKey] = args;

        const updateTx = await networkManager.methods
          .updateMemberDetails(updateAddress, updateName, web3.utils.asciiToHex(updateKey))
          .send({
            from: account.address,
            gas: process.env.GAS_LIMIT || 500000,
            gasPrice: process.env.GAS_PRICE || web3.utils.toWei('1', 'gwei')
          });

        console.log(`Member details updated successfully`);
        break;

      case 'transferManager':
        if (args.length < 1) {
          console.error('Usage: node interact.js transferManager [newManagerAddress]');
          process.exit(1);
        }


        const transferTx = await networkManager.methods
          .transferManagerRole(args[0])
          .send({
            from: account.address,
            gas: process.env.GAS_LIMIT || 500000,
            gasPrice: process.env.GAS_PRICE || web3.utils.toWei('1', 'gwei')
          });

        console.log(`Manager role transferred successfully`);
        break;

      case 'isMember':
        if (args.length < 1) {
          console.error('Usage: node interact.js isMember [address]');
          process.exit(1);
        }

        const isMember = await networkManager.methods.isMember(args[0]).call();
        console.log(`Address ${args[0]} is${isMember ? '' : ' not'} a member.`);
        break;
      case 'updateSubnetMemberDetail':
        if (args.length < 5) {
          console.error('Usage: node interact.js updateSubnetDetails [address] [serial] [platformVersion] [host] [port]');
          process.exit(1);
        }

        const [subnetAddress, serial, platformVersion, host, port] = args;

        const subnetTx = await networkManager.methods
          .updateSubnetDetails(subnetAddress, serial, parseInt(platformVersion), host, parseInt(port))
          .send({
            from: account.address,
            gas: process.env.GAS_LIMIT || 500000,
            gasPrice: process.env.GAS_PRICE || web3.utils.toWei('1', 'gwei')
          });

        console.log(`Subnet details updated successfully`);
        break;
      case 'help':
      default:
        console.log('Available commands:');
        console.log('  getManager                            - Get the current manager address');
        console.log('  addMember [address] [x500Name] [publicKey] - Add a new member');
        console.log('  removeMember [address]                - Remove a member');
        console.log('  getMember [address]                   - Get member details');
        console.log('  getAllMembers                         - List all member addresses');
        console.log('  updateStatus [address] [isActive]     - Update member status (true/false)');
        console.log('  updateDetails [address] [x500Name] [publicKey] - Update member name and public key');
        console.log('  transferManager [newManagerAddress]   - Transfer manager role to new address');
        console.log('  isMember [address]                    - Check if an address is a member');
        console.log('  help                                  - Display this help message');
        break;
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Execute main function
main();
