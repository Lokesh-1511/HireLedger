import React, { useState, useMemo } from 'react';
import '../styles/pages/AdminAudit.css';
import { AdminConsole } from '../components/layout/AdminConsole.jsx';
import { useAdminData } from '../context/AdminDataContext.jsx';

/*
  AdminAudit Page
  ---------------
  Audit log table with filters and export placeholder.
  TODO(API): Server-side filtering (date range, actor, action type, resource).
  TODO(EXPORT): Stream CSV export (consider background job + email link for large sets).
  TODO(SECURITY): Ensure tamper-proof log storage (append-only, hashing / chain).
*/

const ACTIONS = ['login','approve-user','reject-user','create-job','update-job','delete-job','assign-role','revoke-role','approve-institution','reject-institution','create-institution','update-institution'];

export default function AdminAudit() {
  const { auditLogs, loading } = useAdminData();
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const normalized = useMemo(() => auditLogs.map(l => ({
    id: l.id,
    ts: l.createdAt?.toMillis ? l.createdAt.toMillis() : (l.createdAt?._seconds ? l.createdAt._seconds * 1000 : l.createdAt || Date.now()),
    actor: l.actorId || l.actor || 'system',
    action: l.action || 'unknown',
    resource: l.resource || 'unknown',
    meta: l.meta || ''
  })), [auditLogs]);
  const filtered = useMemo(()=> normalized.filter(l => (!actionFilter || l.action === actionFilter) && (!resourceFilter || l.resource === resourceFilter)), [actionFilter, resourceFilter, normalized]);

  const metrics = useMemo(() => {
    const total = normalized.length;
    const last24 = normalized.filter(l => l.ts >= Date.now() - 86_400_000).length;
    const uniqueActors = new Set(normalized.map(l => l.actor)).size;
    const critical = normalized.filter(l => ['delete-job','revoke-role'].includes(l.action)).length;
    return [
      { label: 'Total Events', value: total, delta: `${last24} in last 24h` },
      { label: 'Unique Actors', value: uniqueActors, delta: 'Active user footprint' },
      { label: 'Critical Actions', value: critical, delta: 'Monitor high-risk activity', tone: critical ? 'alert' : undefined },
      { label: 'Exports', value: 'CSV', delta: 'Manual trigger' }
    ];
  }, [normalized]);

  const toolbar = (
    <>
      <label className="small">Action
        <select value={actionFilter} onChange={e=>setActionFilter(e.target.value)}>
          <option value="">All</option>
          {ACTIONS.map(a => <option key={a}>{a}</option>)}
        </select>
      </label>
      <label className="small">Resource
        <select value={resourceFilter} onChange={e=>setResourceFilter(e.target.value)}>
          <option value="">All</option>
          <option>job</option>
          <option>user</option>
          <option>institution</option>
          <option>credential</option>
        </select>
      </label>
      <button className="btn-secondary" onClick={exportCsv}>Export</button>
    </>
  );

  function exportCsv() {
    // Minimal mock export
    const header = 'id,timestamp,actor,action,resource,meta\n';
  const rows = filtered.slice(0,50).map(l => `${l.id},${new Date(l.ts).toISOString()},${l.actor},${l.action},${l.resource},${l.meta.replace(/,/g,';')}`);
    const blob = new Blob([header + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'audit-export.csv'; a.click();
    URL.revokeObjectURL(url);
    // TODO(EXPORT): Replace with server-side generated export inclusive of full dataset & access controls
  }

  return (
    <AdminConsole
      title="Audit Logs"
      description="Trace every administrative change with immutable logging and exportable evidence for compliance audits."
      metrics={metrics}
      toolbar={toolbar}
    >
      <section className="admin-card" role="region" aria-label="Audit log table">
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col">Time</th>
              <th scope="col">Actor</th>
              <th scope="col">Action</th>
              <th scope="col">Resource</th>
              <th scope="col">Meta</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="admin-empty">Loading...</td></tr>
            )}
            {!loading && filtered.slice(0,80).map(l => (
              <tr key={l.id}>
                <td data-label="Time">
                  <div className="cell-primary">{new Date(l.ts).toLocaleString()}</div>
                </td>
                <td data-label="Actor">{l.actor}</td>
                <td data-label="Action">
                  <span className={`badge ${['delete-job','revoke-role'].includes(l.action) ? 'badge-danger' : 'badge-neutral'}`}>{l.action}</span>
                </td>
                <td data-label="Resource">{l.resource}</td>
                <td data-label="Meta">{l.meta}</td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-empty">No logs match filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </AdminConsole>
  );
}
