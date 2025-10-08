import React, { useState } from 'react';
import '../styles/pages/RecruiterJobPost.css';
import { useRecruiterData } from '../context/RecruiterDataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

/*
  RecruiterJobPost
  -----------------
  Multi-section job posting form.
  Now persists to Firestore via addJob (draft or publish).
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
  const [status, setStatus] = useState(null); // { type: 'success'|'error'|'info', msg: string }
  const [submitting, setSubmitting] = useState(false);
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

  async function handleSubmit(e, publish = false) {
    e.preventDefault();
    if (submitting) return;
    if (!form.title || !form.location) {
      setStatus({ type: 'error', msg: 'Title and location required.' });
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      const salaryRange = form.salaryMin && form.salaryMax ? `${form.salaryMin}-${form.salaryMax}` : undefined;
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        location: form.location.trim(),
        skillsRequired: form.skillsRequired,
        department: form.department || undefined,
        mode: form.mode || undefined,
        requirements: form.requirements || undefined,
        currency: form.currency || undefined,
        salaryRange,
      };
      const id = await addJob(payload, { publish });
      if (publish) {
        setStatus({ type: 'success', msg: 'Job published successfully.' });
        push('Job published', { type: 'success' });
      } else {
        setStatus({ type: 'success', msg: 'Draft saved.' });
        push('Job draft saved', { type: 'success' });
      }
      setForm(INITIAL);
    } catch (err) {
      console.error('Job submit failed', err);
      setStatus({ type: 'error', msg: 'Failed to save job. See console.' });
      push('Job save failed', { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="recruiter-jobpost-page">
      <header className="surface form-head">
        <h1>Post a Job</h1>
        <p className="muted small">Fill required information to create a posting.</p>
      </header>
      <form onSubmit={(e)=>handleSubmit(e,false)} className="recruiter-jobpost-form" aria-describedby="jobFormHelp">
  <div id="jobFormHelp" className="visually-hidden">Jobs saved as draft unless Publish is used. Drafts are hidden from students until published.</div>
        <section className="recruiter-jobpost-section">
          <h2>Basics</h2>
          <div className="recruiter-field-grid">
            <label className="field">Title
              <input value={form.title} onChange={e=>update('title', e.target.value)} required disabled={submitting} />
            </label>
            <label className="field">Department
              <input value={form.department} onChange={e=>update('department', e.target.value)} disabled={submitting} />
            </label>
            <label className="field">Type
              <select value={form.type} onChange={e=>update('type', e.target.value)} disabled={submitting}>{TYPES.map(t=> <option key={t}>{t}</option>)}</select>
            </label>
            <label className="field">Work Mode
              <select value={form.mode} onChange={e=>update('mode', e.target.value)} disabled={submitting}>{MODES.map(m=> <option key={m}>{m}</option>)}</select>
            </label>
            <label className="field">Location
              <input value={form.location} onChange={e=>update('location', e.target.value)} required disabled={submitting} />
            </label>
            <div className="field salary-range">
              <span>Salary Range</span>
              <div className="row gap-sm">
                <input placeholder="Min" value={form.salaryMin} onChange={e=>update('salaryMin', e.target.value)} disabled={submitting} />
                <input placeholder="Max" value={form.salaryMax} onChange={e=>update('salaryMax', e.target.value)} disabled={submitting} />
                <select value={form.currency} onChange={e=>update('currency', e.target.value)} disabled={submitting}>
                  <option>USD</option><option>EUR</option><option>INR</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="recruiter-jobpost-section">
          <h2>Description</h2>
          <label className="field">Role Summary
            <textarea rows={4} value={form.description} onChange={e=>update('description', e.target.value)} disabled={submitting} />
          </label>
          <label className="field">Requirements
            <textarea rows={4} value={form.requirements} onChange={e=>update('requirements', e.target.value)} disabled={submitting} />
          </label>
        </section>

        <section className="recruiter-jobpost-section">
          <h2>Skills / Tags</h2>
          <div className="inline-form" aria-label="Add skill tag">
            <input placeholder="Add a skill" value={form.tagsInput} onChange={e=>update('tagsInput', e.target.value)} disabled={submitting} />
            <button onClick={addSkill} className="btn-secondary" type="button" disabled={submitting}>Add</button>
          </div>
          <div className="skill-badges">
            {form.skillsRequired.map(s => <span key={s} className="tag-removable" onClick={()=>!submitting && removeSkill(s)}>{s} ✕</span>)}
            {form.skillsRequired.length === 0 && <span className="muted small">No skills added yet.</span>}
          </div>
        </section>

        <div className="recruiter-jobpost-actions">
          <button type="submit" className="btn-secondary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Draft'}</button>
          <button type="button" className="btn-primary" disabled={submitting} onClick={(e)=>handleSubmit(e,true)}>{submitting ? 'Publishing...' : 'Publish'}</button>
          <button type="button" onClick={()=>!submitting && setForm(INITIAL)} className="btn-ghost" disabled={submitting}>Reset</button>
          {status && <span className={"status-msg " + status.type}>{status.msg}</span>}
        </div>
      </form>
    </div>
  );
}
