// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NetworkManager is Ownable, ReentrancyGuard {
    constructor() Ownable(msg.sender) {}

    struct NodeMember {
        string x500Name; 
        address memberAddress; 
        bytes publicKey; 
        bool isActive; 
        uint256 joinedAt; 
        uint256 lastUpdated; 
        uint256 serial; 
        uint16 platformVersion; 
        string host; 
        uint16 port; 
    }

    mapping(address => NodeMember) private members;
    mapping(address => uint256) private memberIndex;
    address[] private memberAddresses;

    event MemberAdded(address indexed memberAddress, string x500Name);
    event MemberRemoved(address indexed memberAddress);
    event MemberUpdated(address indexed memberAddress);

    modifier memberExists(address memberAddress) {
        require(members[memberAddress].memberAddress != address(0), "Member does not exist");
        _;
    }

    modifier memberDoesNotExist(address memberAddress) {
        require(members[memberAddress].memberAddress == address(0), "Member already exists");
        _;
    }

    function addMember(
        address memberAddress,
        string calldata x500Name,
        bytes calldata publicKey,
        uint256 serial,
        uint16 platformVersion,
        string calldata host,
        uint16 port
    ) external onlyOwner memberDoesNotExist(memberAddress) {
        NodeMember memory newMember = NodeMember({
            x500Name: x500Name,
            memberAddress: memberAddress,
            publicKey: publicKey,
            isActive: true,
            joinedAt: block.timestamp,
            lastUpdated: block.timestamp,
            serial: serial,
            platformVersion: platformVersion,
            host: host,
            port: port
        });

        members[memberAddress] = newMember;
        memberIndex[memberAddress] = memberAddresses.length;
        memberAddresses.push(memberAddress);

        emit MemberAdded(memberAddress, x500Name);
    }

    function removeMember(address memberAddress) external onlyOwner memberExists(memberAddress) {
        uint256 index = memberIndex[memberAddress];
        address lastMember = memberAddresses[memberAddresses.length - 1];

        memberAddresses[index] = lastMember;
        memberIndex[lastMember] = index;

        memberAddresses.pop();
        delete memberIndex[memberAddress];
        delete members[memberAddress];

        emit MemberRemoved(memberAddress);
    }

    function updateMemberStatus(address memberAddress, bool isActive) external onlyOwner memberExists(memberAddress) {
        members[memberAddress].isActive = isActive;
        members[memberAddress].lastUpdated = block.timestamp;
        emit MemberUpdated(memberAddress);
    }

    function updateMemberDetails(
        address memberAddress,
        string calldata x500Name,
        bytes calldata publicKey,
        uint256 serial,
        uint16 platformVersion,
        string calldata host,
        uint16 port
    ) external onlyOwner memberExists(memberAddress) {
        NodeMember storage member = members[memberAddress];
        member.x500Name = x500Name;
        member.publicKey = publicKey;
        member.serial = serial;
        member.platformVersion = platformVersion;
        member.host = host;
        member.port = port;
        member.lastUpdated = block.timestamp;

        emit MemberUpdated(memberAddress);
    }

    function getMember(address memberAddress) external view memberExists(memberAddress) returns (NodeMember memory) {
        return members[memberAddress];
    }

    function getAllMembers() external view returns (address[] memory) {
        return memberAddresses;
    }

    function isMember(address memberAddress) external view returns (bool) {
        return members[memberAddress].memberAddress != address(0);
    }
}
