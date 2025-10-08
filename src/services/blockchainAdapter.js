// Lightweight blockchain adapter (client-side)
// Bridges the app to the standalone blockchain module without
// tightly coupling UI to implementation details. Swappable with a
// real on-chain provider later (ethers/web3) via the same interface.

// Dynamic import defers bundle cost until first use.
async function loadBackend() {
  // Using relative path outside src requires Vite alias or explicit path.
  // We expose only the minimal surface needed now.
  const mod = await import('../../blockchain/mockBlockchain.js');
  return mod;
}

// API Surface (Promise-returning methods)
export async function issueCredential({ learnerId, title, payloadHash }) {
  const { issueCredential } = await loadBackend();
  return issueCredential({ learnerId, title, payloadHash });
}

export async function verifyCredential({ credentialId, payloadHash }) {
  const { verifyCredential } = await loadBackend();
  return verifyCredential({ credentialId, payloadHash });
}

export async function revokeCredential({ credentialId }) {
  const { revokeCredential } = await loadBackend();
  return revokeCredential({ credentialId });
}

export async function listCredentials({ learnerId }) {
  const { listCredentials } = await loadBackend();
  return listCredentials({ learnerId });
}

// Utility for hashing (client-side consistency with backend tooling)
export async function hashData(input) {
  const { subtle } = window.crypto || {};
  if (!subtle) throw new Error('Web Crypto not available');
  const data = new TextEncoder().encode(input);
  const digest = await subtle.digest('SHA-256', data);
  return '0x' + Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

// Future: switch loadBackend() to a real provider while preserving the above exports.

export const BlockchainAdapter = {
  issueCredential,
  verifyCredential,
  revokeCredential,
  listCredentials,
  hashData,
};

export default BlockchainAdapter;