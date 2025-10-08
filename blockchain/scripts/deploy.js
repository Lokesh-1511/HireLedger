// Deployment script for CertificateVerifier
// Usage (local): npx hardhat run scripts/deploy.js --network localhost
// Usage (sepolia): npx hardhat run scripts/deploy.js --network sepolia
import { ethers } from 'hardhat';

async function main() {
  console.log('Compiling & deploying CertificateVerifier...');
  const Factory = await ethers.getContractFactory('CertificateVerifier');
  const contract = await Factory.deploy();
  await contract.deployed();
  console.log('CertificateVerifier deployed at:', contract.address);

  // Example: auto-authorize deployer as issuer (optional)
  const [deployer] = await ethers.getSigners();
  const tx = await contract.setAuthorizer(deployer.address, true);
  await tx.wait();
  console.log('Deployer authorized as issuer:', deployer.address);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
