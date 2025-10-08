import React, { useState, useMemo } from 'react';
import '../styles/pages/AdminInstitutions.css';
import { AdminConsole } from '../components/layout/AdminConsole.jsx';
import { useAdminData } from '../context/AdminDataContext.jsx';

/*
  AdminInstitutions Page
  ----------------------
  Verification management of institutions (mock only).
  TODO(API): Fetch institutions with status & metadata.
  TODO(API): Approve / reject institution.
  TODO(SEARCH): Search by name or domain.
*/

export default function AdminInstitutions() {
  const { institutions, updateInstitutionStatus, createInstitution, loading } = useAdminData();
  const [status, setStatus] = useState('');
  const normalized = useMemo(() => institutions.map(i => ({
    id: i.id,
    name: i.name || i.displayName || 'Institution',
    domain: i.domain || i.website || '—',
    status: i.status || 'Pending',
    contacts: Array.isArray(i.contacts) ? i.contacts.length : (i.contactsCount || 0)
  })), [institutions]);
  const filtered = useMemo(()=> normalized.filter(i => !status || i.status === status), [status, normalized]);

  const metrics = useMemo(() => {
    const total = normalized.length;
    const pending = normalized.filter(i => i.status === 'Pending').length;
    const verified = normalized.filter(i => i.status === 'Verified').length;
    const rejected = normalized.filter(i => i.status === 'Rejected').length;
    return [
      { label: 'Institutions', value: total, delta: `${verified} verified` },
      { label: 'Pending Review', value: pending, delta: 'Prioritize today', tone: pending ? 'alert' : undefined },
      { label: 'Verified Partners', value: verified, delta: '+5 this month', tone: 'success' },
      { label: 'Rejected Cases', value: rejected, delta: 'Audit quarterly' }
    ];
  }, [normalized]);

  const toolbar = (
    <>
      <label className="small">Status
        <select value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="">All</option>
          <option>Pending</option>
          <option>Verified</option>
          <option>Rejected</option>
        </select>
      </label>
      <button type="button" className="btn-secondary" onClick={()=>createInstitution({ name: 'New Institution', domain: 'new.edu' })}>Add Institution</button>
    </>
  );

  async function approve(inst) { await updateInstitutionStatus(inst.id, 'Verified'); }
  async function reject(inst) { await updateInstitutionStatus(inst.id, 'Rejected'); }

  return (
    <AdminConsole
      title="Institution Verification"
      description="Vet academic partners, monitor verification SLAs, and maintain trusted recruitment relationships."
      metrics={metrics}
      toolbar={toolbar}
    >
      <section className="admin-card" aria-label="Institutions list">
        <div className="inst-grid">
          {loading && <div className="admin-empty">Loading...</div>}
          {!loading && filtered.map(inst => (
            <article key={inst.id} className="inst-card" role="group" aria-label={inst.name}>
              <div className="inst-head-row">
                <h2 className="inst-name">{inst.name}</h2>
                <span className={`badge ${statusBadge(inst.status)}`}>{inst.status}</span>
              </div>
              <p className="inst-domain">{inst.domain}</p>
              <div className="inst-meta">
                <span><strong>{inst.contacts}</strong> primary contacts</span>
              </div>
              <div className="inst-actions">
                {inst.status === 'Pending' && (
                  <>
                    <button className="btn-primary" onClick={()=>approve(inst)}>Approve</button>
                    <button className="btn-ghost" onClick={()=>reject(inst)}>Reject</button>
                  </>
                )}
                {inst.status === 'Verified' && <button className="btn-secondary" onClick={()=>updateInstitutionStatus(inst.id,'Pending')}>Revoke</button>}
                {inst.status === 'Rejected' && <button className="btn-secondary" onClick={()=>updateInstitutionStatus(inst.id,'Pending')}>Reopen</button>}
              </div>
            </article>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="admin-empty">No institutions match filter.</div>
          )}
        </div>
      </section>
    </AdminConsole>
  );
}

function statusBadge(status) {
  if (status === 'Verified') return 'badge-success';
  if (status === 'Rejected') return 'badge-danger';
  return 'badge-warning';
}
