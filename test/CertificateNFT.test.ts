import { expect } from "chai";
import hre from "hardhat";
import { CertificateNFT } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

const { ethers } = hre;

describe("CertificateNFT", function () {
  let certificate: CertificateNFT;
  let owner: SignerWithAddress;
  let minter: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const BASE_URI = "https://cryptocode.dev";
  const PROJECT_ID = "project-001";
  const PROJECT_NAME = "Smart Contract Basics";
  const PROJECT_TYPE = "smart-contract";
  const SCORE = 95;

  beforeEach(async function () {
    [owner, minter, user1, user2] = await ethers.getSigners();

    const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
    certificate = await CertificateNFT.deploy(BASE_URI, true); // soulbound = true
    await certificate.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await certificate.name()).to.equal("CryptoCode Certificate");
      expect(await certificate.symbol()).to.equal("CCERT");
    });

    it("Should set the owner as authorized minter", async function () {
      expect(await certificate.authorizedMinters(owner.address)).to.be.true;
    });

    it("Should set soulbound to true", async function () {
      expect(await certificate.soulbound()).to.be.true;
    });

    it("Should have total supply of 0", async function () {
      expect(await certificate.totalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint certificate", async function () {
      await expect(
        certificate.mintCertificate(user1.address, PROJECT_ID, PROJECT_NAME, PROJECT_TYPE, SCORE)
      )
        .to.emit(certificate, "CertificateMinted")
        .withArgs(0, user1.address, PROJECT_ID, SCORE);

      expect(await certificate.totalSupply()).to.equal(1);
      expect(await certificate.ownerOf(0)).to.equal(user1.address);
    });

    it("Should store certificate data correctly", async function () {
      await certificate.mintCertificate(user1.address, PROJECT_ID, PROJECT_NAME, PROJECT_TYPE, SCORE);

      const cert = await certificate.getCertificate(0);
      expect(cert.projectId).to.equal(PROJECT_ID);
      expect(cert.projectName).to.equal(PROJECT_NAME);
      expect(cert.projectType).to.equal(PROJECT_TYPE);
      expect(cert.recipient).to.equal(user1.address);
      expect(cert.score).to.equal(SCORE);
      expect(cert.tokenId).to.equal(0);
    });

    it("Should prevent minting to zero address", async function () {
      await expect(
        certificate.mintCertificate(ethers.ZeroAddress, PROJECT_ID, PROJECT_NAME, PROJECT_TYPE, SCORE)
      ).to.be.revertedWithCustomError(certificate, "MintToZeroAddress");
    });

    it("Should prevent minting with empty project ID", async function () {
      await expect(
        certificate.mintCertificate(user1.address, "", PROJECT_NAME, PROJECT_TYPE, SCORE)
      ).to.be.revertedWithCustomError(certificate, "EmptyProjectId");
    });

    it("Should prevent duplicate minting for same project", async function () {
      await certificate.mintCertificate(user1.address, PROJECT_ID, PROJECT_NAME, PROJECT_TYPE, SCORE);

      await expect(
        certificate.mintCertificate(user1.address, PROJECT_ID, PROJECT_NAME, PROJECT_TYPE, 80)
      ).to.be.revertedWithCustomError(certificate, "AlreadyMintedForProject");
    });

    it("Should allow same user to mint for different projects", async function () {
      await certificate.mintCertificate(user1.address, "project-001", PROJECT_NAME, PROJECT_TYPE, SCORE);
      await certificate.mintCertificate(user1.address, "project-002", "DeFi Basics", "defi", 88);

      expect(await certificate.totalSupply()).to.equal(2);
      expect(await certificate.balanceOf(user1.address)).to.equal(2);
    });

    it("Should prevent score over 100", async function () {
      await expect(
        certificate.mintCertificate(user1.address, PROJECT_ID, PROJECT_NAME, PROJECT_TYPE, 101)
      ).to.be.revertedWithCustomError(certificate, "InvalidScore");
    });

    it("Should only allow authorized minters", async function () {
      await expect(
        certificate.connect(user1).mintCertificate(user1.address, PROJECT_ID, PROJECT_NAME, PROJECT_TYPE, SCORE)
      ).to.be.revertedWithCustomError(certificate, "NotAuthorizedMinter");
    });
  });

  describe("Minter Management", function () {
    it("Should allow owner to add minter", async function () {
      await expect(certificate.setMinter(minter.address, true))
        .to.emit(certificate, "MinterUpdated")
        .withArgs(minter.address, true);

      expect(await certificate.authorizedMinters(minter.address)).to.be.true;
    });

    it("Should allow new minter to mint", async function () {
      await certificate.setMinter(minter.address, true);
      
      await expect(
        certificate.connect(minter).mintCertificate(user1.address, PROJECT_ID, PROJECT_NAME, PROJECT_TYPE, SCORE)
      ).to.emit(certificate, "CertificateMinted");
    });

    it("Should allow owner to remove minter", async function () {
      await certificate.setMinter(minter.address, true);
      await certificate.setMinter(minter.address, false);

      expect(await certificate.authorizedMinters(minter.address)).to.be.false;
    });

    it("Should prevent non-owner from adding minter", async function () {
      await expect(
        certificate.connect(user1).setMinter(minter.address, true)
      ).to.be.revertedWithCustomError(certificate, "OwnableUnauthorizedAccount");
    });
  });

  describe("Soulbound (Non-transferable)", function () {
    beforeEach(async function () {
      await certificate.mintCertificate(user1.address, PROJECT_ID, PROJECT_NAME, PROJECT_TYPE, SCORE);
    });

    it("Should prevent transfers when soulbound is true", async function () {
      await expect(
        certificate.connect(user1).transferFrom(user1.address, user2.address, 0)
      ).to.be.revertedWithCustomError(certificate, "SoulboundTokenCannotBeTransferred");
    });

    it("Should prevent safeTransferFrom when soulbound is true", async function () {
      await expect(
        certificate.connect(user1)["safeTransferFrom(address,address,uint256)"](user1.address, user2.address, 0)
      ).to.be.revertedWithCustomError(certificate, "SoulboundTokenCannotBeTransferred");
    });

    it("Should allow owner to disable soulbound", async function () {
      await certificate.setSoulbound(false);
      expect(await certificate.soulbound()).to.be.false;
    });

    it("Should allow transfers when soulbound is false", async function () {
      await certificate.setSoulbound(false);
      
      await certificate.connect(user1).transferFrom(user1.address, user2.address, 0);
      expect(await certificate.ownerOf(0)).to.equal(user2.address);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await certificate.mintCertificate(user1.address, PROJECT_ID, PROJECT_NAME, PROJECT_TYPE, SCORE);
    });

    it("Should return correct hasMinted status", async function () {
      expect(await certificate.hasMinted(user1.address, PROJECT_ID)).to.be.true;
      expect(await certificate.hasMinted(user1.address, "other-project")).to.be.false;
      expect(await certificate.hasMinted(user2.address, PROJECT_ID)).to.be.false;
    });

    it("Should return correct token for project", async function () {
      expect(await certificate.getTokenForProject(user1.address, PROJECT_ID)).to.equal(0);
    });

    it("Should revert getTokenForProject for non-existent certificate", async function () {
      await expect(
        certificate.getTokenForProject(user2.address, PROJECT_ID)
      ).to.be.revertedWithCustomError(certificate, "NoCertificateForProject");
    });

    it("Should return correct tokenURI", async function () {
      const uri = await certificate.tokenURI(0);
      expect(uri).to.equal(`${BASE_URI}/api/certificate/0`);
    });

    it("Should revert tokenURI for non-existent token", async function () {
      await expect(certificate.tokenURI(999))
        .to.be.revertedWithCustomError(certificate, "TokenDoesNotExist");
    });

    it("Should return correct isSoulbound", async function () {
      expect(await certificate.isSoulbound()).to.be.true;
    });
  });

  describe("Base URI", function () {
    it("Should allow owner to update base URI", async function () {
      const newURI = "https://newdomain.com";
      await certificate.setBaseURI(newURI);
      
      await certificate.mintCertificate(user1.address, PROJECT_ID, PROJECT_NAME, PROJECT_TYPE, SCORE);
      
      const uri = await certificate.tokenURI(0);
      expect(uri).to.equal(`${newURI}/api/certificate/0`);
    });

    it("Should prevent non-owner from updating base URI", async function () {
      await expect(
        certificate.connect(user1).setBaseURI("https://hack.com")
      ).to.be.revertedWithCustomError(certificate, "OwnableUnauthorizedAccount");
    });
  });

  describe("Non-soulbound Deployment", function () {
    let nonSoulboundCert: CertificateNFT;

    beforeEach(async function () {
      const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
      nonSoulboundCert = await CertificateNFT.deploy(BASE_URI, false); // soulbound = false
      await nonSoulboundCert.waitForDeployment();
    });

    it("Should allow transfers when deployed non-soulbound", async function () {
      await nonSoulboundCert.mintCertificate(user1.address, PROJECT_ID, PROJECT_NAME, PROJECT_TYPE, SCORE);
      
      await nonSoulboundCert.connect(user1).transferFrom(user1.address, user2.address, 0);
      expect(await nonSoulboundCert.ownerOf(0)).to.equal(user2.address);
    });
  });
});
