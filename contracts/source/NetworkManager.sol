// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title NetworkManager
 * @dev Contract for managing network members with x500 name, address, and public key.
 *      One node acts as the manager with administrative privileges.
 */
contract NetworkManager {
    // Define the structure for a network member
    struct NodeMember {
        string x500Name; // X.500 distinguished name (e.g. "CN=Node1,O=XDC,C=SG")
        address nodeAddress; // Main address of the node
        bytes publicKey; // Public key for encryption/verification
        bool isActive; // Current status
        uint256 joinedAt; // Timestamp when added
        uint256 lastUpdated; // Last update timestamp
        // XDC - Contour subnet deployment
        uint256 serial; // Serial number
        uint16 platformVersion; // Platform version
        string host; // Host address
        uint16 port; // Port number
    }

    // State variables
    address public manager; // The manager address
    mapping(address => NodeMember) public members; // Map of member addresses to details
    address[] public memberAddresses; // List of all member addresses for enumeration
    uint256 public memberCount; // Total member count

    // Events
    event MemberAdded(address indexed nodeAddress, string x500Name);
    event MemberRemoved(address indexed nodeAddress);
    event MemberUpdated(address indexed nodeAddress);
    event ManagerChanged(
        address indexed oldManager,
        address indexed newManager
    );

    /**
     * @dev Constructor - sets deployer as manager
     */
    constructor() {
        manager = msg.sender;
    }

    /**
     * @dev Modifier to restrict functions to manager only
     */
    modifier onlyManager() {
        require(msg.sender == manager, "Only manager can call this function");
        _;
    }

    /**
     * @dev Modifier to check if member exists
     */
    modifier memberExists(address memberAddress) {
        require(
            members[memberAddress].nodeAddress != address(0),
            "Member does not exist"
        );
        _;
    }

    /**
     * @dev Modifier to check if member does not exist
     */
    modifier memberDoesNotExist(address memberAddress) {
        require(
            members[memberAddress].nodeAddress == address(0),
            "Member already exists"
        );
        _;
    }

    /**
     * @dev Add a new member to the network
     * @param memberAddress The address of the member to add
     * @param x500Name The X.500 distinguished name of the member
     * @param publicKey The public key of the member
     */
    function addMember(
        address memberAddress,
        string calldata x500Name,
        bytes calldata publicKey,
        uint256 serial,
        uint16 platformVersion,
        string calldata host,
        uint16 port
    ) external onlyManager memberDoesNotExist(memberAddress) {
        // Create new member
        NodeMember memory newMember = NodeMember({
            x500Name: x500Name,
            nodeAddress: memberAddress,
            publicKey: publicKey,
            isActive: true,
            joinedAt: block.timestamp,
            lastUpdated: block.timestamp,
            serial: serial,
            platformVersion: platformVersion,
            host: host,
            port: port
        });

        // Store member data
        members[memberAddress] = newMember;
        memberAddresses.push(memberAddress);
        memberCount++;

        // Emit event
        emit MemberAdded(memberAddress, x500Name);
    }

    /**
     * @dev Remove a member from the network
     * @param memberAddress The address of the member to remove
     */
    function removeMember(
        address memberAddress
    ) external onlyManager memberExists(memberAddress) {
        // Find index of member in the array
        uint256 index;
        bool found = false;
        for (uint256 i = 0; i < memberAddresses.length; i++) {
            if (memberAddresses[i] == memberAddress) {
                index = i;
                found = true;
                break;
            }
        }

        if (found) {
            // Move the last element to the position of the removed element
            memberAddresses[index] = memberAddresses[
                memberAddresses.length - 1
            ];
            // Remove the last element
            memberAddresses.pop();
            // Delete from mapping
            delete members[memberAddress];
            memberCount--;

            // Emit event
            emit MemberRemoved(memberAddress);
        }
    }

    /**
     * @dev Update member status (active/inactive)
     * @param memberAddress The address of the member to update
     * @param isActive New active status
     */
    function updateMemberStatus(
        address memberAddress,
        bool isActive
    ) external onlyManager memberExists(memberAddress) {
        members[memberAddress].isActive = isActive;
        members[memberAddress].lastUpdated = block.timestamp;

        emit MemberUpdated(memberAddress);
    }

    /**
     * @dev Update member details
     * @param memberAddress The address of the member to update
     * @param x500Name New X.500 name
     * @param publicKey New public key
     */
    function updateMemberDetails(
        address memberAddress,
        string calldata x500Name,
        bytes calldata publicKey,
        uint256 serial,
        uint16 platformVersion,
        string calldata host,
        uint16 port
    ) external onlyManager memberExists(memberAddress) {
        members[memberAddress].x500Name = x500Name;
        members[memberAddress].publicKey = publicKey;
        members[memberAddress].serial = serial;
        members[memberAddress].platformVersion = platformVersion;
        members[memberAddress].host = host;
        members[memberAddress].port = port;
        members[memberAddress].lastUpdated = block.timestamp;

        emit MemberUpdated(memberAddress);
    }

    /**
     * @dev Transfer manager role to a new address
     * @param newManager The address of the new manager
     */
    function transferManagerRole(address newManager) external onlyManager {
        require(newManager != address(0), "Invalid manager address");

        address oldManager = manager;
        manager = newManager;

        emit ManagerChanged(oldManager, newManager);
    }

    /**
     * @dev Get all details about a specific member
     * @param memberAddress The address of the member
     * @return NodeMember The member details
     */
    function getMember(
        address memberAddress
    ) external view memberExists(memberAddress) returns (NodeMember memory) {
        return members[memberAddress];
    }

    /**
     * @dev Get all member addresses
     * @return address[] All member addresses
     */
    function getAllMembers() external view returns (address[] memory) {
        return memberAddresses;
    }

    /**
     * @dev Check if an address is a member
     * @param memberAddress The address to check
     * @return bool True if the address is a member
     */
    function isMember(address memberAddress) external view returns (bool) {
        return members[memberAddress].nodeAddress != address(0);
    }

    /**
     * @dev Update only the subnet-specific details for a member
     * @param memberAddress The address of the member to update
     * @param serial New serial number
     * @param platformVersion New platform version
     * @param host New host address
     * @param port New port number
     */
    function updateSubnetMemberDetail(
        address memberAddress,
        uint256 serial,
        uint16 platformVersion,
        string calldata host,
        uint16 port
    ) external onlyManager memberExists(memberAddress) {
        members[memberAddress].serial = serial;
        members[memberAddress].platformVersion = platformVersion;
        members[memberAddress].host = host;
        members[memberAddress].port = port;
        members[memberAddress].lastUpdated = block.timestamp;

        emit MemberUpdated(memberAddress);
    }
}
