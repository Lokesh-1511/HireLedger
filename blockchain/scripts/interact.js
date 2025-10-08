// Simple interaction script demonstrating issue / verify / revoke cycle.
// Assumes contract already deployed. Provide CONTRACT_ADDRESS via env or inline.
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

dotenv.config();

const CONTRACT_ADDRESS = process.env.CERT_CONTRACT || '';
const RPC = process.env.LOCAL_RPC || 'http://127.0.0.1:8545';
const PRIVATE_KEY = process.env.PRIVATE_KEY; // issuer key (must be authorized)

if (!CONTRACT_ADDRESS) {
  console.error('Set CERT_CONTRACT env var to deployed contract address.');
  process.exit(1);
}
if (!PRIVATE_KEY) {
  console.error('Set PRIVATE_KEY env var for issuer account.');
  process.exit(1);
}

const ABI_PATH = path.join(process.cwd(), 'artifacts', 'contracts', 'CertificateVerifier.sol', 'CertificateVerifier.json');
if (!fs.existsSync(ABI_PATH)) {
  console.error('ABI not found. Run: npx hardhat compile');
  process.exit(1);
}
const abi = JSON.parse(fs.readFileSync(ABI_PATH)).abi;

function hashCertificate(data) {
  // Data object example: { name, degree, graduationDate, institution }
  const canonical = `${data.name}|${data.degree}|${data.graduationDate}|${data.institution}`;
  return '0x' + crypto.createHash('sha256').update(canonical).digest('hex');
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

  console.log('Connected as issuer:', wallet.address);

  // 1. Hash sample cert
  const sample = { name: 'Alice Student', degree: 'B.Tech CSE', graduationDate: '2026-05-30', institution: 'IIT Madras' };
  const certHash = hashCertificate(sample);
  console.log('Sample certificate hash:', certHash);

  // 2. Issue (if not already)
  const existing = await contract.getCertificate(certHash);
  if (existing.issuedAt === 0n) {
    console.log('Issuing certificate...');
    const tx = await contract.issueCertificate(certHash, wallet.address);
    await tx.wait();
    console.log('Certificate issued ✅ tx:', tx.hash);
  } else {
    console.log('Certificate already issued. Skipping issuance.');
  }

  // 3. Verify
  const [valid, issuer, owner, issuedAt, revoked] = await contract.verifyCertificate(certHash);
  console.log('Verification result:', { valid, issuer, owner, issuedAt: Number(issuedAt), revoked });

  // 4. Revoke (demo)
  if (!revoked) {
    console.log('Revoking certificate...');
    const tx2 = await contract.revokeCertificate(certHash);
    await tx2.wait();
    console.log('Certificate revoked ❌ tx:', tx2.hash);
  } else {
    console.log('Already revoked earlier.');
  }

  // 5. Verify again
  const [valid2,, , , revoked2] = await contract.verifyCertificate(certHash);
  console.log('Post-revocation verification:', { valid: valid2, revoked: revoked2 });
}

main().catch(e => { console.error(e); process.exit(1); });
