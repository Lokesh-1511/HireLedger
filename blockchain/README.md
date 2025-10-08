# HireLedger Blockchain Module

Standalone smart contract + tooling for credential issuance, verification, and revocation.

## Contents
- `contracts/CertificateVerifier.sol` – Core Solidity contract
- `scripts/deploy.js` – Hardhat deployment script
- `scripts/interact.js` – Issue/verify/revoke demonstration
- `scripts/generateHash.js` – SHA-256 hash utility
- `mockBlockchain.js` – Temporary mock adapter for frontend integration
- `hardhat.config.js` – Hardhat configuration (local + Sepolia)
- `package.json` – Module-specific scripts & dependencies

## Contract Overview
`CertificateVerifier` stores a mapping of certificate hash => metadata:
- `issuer` (authorized institution address)
- `owner` (student/recipient)
- `issuedAt` (timestamp)
- `revoked` / `revokedAt`

### Key Functions
| Function | Description |
|----------|-------------|
| `setAuthorizer(address,bool)` | Owner authorizes or deauthorizes issuers |
| `issueCertificate(bytes32,address)` | Authorized issuer mints a credential |
| `revokeCertificate(bytes32)` | Authorized issuer revokes its issued credential |
| `verifyCertificate(bytes32)` | Public read – returns validity + metadata |
| `getCertificate(bytes32)` | Returns raw struct for off-chain indexing |

### Events
- `IssuerAuthorizationChanged(issuer, authorized, by)`
- `CertificateIssued(certHash, issuer, owner, issuedAt)`
- `CertificateRevoked(certHash, issuer, revokedAt)`

## Getting Started
```bash
cd blockchain
npm install
npx hardhat compile
npx hardhat node # (optional: start local chain in another terminal)
npm run deploy         # deploy to localhost
# set environment vars then:
CERT_CONTRACT=0xDeployedAddress PRIVATE_KEY=0x... npm run interact
```

### Environment Variables (.env)
```
PRIVATE_KEY=0xYOUR_LOCAL_OR_TESTNET_PRIVATE_KEY
SEPOLIA_RPC=https://sepolia.infura.io/v3/<key>
INFURA_KEY=<optional_if_using_template_url>
ETHERSCAN_API_KEY=<optional_for_verification>
CERT_CONTRACT=0xDeployedAddress
LOCAL_RPC=http://127.0.0.1:8545
```

## Hashing Certificates
```bash
node scripts/generateHash.js "Alice Student" "B.Tech CSE" "2026-05-30" "IIT Madras"
```
Or import in code:
```js
import { generateHash } from './scripts/generateHash.js';
const hash = generateHash({ name, degree, date, institution });
```

## Mock Adapter Usage
```js
import { mockIssueCertificate, mockVerifyCertificate } from './mockBlockchain.js';
const { certHash } = mockIssueCertificate({ name: 'Alice', degree: 'B.Tech' });
const result = mockVerifyCertificate(certHash);
```

## Security & Production Notes
- Add role-based controls and possibly OpenZeppelin `AccessControl` for granular issuer tiers.
- Consider upgradeability (UUPS or Transparent Proxy) if schema evolution needed.
- On-chain data purposely minimal; full credential metadata should live off-chain (IPFS/Arweave) with hash committed here.
- Add pause / emergency withdraw pattern if required by governance.

## Next Integration Steps
1. Wire a backend adapter that wraps `ethers` calls (issue/verify/revoke).
2. Replace `mockBlockchain.js` usage in the web app with real adapter behind feature flag.
3. Store transaction receipts and cert hash in Firestore for audit linking.
4. Add indexer / listener to push revocation updates to the app in (near) real-time.

## License
MIT
