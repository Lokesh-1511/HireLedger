import React, { useState } from 'react';
import '../styles/pages/RecruiterJobPost.css';
import { useRecruiterData } from '../context/RecruiterDataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

/*
  RecruiterJobPost
  -----------------
  Multi-section job posting form (static state only).
  TODO(API): Persist new job to backend, return job ID.
  TODO(VALIDATION): Server-side validation & sanitization for rich text fields.
  TODO(WORKFLOW): Draft autosave logic.
*/

const INITIAL = {
  title: '',
  department: '', // stored inside meta later
  type: 'Full-time',
  mode: 'On-site', // stored inside meta
  location: '',
  salaryMin: '', // form only
  salaryMax: '', // form only
  currency: 'USD', // meta
  description: '',
  requirements: '', // meta
  skillsRequired: [],
  tagsInput: ''
};

const TYPES = ['Full-time','Internship','Part-time','Contract'];
const MODES = ['On-site','Hybrid','Remote'];

export default function RecruiterJobPost() {
  const [form, setForm] = useState(INITIAL);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', msg: string }
  const { addJob } = useRecruiterData();
  const { push } = useToast();

  function update(key, value) { setForm(f => ({ ...f, [key]: value })); }

  function addSkill(e) {
    e.preventDefault();
    const skill = form.tagsInput.trim();
    if (!skill || form.skillsRequired.includes(skill)) return;
    update('skillsRequired', [...form.skillsRequired, skill]);
    update('tagsInput', '');
  }
  function removeSkill(s) { update('skillsRequired', form.skillsRequired.filter(k => k !== s)); }

  function submit(e) {
    e.preventDefault();
    // Basic client-side checks
    if (!form.title || !form.location) {
      setStatus({ type: 'error', msg: 'Title and location required.' });
      return;
    }
    const salaryRange = form.salaryMin && form.salaryMax ? `${form.salaryMin}-${form.salaryMax}` : undefined;
    const draft = {
      title: form.title,
      description: form.description,
      type: form.type,
      location: form.location,
      skillsRequired: form.skillsRequired,
      // extra meta fields preserved for future use
      department: form.department || undefined,
      mode: form.mode || undefined,
      requirements: form.requirements || undefined,
      currency: form.currency || undefined,
      salaryRange,
    };
    addJob(draft);
    setStatus({ type: 'success', msg: 'Job draft saved locally.' });
    push('Job draft created: ' + form.title, { type: 'success' });
    setForm(INITIAL);
  }

  return (
    <div className="recruiter-jobpost-page">
      <header className="surface form-head">
        <h1>Post a Job</h1>
        <p className="muted small">Fill required information to create a posting.</p>
      </header>
      <form onSubmit={submit} className="recruiter-jobpost-form" aria-describedby="jobFormHelp">
  <div id="jobFormHelp" className="visually-hidden">Jobs persist locally in your browser until cleared.</div>
        <section className="recruiter-jobpost-section">
          <h2>Basics</h2>
          <div className="recruiter-field-grid">
            <label className="field">Title
              <input value={form.title} onChange={e=>update('title', e.target.value)} required />
            </label>
            <label className="field">Department
              <input value={form.department} onChange={e=>update('department', e.target.value)} />
            </label>
            <label className="field">Type
              <select value={form.type} onChange={e=>update('type', e.target.value)}>{TYPES.map(t=> <option key={t}>{t}</option>)}</select>
            </label>
            <label className="field">Work Mode
              <select value={form.mode} onChange={e=>update('mode', e.target.value)}>{MODES.map(m=> <option key={m}>{m}</option>)}</select>
            </label>
            <label className="field">Location
              <input value={form.location} onChange={e=>update('location', e.target.value)} required />
            </label>
            <div className="field salary-range">
              <span>Salary Range</span>
              <div className="row gap-sm">
                <input placeholder="Min" value={form.salaryMin} onChange={e=>update('salaryMin', e.target.value)} />
                <input placeholder="Max" value={form.salaryMax} onChange={e=>update('salaryMax', e.target.value)} />
                <select value={form.currency} onChange={e=>update('currency', e.target.value)}>
                  <option>USD</option><option>EUR</option><option>INR</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="recruiter-jobpost-section">
          <h2>Description</h2>
          <label className="field">Role Summary
            <textarea rows={4} value={form.description} onChange={e=>update('description', e.target.value)} />
          </label>
          <label className="field">Requirements
            <textarea rows={4} value={form.requirements} onChange={e=>update('requirements', e.target.value)} />
          </label>
        </section>

        <section className="recruiter-jobpost-section">
          <h2>Skills / Tags</h2>
          <form onSubmit={addSkill} className="inline-form" aria-label="Add skill tag">
            <input placeholder="Add a skill" value={form.tagsInput} onChange={e=>update('tagsInput', e.target.value)} />
            <button onClick={addSkill} className="btn-secondary" type="button">Add</button>
          </form>
          <div className="skill-badges">
            {form.skillsRequired.map(s => <span key={s} className="tag-removable" onClick={()=>removeSkill(s)}>{s} ✕</span>)}
            {form.skillsRequired.length === 0 && <span className="muted small">No skills added yet.</span>}
          </div>
        </section>

        <div className="recruiter-jobpost-actions">
          <button type="submit" className="btn-primary">Save Draft</button>
          <button type="button" onClick={()=>setForm(INITIAL)} className="btn-ghost">Reset</button>
          {status && <span className={"status-msg " + status.type}>{status.msg}</span>}
        </div>
      </form>
    </div>
  );
}
