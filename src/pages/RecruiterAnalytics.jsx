import React from 'react';
import '../styles/pages/RecruiterAnalytics.css';
import { useRecruiterData } from '../context/RecruiterDataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

/*
  RecruiterAnalytics
  ------------------
  Static SVG charts + blockchain verification table.
  TODO(API): Fetch metrics & diversity aggregates.
  TODO(CHARTS): Extract reusable chart primitives (scales, tooltips).
  TODO(EXPORT): CSV/PDF export for analytics snapshot.
  TODO(BLOCKCHAIN): Real verification status fetched from chain or attestation service.
*/

// Color palette for diversity slices
const DIVERSITY_COLORS = ['#6366f1','#22c55e','#f59e0b','#64748b','#0ea5e9'];

function BarChart({ data, width=480, height=180 }) {
  const max = Math.max(...data.map(d=>d.applications));
  const barW = (width - 40) / data.length; // 20px left padding
  return (
    <svg width={width} height={height} className="bar-chart" role="img" aria-label="Applications per job">
      {data.map((d,i)=> {
        const h = (d.applications / max) * (height - 40);
        return (
          <g key={d.job} transform={`translate(${20 + i*barW}, ${height - h - 20})`}>
            <rect width={barW * .7} height={h} rx={6} className="bar" />
            <text x={barW*.35} y={-6} textAnchor="middle" className="bar-val">{d.applications}</text>
            <text x={barW*.35} y={h+14} textAnchor="middle" className="bar-label">{d.job}</text>
          </g>
        );
      })}
    </svg>
  );
}

function PieChart({ data, size=200 }) {
  const total = data.reduce((a,c)=>a+c.value,0);
  let acc = 0;
  const radius = size/2 - 10;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="pie-chart" role="img" aria-label="Diversity distribution">
      {data.map(seg => {
        const start = acc / total * Math.PI * 2;
        acc += seg.value;
        const end = acc / total * Math.PI * 2;
        const x1 = size/2 + radius * Math.sin(start);
        const y1 = size/2 - radius * Math.cos(start);
        const x2 = size/2 + radius * Math.sin(end);
        const y2 = size/2 - radius * Math.cos(end);
        const largeArc = end - start > Math.PI ? 1 : 0;
        const path = `M ${size/2} ${size/2} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        return <path key={seg.label} d={path} fill={seg.color} className="pie-seg" />;
      })}
      <circle cx={size/2} cy={size/2} r={radius*.55} fill="var(--elevate-1)" />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="pie-center">{total}</text>
    </svg>
  );
}

function StatusBadge({ status }) {
  const map = {
    'On-chain': 'var(--success-500, #16a34a)',
    'Pending': 'var(--warn-500, #d97706)',
    'Failed': 'var(--danger-500, #dc2626)'
  };
  return <span className="verif-badge" style={{ '--vb-color': map[status] || 'var(--accent-500)' }}>{status}</span>;
}

export default function RecruiterAnalytics() {
  const { applicationsPerJob, diversityBreakdown, verifications, requestVerification, markVerification } = useRecruiterData();
  const { push } = useToast();

  // Decorate diversity with colors
  const diversityData = diversityBreakdown.map((d,i)=> ({ ...d, color: DIVERSITY_COLORS[i % DIVERSITY_COLORS.length] }));

  function handleRequest(applicantId) {
    const credential = 'General Credential';
    requestVerification(applicantId, credential);
    push('Verification requested.', { type: 'info' });
  }
  function handleVerify(verificationId) {
    const fakeHash = '0x' + Math.random().toString(16).slice(2,10) + '...' + Math.random().toString(16).slice(2,6);
    markVerification(verificationId, fakeHash);
    push('Marked as on-chain.', { type: 'success' });
  }
  return (
    <div className="recruiter-analytics-layout">
      <header className="surface analytics-head">
        <h1>Analytics</h1>
        <p className="muted small">Derived from local recruiter data context.</p>
      </header>
      <section className="recruiter-analytics-grid">
        <div className="chart-block">
          <h2 className="chart-title">Applications per Job</h2>
          <BarChart data={applicationsPerJob} />
        </div>
        <div className="chart-block">
          <h2 className="chart-title">Diversity Mix</h2>
          <PieChart data={diversityData} />
          <ul className="legend" aria-label="Diversity legend">
            {diversityData.map(d => (
              <li key={d.label}><span className="swatch" style={{ background: d.color }} /> {d.label} ({d.value}%)</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="recruiter-analytics-card">
        <h2 className="h-sm">Blockchain Verification</h2>
        <table className="verif-table" aria-label="Verification statuses">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Credential</th>
              <th>Status</th>
              <th>Hash</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {verifications.map(v => (
              <tr key={v.id}>
                <td>{v.applicant}</td>
                <td>{v.credential}</td>
                <td><StatusBadge status={v.status} /></td>
                <td>{v.hash || '—'}</td>
                <td>
                  {v.status === 'Pending' && (
                    <button className="btn-secondary" onClick={()=>handleVerify(v.id)}>Mark Verified</button>
                  )}
                  {v.status === 'Failed' && (
                    <button className="btn-secondary" onClick={()=>handleRequest(v.applicantId)}>Re-request</button>
                  )}
                  {v.status === 'On-chain' && v.hash && (
                    <button className="btn-ghost" onClick={()=>push('Explorer open (mock): '+v.hash, { type: 'info' })}>View</button>
                  )}
                  {!v.hash && v.status !== 'Pending' && v.status !== 'Failed' && (
                    <button className="btn-secondary" onClick={()=>handleRequest(v.applicantId)}>Request</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
