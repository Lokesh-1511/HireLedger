import { useCallback, useState } from 'react';
import BlockchainAdapter from '../services/blockchainAdapter';

// Hook to manage credential issuance / verification / revocation flows
// Minimal internal state; can later be replaced with React Query or context.
export function useCertificateVerification(initialCredentials = []) {
  const [credentials, setCredentials] = useState(initialCredentials);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshList = useCallback(async (learnerId) => {
    setLoading(true); setError(null);
    try {
      const list = await BlockchainAdapter.listCredentials({ learnerId });
      setCredentials(list);
    } catch (e) { setError(e); } finally { setLoading(false); }
  }, []);

  const issue = useCallback(async ({ learnerId, title, payload }) => {
    setLoading(true); setError(null);
    try {
      const payloadHash = await BlockchainAdapter.hashData(JSON.stringify(payload || {}));
      const cred = await BlockchainAdapter.issueCredential({ learnerId, title, payloadHash });
      setCredentials(c => [cred, ...c]);
      return cred;
    } catch (e) { setError(e); throw e; } finally { setLoading(false); }
  }, []);

  const verify = useCallback(async ({ credentialId, payload }) => {
    setLoading(true); setError(null);
    try {
      const payloadHash = await BlockchainAdapter.hashData(JSON.stringify(payload || {}));
      const res = await BlockchainAdapter.verifyCredential({ credentialId, payloadHash });
      setCredentials(c => c.map(item => item.id === credentialId ? { ...item, verified: res.verified } : item));
      return res;
    } catch (e) { setError(e); throw e; } finally { setLoading(false); }
  }, []);

  const revoke = useCallback(async ({ credentialId }) => {
    setLoading(true); setError(null);
    try {
      await BlockchainAdapter.revokeCredential({ credentialId });
      setCredentials(c => c.map(item => item.id === credentialId ? { ...item, revoked: true } : item));
    } catch (e) { setError(e); throw e; } finally { setLoading(false); }
  }, []);

  return { credentials, loading, error, issue, verify, revoke, refreshList };
}

export default useCertificateVerification;