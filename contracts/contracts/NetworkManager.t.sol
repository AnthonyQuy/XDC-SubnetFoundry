// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {NetworkManager} from "./NetworkManager.sol";
import {Test} from "forge-std/Test.sol";

contract NetworkManagerTest is Test {
    NetworkManager networkManager;
    address owner;
    address member1;
    address member2;
    address nonOwner;

    function setUp() public {
        owner = address(this);
        member1 = address(0x1);
        member2 = address(0x2);
        nonOwner = address(0x999);
        networkManager = new NetworkManager();
    }

    function test_InitialOwner() public view {
        require(networkManager.owner() == owner, "Owner should be set correctly");
    }

    function test_InitialMemberCount() public view {
        address[] memory members = networkManager.getAllMembers();
        require(members.length == 0, "Initial member count should be 0");
    }

    function test_AddMember() public {
        networkManager.addMember(
            member1,
            "CN=Node1, O=Org, L=City, C=US",
            hex"1234567890abcdef1234567890abcdef",
            1001,
            1,
            "node1.example.com",
            30303
        );

        require(networkManager.isMember(member1), "Member should be added");
        
        address[] memory members = networkManager.getAllMembers();
        require(members.length == 1, "Member count should be 1");
    }

    function test_AddMemberEmitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit NetworkManager.MemberAdded(member1, "CN=Node1, O=Org, L=City, C=US");
        
        networkManager.addMember(
            member1,
            "CN=Node1, O=Org, L=City, C=US",
            hex"1234567890abcdef1234567890abcdef",
            1001,
            1,
            "node1.example.com",
            30303
        );
    }

    function test_GetMember() public {
        networkManager.addMember(
            member1,
            "CN=Node1, O=Org, L=City, C=US",
            hex"1234567890abcdef1234567890abcdef",
            1001,
            1,
            "node1.example.com",
            30303
        );

        NetworkManager.NodeMember memory member = networkManager.getMember(member1);
        require(member.memberAddress == member1, "Member address should match");
        require(keccak256(bytes(member.x500Name)) == keccak256(bytes("CN=Node1, O=Org, L=City, C=US")), "X500 name should match");
        require(member.isActive == true, "Member should be active");
        require(member.serial == 1001, "Serial should match");
        require(member.platformVersion == 1, "Platform version should match");
        require(keccak256(bytes(member.host)) == keccak256(bytes("node1.example.com")), "Host should match");
        require(member.port == 30303, "Port should match");
    }

    function test_RevertWhen_AddingDuplicateMember() public {
        networkManager.addMember(
            member1,
            "CN=Node1, O=Org, L=City, C=US",
            hex"1234567890abcdef1234567890abcdef",
            1001,
            1,
            "node1.example.com",
            30303
        );

        vm.expectRevert("Member already exists");
        networkManager.addMember(
            member1,
            "CN=Node1, O=Org, L=City, C=US",
            hex"1234567890abcdef1234567890abcdef",
            1001,
            1,
            "node1.example.com",
            30303
        );
    }

    function test_RevertWhen_NonOwnerAddsMember() public {
        vm.prank(nonOwner);
        vm.expectRevert();
        networkManager.addMember(
            member1,
            "CN=Node1, O=Org, L=City, C=US",
            hex"1234567890abcdef1234567890abcdef",
            1001,
            1,
            "node1.example.com",
            30303
        );
    }

    function test_RemoveMember() public {
        networkManager.addMember(
            member1,
            "CN=Node1, O=Org, L=City, C=US",
            hex"1234567890abcdef1234567890abcdef",
            1001,
            1,
            "node1.example.com",
            30303
        );

        networkManager.removeMember(member1);

        require(!networkManager.isMember(member1), "Member should be removed");
        
        address[] memory members = networkManager.getAllMembers();
        require(members.length == 0, "Member count should be 0");
    }

    function test_RemoveMemberEmitsEvent() public {
        networkManager.addMember(
            member1,
            "CN=Node1, O=Org, L=City, C=US",
            hex"1234567890abcdef1234567890abcdef",
            1001,
            1,
            "node1.example.com",
            30303
        );

        vm.expectEmit(true, false, false, false);
        emit NetworkManager.MemberRemoved(member1);
        
        networkManager.removeMember(member1);
    }

    function test_RevertWhen_RemovingNonExistentMember() public {
        vm.expectRevert("Member does not exist");
        networkManager.removeMember(member1);
    }

    function test_RevertWhen_NonOwnerRemovesMember() public {
        networkManager.addMember(
            member1,
            "CN=Node1, O=Org, L=City, C=US",
            hex"1234567890abcdef1234567890abcdef",
            1001,
            1,
            "node1.example.com",
            30303
        );

        vm.prank(nonOwner);
        vm.expectRevert();
        networkManager.removeMember(member1);
    }

    function test_UpdateMemberStatus() public {
        networkManager.addMember(
            member1,
            "CN=Node1, O=Org, L=City, C=US",
            hex"1234567890abcdef1234567890abcdef",
            1001,
            1,
            "node1.example.com",
            30303
        );

        networkManager.updateMemberStatus(member1, false);

        NetworkManager.NodeMember memory member = networkManager.getMember(member1);
        require(member.isActive == false, "Member should be inactive");
    }

    function test_UpdateMemberStatusEmitsEvent() public {
        networkManager.addMember(
            member1,
            "CN=Node1, O=Org, L=City, C=US",
            hex"1234567890abcdef1234567890abcdef",
            1001,
            1,
            "node1.example.com",
            30303
        );

        vm.expectEmit(true, false, false, false);
        emit NetworkManager.MemberUpdated(member1);
        
        networkManager.updateMemberStatus(member1, false);
    }

    function test_RevertWhen_UpdatingNonExistentMemberStatus() public {
        vm.expectRevert("Member does not exist");
        networkManager.updateMemberStatus(member1, false);
    }

    function test_UpdateMemberDetails() public {
        networkManager.addMember(
            member1,
            "CN=Node1, O=Org, L=City, C=US",
            hex"1234567890abcdef1234567890abcdef",
            1001,
            1,
            "node1.example.com",
            30303
        );

        networkManager.updateMemberDetails(
            member1,
            "CN=NodeUpdated, O=NewOrg, L=NewCity, C=US",
            hex"fedcba0987654321fedcba0987654321",
            2002,
            2,
            "updated.example.com",
            30304
        );

        NetworkManager.NodeMember memory member = networkManager.getMember(member1);
        require(keccak256(bytes(member.x500Name)) == keccak256(bytes("CN=NodeUpdated, O=NewOrg, L=NewCity, C=US")), "X500 name should be updated");
        require(member.serial == 2002, "Serial should be updated");
        require(member.platformVersion == 2, "Platform version should be updated");
        require(keccak256(bytes(member.host)) == keccak256(bytes("updated.example.com")), "Host should be updated");
        require(member.port == 30304, "Port should be updated");
    }

    function test_UpdateMemberDetailsEmitsEvent() public {
        networkManager.addMember(
            member1,
            "CN=Node1, O=Org, L=City, C=US",
            hex"1234567890abcdef1234567890abcdef",
            1001,
            1,
            "node1.example.com",
            30303
        );

        vm.expectEmit(true, false, false, false);
        emit NetworkManager.MemberUpdated(member1);
        
        networkManager.updateMemberDetails(
            member1,
            "CN=NodeUpdated, O=NewOrg, L=NewCity, C=US",
            hex"fedcba0987654321fedcba0987654321",
            2002,
            2,
            "updated.example.com",
            30304
        );
    }

    function test_MultipleMembers() public {
        networkManager.addMember(
            member1,
            "CN=Node1, O=Org, L=City, C=US",
            hex"1234567890abcdef1234567890abcdef",
            1001,
            1,
            "node1.example.com",
            30303
        );

        networkManager.addMember(
            member2,
            "CN=Node2, O=Org, L=City, C=US",
            hex"abcdef1234567890abcdef1234567890",
            1002,
            1,
            "node2.example.com",
            30304
        );

        address[] memory members = networkManager.getAllMembers();
        require(members.length == 2, "Should have 2 members");
        require(networkManager.isMember(member1), "Member1 should exist");
        require(networkManager.isMember(member2), "Member2 should exist");
    }

    function test_RemoveMiddleMember() public {
        address member3 = address(0x3);
        
        networkManager.addMember(
            member1,
            "CN=Node1, O=Org, L=City, C=US",
            hex"1111111111111111111111111111111111111111111111111111111111111111",
            1001,
            1,
            "node1.example.com",
            30303
        );

        networkManager.addMember(
            member2,
            "CN=Node2, O=Org, L=City, C=US",
            hex"2222222222222222222222222222222222222222222222222222222222222222",
            1002,
            1,
            "node2.example.com",
            30304
        );

        networkManager.addMember(
            member3,
            "CN=Node3, O=Org, L=City, C=US",
            hex"3333333333333333333333333333333333333333333333333333333333333333",
            1003,
            1,
            "node3.example.com",
            30305
        );

        // Remove middle member
        networkManager.removeMember(member2);

        address[] memory members = networkManager.getAllMembers();
        require(members.length == 2, "Should have 2 members after removal");
        require(networkManager.isMember(member1), "Member1 should still exist");
        require(!networkManager.isMember(member2), "Member2 should not exist");
        require(networkManager.isMember(member3), "Member3 should still exist");
    }

    function testFuzz_AddMultipleMembers(uint8 count) public {
        vm.assume(count > 0 && count <= 50);
        
        for (uint8 i = 0; i < count; i++) {
            address memberAddr = address(uint160(uint256(keccak256(abi.encodePacked(i)))));
            
            networkManager.addMember(
                memberAddr,
                "CN=Node, O=Org, L=City, C=US",
                abi.encodePacked(keccak256(abi.encodePacked(i))),
                1000 + i,
                1,
                "node.example.com",
                30303 + i
            );
        }

        address[] memory members = networkManager.getAllMembers();
        require(members.length == count, "Member count should match fuzz count");
    }
}
