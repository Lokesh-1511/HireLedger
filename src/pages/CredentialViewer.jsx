import React, { useEffect } from 'react';
import '../styles/pages/CredentialViewer.css';
import useCertificateVerification from '../hooks/useCertificateVerification';

/*
  CredentialViewer Page
  ---------------------
  Displays list of certificates / credentials with status badges.
  Notes / Future Integrations:
    - TODO(API): Fetch user credential list with pagination
    - TODO(BLOCKCHAIN): Each credential may include on-chain transaction hash; provide verification link
    - TODO(API): Endpoint to refresh verification status (re-query issuing authority / blockchain)
    - TODO(UX): Add filters (Verified, Pending, Expired), search bar
    - TODO(SECURITY): Signed download URLs for certificate PDFs
*/

// The initial list loads via the blockchain adapter (placeholder dataset).
// Later, this can merge with Firestore metadata if needed.

function deriveStatus(c) {
  if (c.revoked) return 'Revoked';
  if (c.verified) return 'Verified';
  return 'Pending';
}

function Status({ status }) {
  const color = status === 'Verified' ? 'var(--success-500, #16a34a)' : 'var(--warn-500, #d97706)';
  return <span className="cred-badge" style={{ '--cred-color': color }}>{status}</span>;
}

export default function CredentialViewer() {
  const learnerId = 'currentUser'; // TODO: replace with real auth uid
  const { credentials, loading, error, verify, refreshList } = useCertificateVerification();

  useEffect(() => { refreshList(learnerId); }, [learnerId, refreshList]);

  return (
    <div className="credential-page">
      <header className="cred-head">
        <h1>Credentials</h1>
        <p className="sub">Your verified achievements & assessments.</p>
      </header>
      <div className="cred-table-wrap" role="region" aria-label="Credential list">
        <table className="cred-table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Issuer</th>
              <th scope="col">Issued</th>
              <th scope="col">Status</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {credentials.map(c => {
              const status = deriveStatus(c);
              return (
                <tr key={c.id}>
                  <td data-label="Name">{c.title || c.name}</td>
                  <td data-label="Issuer">{c.issuer || 'HireLedger'}</td>
                  <td data-label="Issued">{c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : '—'}</td>
                  <td data-label="Status"><Status status={status} /></td>
                  <td data-label="Action">
                    <div className="cred-actions">
                      {status !== 'Verified' && !c.revoked && (
                        <button
                          className="btn-ghost"
                          disabled={loading}
                          onClick={() => verify({ credentialId: c.id, payload: { learnerId } })}
                        >
                          {loading ? 'Verifying...' : 'Verify'}
                        </button>
                      )}
                      <button className="btn-secondary" onClick={()=>alert('TODO: download credential PDF')}>Download</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {credentials.length === 0 && !loading && (
          <div className="empty-state">
            <p>No credentials yet.</p>
            <button className="btn-primary" onClick={()=>alert('Take an assessment first!')}>Take Assessment</button>
          </div>
        )}
        {loading && <p style={{padding:'1rem'}}>Loading credentials...</p>}
        {error && <p style={{padding:'1rem', color:'var(--error-600,#dc2626)'}}>Error loading credentials: {String(error.message || error)}</p>}
      </div>
    </div>
  );
}
