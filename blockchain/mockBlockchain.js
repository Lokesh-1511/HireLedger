// Mock Blockchain Adapter
// Temporary stand-in so the web app can interact with a stable interface before real chain integration.

export function mockVerifyCertificate(hash) {
  return { valid: true, issuer: 'Demo University', revoked: false, hash };
}

export function mockIssueCertificate(data) {
  return { txHash: '0x123mock', certHash: '0x' + Buffer.from(JSON.stringify(data)).toString('hex').slice(0, 64) };
}

export function mockRevokeCertificate(hash) {
  return { txHash: '0x456mock', certHash: hash, revoked: true };
}
