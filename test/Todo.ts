import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Todo", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearLockFixture() {
    // Contracts are deployed using the first signer/account by default
    const [deployer, otherAccount] = await ethers.getSigners();

    const ContractFactory = await ethers.getContractFactory("Todo");
    const contract = await ContractFactory.deploy();

    return { contract, deployer, otherAccount };
  }

  describe("Storage", function() {
    it("Should create a task", async function () {
      const { contract, deployer } = await loadFixture(deployOneYearLockFixture);

      await contract.createTask("Task 1");
      
      expect(
        await contract.taskCount(deployer.address)
        ).to.be.equal(1);

      expect(
        (await contract.getTask(0))[0]
      ).to.be.equal("Task 1");
    });

    it("Should return correct number of created  tasks", async function () {
      const { contract, deployer } = await loadFixture(deployOneYearLockFixture);

      await contract.createTask("Task 1");
      await contract.createTask("Task 2");
      await contract.createTask("Task 3");
      await contract.createTask("Task 4");
      
      expect(await contract.taskCount(deployer.address)).to.be.equal(4);
    });

    describe("Delete", function () {
			it("Should revert when task doesn't exist", async function () {
				const { contract } = await loadFixture(deployOneYearLockFixture);

				await expect(contract.deleteTask(0)).to.be.reverted;
				await expect(contract.deleteTask(1)).to.be.reverted;
			});

			it("Should not override other tasks", async function () {
				const { contract } = await loadFixture(deployOneYearLockFixture);

        await contract.createTask("Task 1");
        await contract.createTask("Task 2"); // this will be deleted
        await contract.createTask("Task 3");
        await contract.createTask("Task 4");

        await contract.deleteTask(1);

        await contract.createTask("Task 5");

				expect(
          (await contract.getTask(0))[0]
        ).to.be.equal("Task 1");
				expect(
          (await contract.getTask(2))[0]
        ).to.be.equal("Task 3");
        // Task 2 should be deleted
				expect(
          (await contract.getTask(3))[0]
        ).to.be.equal("Task 4");
				expect(
          (await contract.getTask(4))[0]
        ).to.be.equal("Task 5");
			});

		});

  });

  describe("Events", function () {
		it("Should emit an event after creating a task", async function () {
			const { contract, deployer } = await loadFixture(deployOneYearLockFixture);

			await expect(contract.createTask("Task 1")).to.emit(
				contract,
				"TaskCreated"
			);

      expect(await contract.taskCount(deployer.address)).to.be.equal(1);
		});

		it("Should emit an event after deleting a task", async function () {
			const { contract, deployer } = await loadFixture(deployOneYearLockFixture);

      await contract.createTask("Task 1");

			await expect(contract.deleteTask(0)).to.emit(
				contract,
				"TaskDeleted"
			);

      // id should not decrement in value
      // expect(await contract.taskCount(deployer.address)).to.be.equal(0);
		});
	});
});
