import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { toHex } from "viem";

describe("NetworkManager", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [owner, member1, member2, member3, nonOwner] = await viem.getWalletClients();

  // Helper function to create sample member data
  function createMemberData(index: number) {
    return {
      x500Name: `CN=Node${index}, O=Organization, L=City, C=US`,
      publicKey: toHex(`publicKey${index}`, { size: 32 }),
      serial: BigInt(1000 + index),
      platformVersion: 1,
      host: `node${index}.example.com`,
      port: 30303 + index,
    };
  }

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const networkManager = await viem.deployContract("NetworkManager");
      const contractOwner = (await networkManager.read.owner()) as `0x${string}`;
      assert.equal(contractOwner.toLowerCase(), owner.account.address.toLowerCase());
    });

    it("Should have no members initially", async function () {
      const networkManager = await viem.deployContract("NetworkManager");
      const members = (await networkManager.read.getAllMembers()) as `0x${string}`[];
      assert.equal(members.length, 0);
    });
  });

  describe("Add Member", function () {
    it("Should successfully add a member", async function () {
      const networkManager = await viem.deployContract("NetworkManager");
      const memberData = createMemberData(1);

      await networkManager.write.addMember([
        member1.account.address,
        memberData.x500Name,
        memberData.publicKey,
        memberData.serial,
        memberData.platformVersion,
        memberData.host,
        memberData.port,
      ]);

      const isMember = await networkManager.read.isMember([member1.account.address]);
      assert.equal(isMember, true);
    });

    it("Should emit MemberAdded event", async function () {
      const networkManager = await viem.deployContract("NetworkManager");
      const deploymentBlockNumber = await publicClient.getBlockNumber();
      const memberData = createMemberData(1);

      await networkManager.write.addMember([
        member1.account.address,
        memberData.x500Name,
        memberData.publicKey,
        memberData.serial,
        memberData.platformVersion,
        memberData.host,
        memberData.port,
      ]);

      const events = await publicClient.getContractEvents({
        address: networkManager.address,
        abi: networkManager.abi,
        eventName: "MemberAdded",
        fromBlock: deploymentBlockNumber,
        strict: true,
      });

      assert.equal(events.length, 1);
      assert.equal((events[0].args as any).memberAddress?.toLowerCase(), member1.account.address.toLowerCase());
      assert.equal((events[0].args as any).x500Name, memberData.x500Name);
    });

    it("Should store member data correctly", async function () {
      const networkManager = await viem.deployContract("NetworkManager");
      const memberData = createMemberData(1);

      await networkManager.write.addMember([
        member1.account.address,
        memberData.x500Name,
        memberData.publicKey,
        memberData.serial,
        memberData.platformVersion,
        memberData.host,
        memberData.port,
      ]);

      const storedMember = (await networkManager.read.getMember([member1.account.address])) as any;

      assert.equal(storedMember.x500Name, memberData.x500Name);
      assert.equal(storedMember.memberAddress.toLowerCase(), member1.account.address.toLowerCase());
      assert.equal(storedMember.publicKey, memberData.publicKey);
      assert.equal(storedMember.isActive, true);
      assert.equal(storedMember.serial, memberData.serial);
      assert.equal(storedMember.platformVersion, memberData.platformVersion);
      assert.equal(storedMember.host, memberData.host);
      assert.equal(storedMember.port, memberData.port);
    });

    it("Should add multiple members", async function () {
      const networkManager = await viem.deployContract("NetworkManager");
      const memberData1 = createMemberData(1);
      const memberData2 = createMemberData(2);
      const memberData3 = createMemberData(3);

      await networkManager.write.addMember([
        member1.account.address,
        memberData1.x500Name,
        memberData1.publicKey,
        memberData1.serial,
        memberData1.platformVersion,
        memberData1.host,
        memberData1.port,
      ]);

      await networkManager.write.addMember([
        member2.account.address,
        memberData2.x500Name,
        memberData2.publicKey,
        memberData2.serial,
        memberData2.platformVersion,
        memberData2.host,
        memberData2.port,
      ]);

      await networkManager.write.addMember([
        member3.account.address,
        memberData3.x500Name,
        memberData3.publicKey,
        memberData3.serial,
        memberData3.platformVersion,
        memberData3.host,
        memberData3.port,
      ]);

      const members = (await networkManager.read.getAllMembers()) as `0x${string}`[];
      assert.equal(members.length, 3);
    });
  });

  describe("Remove Member", function () {
    it("Should successfully remove a member", async function () {
      const networkManager = await viem.deployContract("NetworkManager");
      const memberData = createMemberData(1);

      await networkManager.write.addMember([
        member1.account.address,
        memberData.x500Name,
        memberData.publicKey,
        memberData.serial,
        memberData.platformVersion,
        memberData.host,
        memberData.port,
      ]);

      await networkManager.write.removeMember([member1.account.address]);

      const isMember = await networkManager.read.isMember([member1.account.address]);
      assert.equal(isMember, false);
    });

    it("Should emit MemberRemoved event", async function () {
      const networkManager = await viem.deployContract("NetworkManager");
      const deploymentBlockNumber = await publicClient.getBlockNumber();
      const memberData = createMemberData(1);

      await networkManager.write.addMember([
        member1.account.address,
        memberData.x500Name,
        memberData.publicKey,
        memberData.serial,
        memberData.platformVersion,
        memberData.host,
        memberData.port,
      ]);

      await networkManager.write.removeMember([member1.account.address]);

      const events = await publicClient.getContractEvents({
        address: networkManager.address,
        abi: networkManager.abi,
        eventName: "MemberRemoved",
        fromBlock: deploymentBlockNumber,
        strict: true,
      });

      assert.equal(events.length, 1);
      assert.equal((events[0].args as any).memberAddress?.toLowerCase(), member1.account.address.toLowerCase());
    });

    it("Should maintain array integrity after removal from middle", async function () {
      const networkManager = await viem.deployContract("NetworkManager");
      const memberData1 = createMemberData(1);
      const memberData2 = createMemberData(2);
      const memberData3 = createMemberData(3);

      await networkManager.write.addMember([
        member1.account.address,
        memberData1.x500Name,
        memberData1.publicKey,
        memberData1.serial,
        memberData1.platformVersion,
        memberData1.host,
        memberData1.port,
      ]);

      await networkManager.write.addMember([
        member2.account.address,
        memberData2.x500Name,
        memberData2.publicKey,
        memberData2.serial,
        memberData2.platformVersion,
        memberData2.host,
        memberData2.port,
      ]);

      await networkManager.write.addMember([
        member3.account.address,
        memberData3.x500Name,
        memberData3.publicKey,
        memberData3.serial,
        memberData3.platformVersion,
        memberData3.host,
        memberData3.port,
      ]);

      // Remove middle member
      await networkManager.write.removeMember([member2.account.address]);

      const members = (await networkManager.read.getAllMembers()) as `0x${string}`[];
      assert.equal(members.length, 2);
      assert.equal(await networkManager.read.isMember([member1.account.address]), true);
      assert.equal(await networkManager.read.isMember([member2.account.address]), false);
      assert.equal(await networkManager.read.isMember([member3.account.address]), true);
    });
  });

  describe("Update Member Status", function () {
    it("Should successfully update member status to inactive", async function () {
      const networkManager = await viem.deployContract("NetworkManager");
      const memberData = createMemberData(1);

      await networkManager.write.addMember([
        member1.account.address,
        memberData.x500Name,
        memberData.publicKey,
        memberData.serial,
        memberData.platformVersion,
        memberData.host,
        memberData.port,
      ]);

      await networkManager.write.updateMemberStatus([member1.account.address, false]);

      const member = (await networkManager.read.getMember([member1.account.address])) as any;
      assert.equal(member.isActive, false);
    });

    it("Should emit MemberUpdated event when status changes", async function () {
      const networkManager = await viem.deployContract("NetworkManager");
      const deploymentBlockNumber = await publicClient.getBlockNumber();
      const memberData = createMemberData(1);

      await networkManager.write.addMember([
        member1.account.address,
        memberData.x500Name,
        memberData.publicKey,
        memberData.serial,
        memberData.platformVersion,
        memberData.host,
        memberData.port,
      ]);

      await networkManager.write.updateMemberStatus([member1.account.address, false]);

      const events = await publicClient.getContractEvents({
        address: networkManager.address,
        abi: networkManager.abi,
        eventName: "MemberUpdated",
        fromBlock: deploymentBlockNumber,
        strict: true,
      });

      // Should have 1 MemberUpdated event (from updateMemberStatus)
      const updateEvents = events.filter(e => e.eventName === "MemberUpdated");
      assert.equal(updateEvents.length, 1);
      assert.equal((updateEvents[0].args as any).memberAddress?.toLowerCase(), member1.account.address.toLowerCase());
    });
  });

  describe("Update Member Details", function () {
    it("Should successfully update member details", async function () {
      const networkManager = await viem.deployContract("NetworkManager");
      const memberData = createMemberData(1);

      await networkManager.write.addMember([
        member1.account.address,
        memberData.x500Name,
        memberData.publicKey,
        memberData.serial,
        memberData.platformVersion,
        memberData.host,
        memberData.port,
      ]);

      const updatedData = {
        x500Name: "CN=NodeUpdated, O=NewOrg, L=NewCity, C=US",
        publicKey: toHex("updatedPublicKey", { size: 32 }),
        serial: 2002n,
        platformVersion: 2,
        host: "updated.example.com",
        port: 30304,
      };

      await networkManager.write.updateMemberDetails([
        member1.account.address,
        updatedData.x500Name,
        updatedData.publicKey,
        updatedData.serial,
        updatedData.platformVersion,
        updatedData.host,
        updatedData.port,
      ]);

      const member = (await networkManager.read.getMember([member1.account.address])) as any;
      assert.equal(member.x500Name, updatedData.x500Name);
      assert.equal(member.publicKey, updatedData.publicKey);
      assert.equal(member.serial, updatedData.serial);
      assert.equal(member.platformVersion, updatedData.platformVersion);
      assert.equal(member.host, updatedData.host);
      assert.equal(member.port, updatedData.port);
    });

    it("Should emit MemberUpdated event when details change", async function () {
      const networkManager = await viem.deployContract("NetworkManager");
      const deploymentBlockNumber = await publicClient.getBlockNumber();
      const memberData = createMemberData(1);

      await networkManager.write.addMember([
        member1.account.address,
        memberData.x500Name,
        memberData.publicKey,
        memberData.serial,
        memberData.platformVersion,
        memberData.host,
        memberData.port,
      ]);

      const updatedData = {
        x500Name: "CN=NodeUpdated, O=NewOrg, L=NewCity, C=US",
        publicKey: toHex("updatedPublicKey", { size: 32 }),
        serial: 2002n,
        platformVersion: 2,
        host: "updated.example.com",
        port: 30304,
      };

      await networkManager.write.updateMemberDetails([
        member1.account.address,
        updatedData.x500Name,
        updatedData.publicKey,
        updatedData.serial,
        updatedData.platformVersion,
        updatedData.host,
        updatedData.port,
      ]);

      const events = await publicClient.getContractEvents({
        address: networkManager.address,
        abi: networkManager.abi,
        eventName: "MemberUpdated",
        fromBlock: deploymentBlockNumber,
        strict: true,
      });

      // Should have 1 MemberUpdated event (from updateMemberDetails)
      const updateEvents = events.filter(e => e.eventName === "MemberUpdated");
      assert.equal(updateEvents.length, 1);
      assert.equal((updateEvents[0].args as any).memberAddress?.toLowerCase(), member1.account.address.toLowerCase());
    });
  });

  describe("Query Functions", function () {
    it("Should return all member addresses", async function () {
      const networkManager = await viem.deployContract("NetworkManager");
      const memberData1 = createMemberData(1);
      const memberData2 = createMemberData(2);

      await networkManager.write.addMember([
        member1.account.address,
        memberData1.x500Name,
        memberData1.publicKey,
        memberData1.serial,
        memberData1.platformVersion,
        memberData1.host,
        memberData1.port,
      ]);

      await networkManager.write.addMember([
        member2.account.address,
        memberData2.x500Name,
        memberData2.publicKey,
        memberData2.serial,
        memberData2.platformVersion,
        memberData2.host,
        memberData2.port,
      ]);

      const members = (await networkManager.read.getAllMembers()) as `0x${string}`[];
      assert.equal(members.length, 2);
      assert.equal(members[0].toLowerCase(), member1.account.address.toLowerCase());
      assert.equal(members[1].toLowerCase(), member2.account.address.toLowerCase());
    });

    it("Should correctly report member existence", async function () {
      const networkManager = await viem.deployContract("NetworkManager");
      const memberData = createMemberData(1);

      // Non-existent member
      assert.equal(await networkManager.read.isMember([member1.account.address]), false);

      // Add member
      await networkManager.write.addMember([
        member1.account.address,
        memberData.x500Name,
        memberData.publicKey,
        memberData.serial,
        memberData.platformVersion,
        memberData.host,
        memberData.port,
      ]);

      // Existing member
      assert.equal(await networkManager.read.isMember([member1.account.address]), true);
    });
  });
});
