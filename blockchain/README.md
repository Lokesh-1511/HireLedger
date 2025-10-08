# Copilot Prompt: Generate a standalone blockchain credential verification module (NO frontend, NO integration yet)

We are building the blockchain layer for a campus recruitment / academic credential verification platform.  
The main web app already exists, so DO NOT build or modify any frontend.  
This module should be completely standalone and live in a separate `blockchain/` folder.  
We will integrate it into the main project later.

### ✅ What to build:

1. **Solidity Smart Contract (`CertificateVerifier.sol`):**
   - Store certificate details as a `bytes32` hash, issuer address, owner (student) address, issue date, and revocation status.
   - Only authorized issuers (universities) can issue or revoke certificates.
   - Anyone can verify a certificate’s validity.
   - Include a function `setAuthorizer(address issuer, bool status)` accessible only by the contract owner to authorize/revoke institutions.
   - Emit events for certificate issuance, revocation, and authorization changes.
   - Use best practices for access control, error handling, and comments.

2. **Deployment Script (`deploy.js` or `deploy.ts`):**
   - Use Hardhat (preferred) or Truffle to deploy the smart contract to a local or test network (e.g., Ganache, Sepolia, etc.).

3. **Interaction Script (`interact.js`):**
   - Functions to:
     - Hash sample certificate data and issue a certificate.
     - Verify a certificate by its hash.
     - Revoke a certificate and verify its status again.
   - Include clear console logs for demonstration (e.g., “Certificate issued ✅”, “Verification result: valid/invalid”).

4. **Mock Blockchain Adapter (for current website use):**
   - Create a simple JS module `mockBlockchain.js` with dummy functions to simulate blockchain responses until integration:
     ```js
     export function mockVerifyCertificate(hash) {
       return { valid: true, issuer: "Demo University", revoked: false };
     }
     export function mockIssueCertificate(data) {
       return { txHash: "0x123...", certHash: "0xabc..." };
     }
     ```
   - The website will use this mock adapter for now.

5. **Optional Utility (if possible):**
   - Small utility script to generate a SHA-256 hash from certificate data.
   - Example: `generateHash.js` with a function `generateHash({ name, degree, date })`.

### ⚙️ Notes:
- Do NOT include or modify any frontend/UI code.
- Do NOT integrate with the existing backend for now — just export functions that we can call later.
- The code should be clean, production-ready, and well-documented with comments explaining each part.

Goal: Deliver a **fully functional blockchain backend module** that can issue, verify, and revoke credentials — but remains separate from the main site until final integration.
