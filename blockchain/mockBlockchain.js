// Mock Blockchain Adapter
// Temporary stand-in so the web app can interact with a stable interface before real chain integration.

// Legacy mock-style functions (kept for backward compatibility)
export function mockVerifyCertificate(hash) {
  return { valid: true, issuer: 'Demo University', revoked: false, hash };
}
export function mockIssueCertificate(data) {
  return { txHash: '0x123mock', certHash: '0x' + Buffer.from(JSON.stringify(data)).toString('hex').slice(0, 64) };
}
export function mockRevokeCertificate(hash) {
  return { txHash: '0x456mock', certHash: hash, revoked: true };
}

// New unified interface expected by src/services/blockchainAdapter.js
// Simple in-memory store for session life (NOT persisted)
const _store = [];

function now() { return Date.now(); }

export function issueCredential({ learnerId, title, payloadHash }) {
  const item = {
    id: 'cred_' + Math.random().toString(36).slice(2, 10),
    learnerId,
    title,
    payloadHash,
    issuedAt: now(),
    verified: false,
    revoked: false
  };
  _store.unshift(item);
  return item;
}

export function verifyCredential({ credentialId, payloadHash }) {
  const target = _store.find(c => c.id === credentialId);
  if (!target) return { verified: false, reason: 'NOT_FOUND' };
  // Basic hash presence check (could compare if provided)
  if (payloadHash && target.payloadHash !== payloadHash) {
    return { verified: false, reason: 'HASH_MISMATCH' };
  }
  target.verified = true;
  return { verified: true };
}

export function revokeCredential({ credentialId }) {
  const target = _store.find(c => c.id === credentialId);
  if (!target) return { revoked: false, reason: 'NOT_FOUND' };
  target.revoked = true;
  target.verified = false;
  return { revoked: true };
}

export function listCredentials({ learnerId }) {
  return _store.filter(c => c.learnerId === learnerId);
}

// Seed a couple of example credentials for immediate UI display
if (_store.length === 0) {
  _store.push(
    {
      id: 'cred_demo1', learnerId: 'currentUser', title: 'JavaScript Fundamentals Assessment', payloadHash: '0xjsfund', issuedAt: now()-86400000*3, verified: true, revoked: false
    },
    {
      id: 'cred_demo2', learnerId: 'currentUser', title: 'Data Structures Quiz', payloadHash: '0xdsquiz', issuedAt: now()-86400000*10, verified: false, revoked: false
    }
  );
}
