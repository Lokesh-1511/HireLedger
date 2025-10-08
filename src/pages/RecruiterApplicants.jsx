import React, { useState, useMemo } from 'react';
import '../styles/pages/RecruiterApplicants.css';
import { useRecruiterData } from '../context/RecruiterDataContext.jsx';
import { db } from '../firebase.js';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../context/ToastContext.jsx';

/*
  RecruiterApplicants
  -------------------
  Applicant listing with filters and bulk messaging modal.
  TODO(API): Server-side filtering & pagination.
  TODO(SEARCH): Debounced search on name/email.
  TODO(PERF): Virtualize long lists.
  TODO(MESSAGING): Integrate rich text editor library (e.g., TipTap, Quill) and send endpoint.
*/

const PAGE_SIZE = 8;

const SKILL_FILTERS = ['React','Node','SQL','Python','Figma'];
const COLLEGES = ['Stanford','MIT','IIT Delhi','CMU','UCLA'];
const LOCATIONS = ['NY','SF','Remote','Austin','Seattle'];

const STATUSES = ['applied','screening','interview','offer','hired','rejected','withdrawn'];
const PROGRESSION = ['applied','screening','interview','offer','hired'];

export default function RecruiterApplicants() {
  const { applicants, updateApplicantStatus, bulkMessage, applicantProfiles, jobs } = useRecruiterData();
  const { push } = useToast();
  const [page, setPage] = useState(1);
  const [skill, setSkill] = useState('');
  const [college, setCollege] = useState('');
  const [location, setLocation] = useState('');
  const [selected, setSelected] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('<p>Hello candidates,</p><p>We will reach out shortly.</p>');
  const [statusEdit, setStatusEdit] = useState(null); // applicant id currently editing status

  // Normalize raw application docs (which may not contain applicant profile fields) into display-friendly objects
  const jobMap = useMemo(() => new Map((jobs||[]).map(j=>[j.id,j])), [jobs]);
  const normalized = useMemo(() => {
    return applicants.map(a => {
      const profileBundle = applicantProfiles[a.studentId] || {};
      const user = profileBundle.user || {};
      const profile = profileBundle.profile || {};
      const skillsArr = profile.skills || user.skills || [];
      const job = jobMap.get(a.jobId);
      return {
        id: a.id,
        name: user.displayName || user.name || profile.fullName || a.studentId || 'Applicant',
        college: profile.college || user.college || '',
        location: profile.location || user.location || '',
        skills: skillsArr,
        status: a.status || 'applied',
        jobTitle: job?.title || '—',
        raw: a,
      };
    });
  }, [applicants, applicantProfiles, jobMap]);

  const filtered = useMemo(() => {
    return normalized.filter(a => {
      if (skill && !(a.skills || []).includes(skill)) return false;
      if (college && a.college !== college) return false;
      if (location && a.location !== location) return false;
      return true;
    });
  }, [normalized, skill, college, location]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  function toggleSelect(id) {
    setSelected(sel => sel.includes(id) ? sel.filter(x=>x!==id) : [...sel, id]);
  }
  function toggleAll() {
    const visibleIds = pageItems.map(a=>a.id);
    const allSelected = visibleIds.every(id => selected.includes(id));
    if (allSelected) setSelected(sel => sel.filter(id => !visibleIds.includes(id)));
    else setSelected(sel => Array.from(new Set([...sel, ...visibleIds])));
  }

  function openBulk() { if (selected.length) setShowModal(true); }
  function sendBulk() {
    bulkMessage(selected, message);
    push('Message queued for ' + selected.length + ' applicants.', { type: 'success' });
    setShowModal(false);
  }

  function beginStatusEdit(id) { setStatusEdit(id); }
  function changeStatus(id, newStatus) {
    updateApplicantStatus(id, newStatus);
    push('Status updated to ' + newStatus, { type: 'info' });
    setStatusEdit(null);
  }

  return (
    <div className="recruiter-applicants-layout">
      <header className="surface applicants-head">
        <h1>Applicants</h1>
        <p className="muted small">Filter and manage candidates (static data).</p>
      </header>

      <div className="recruiter-filters-bar">
        <div className="filter-group">
          <label>Skill
            <select value={skill} onChange={e=>{ setPage(1); setSkill(e.target.value); }}>
              <option value="">All</option>
              {SKILL_FILTERS.map(s=> <option key={s}>{s}</option>)}
            </select>
          </label>
          <label>College
            <select value={college} onChange={e=>{ setPage(1); setCollege(e.target.value); }}>
              <option value="">All</option>
              {COLLEGES.map(c=> <option key={c}>{c}</option>)}
            </select>
          </label>
          <label>Location
            <select value={location} onChange={e=>{ setPage(1); setLocation(e.target.value); }}>
              <option value="">All</option>
              {LOCATIONS.map(l=> <option key={l}>{l}</option>)}
            </select>
          </label>
        </div>
        <div className="bulk-actions">
          <button className="btn-secondary" disabled={!selected.length} onClick={openBulk}>Bulk Message ({selected.length})</button>
        </div>
      </div>

      <div className="recruiter-applicants-table-wrapper" role="region" aria-label="Applicants table">
        <table className="recruiter-applicants-table">
          <thead>
            <tr>
              <th><input type="checkbox" aria-label="Select all" onChange={toggleAll} checked={pageItems.length>0 && pageItems.every(i=>selected.includes(i.id))} /></th>
              <th>Name</th>
              <th>Job</th>
              <th>College</th>
              <th>Location</th>
              <th>Skills</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map(a => (
              <tr key={a.id} className={selected.includes(a.id) ? 'row-selected' : ''}>
                <td><input type="checkbox" aria-label={'Select '+a.name} checked={selected.includes(a.id)} onChange={()=>toggleSelect(a.id)} /></td>
                <td>{a.name}</td>
                <td>{a.jobTitle}</td>
                <td>{a.college}</td>
                <td>{a.location}</td>
                <td>{(a.skills && a.skills.length) ? a.skills.join(', ') : <span className="muted">—</span>}</td>
                <td>
                  {statusEdit === a.id ? (
                    <select
                      autoFocus
                      value={a.status}
                      onChange={e=>changeStatus(a.id, e.target.value)}
                      onBlur={()=>setStatusEdit(null)}
                      style={{ fontSize: '.65rem' }}
                    >
                      {STATUSES.map(s=> <option key={s}>{s}</option>)}
                    </select>
                  ) : (
                    <div style={{display:'flex', gap:'.35rem', alignItems:'center'}}>
                      <button className="btn-ghost" style={{ fontSize: '.65rem', padding: '.25rem .45rem' }} onClick={()=>beginStatusEdit(a.id)}>{a.status}</button>
                      {/* Advance button */}
                      {(() => {
                        const idx = PROGRESSION.indexOf(a.status);
                        const canAdvance = idx > -1 && idx < PROGRESSION.length -1;
                        if (!canAdvance) return null;
                        const next = PROGRESSION[idx+1];
                        async function advance() {
                          await updateApplicantStatus(a.raw.id, next);
                          const sid = a.raw.studentId;
                          // Student notification
                          if (sid) {
                            await addDoc(collection(db, 'users', sid, 'notifications'), {
                              title: 'Application advanced',
                              message: `Your application moved to ${next}.`,
                              type: 'status',
                              senderId: (await import('../context/AuthContext.jsx')).useAuth?.().user?.uid || null,
                              createdAt: serverTimestamp(),
                              read: false
                            });
                          }
                          // Recruiter self notification for Sent tab
                          const authMod = await import('../context/AuthContext.jsx');
                          const authCtx = authMod.useAuth?.();
                          if (authCtx?.user?.uid) {
                            await addDoc(collection(db, 'users', authCtx.user.uid, 'notifications'), {
                              title: 'Application advanced',
                              message: `Advanced application to ${next}.`,
                              type: 'sent-status',
                              createdAt: serverTimestamp(),
                              read: false
                            });
                          }
                        }
                        return <button className="btn-secondary" style={{ fontSize: '.55rem', padding: '.2rem .4rem' }} onClick={advance} aria-label={`Advance to ${next}`}>➜ {next}</button>;
                      })()}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={6} className="empty">No applicants match filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

  <div className="pagination" role="navigation" aria-label="Pagination">
        <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="btn-ghost">Prev</button>
        <span className="page-status">Page {page} / {totalPages || 1}</span>
        <button disabled={page===totalPages || totalPages===0} onClick={()=>setPage(p=>p+1)} className="btn-ghost">Next</button>
      </div>

      {showModal && (
        <div className="recruiter-message-modal" role="dialog" aria-modal="true" aria-label="Bulk messaging">
          <div className="recruiter-message-dialog">
            <header>
              <h2>Bulk Message ({selected.length})</h2>
              <button onClick={()=>setShowModal(false)} className="icon-btn" aria-label="Close">✕</button>
            </header>
            <div>
              <div
                className="rte-placeholder"
                contentEditable
                suppressContentEditableWarning
                onInput={e=>setMessage(e.currentTarget.innerHTML)}
                dangerouslySetInnerHTML={{ __html: message }}
                aria-label="Message body"
              />
              <p className="muted small">Rich text editor placeholder. TODO: integrate real editor + template variables.</p>
            </div>
            <footer>
              <button className="btn-primary" onClick={sendBulk}>Send</button>
              <button className="btn-ghost" onClick={()=>setShowModal(false)}>Cancel</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
