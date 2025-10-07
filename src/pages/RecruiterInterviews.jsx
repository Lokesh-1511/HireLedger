import React, { useMemo, useState } from 'react';
import '../styles/pages/RecruiterInterviews.css';
import { useRecruiterData } from '../context/RecruiterDataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

/*
  RecruiterInterviews
  -------------------
  Calendar UI (mock) with week/month toggle, draggable interview slots, and invite modal.
  NOTE: True drag and drop libraries (e.g., dnd-kit) not integrated; using basic pointer handlers for placeholder.
  TODO(API): Fetch interviews for date range.
  TODO(API): Persist created/updated interview slot.
  TODO(INVITES): Trigger email/calendar invites (ICS generation) on confirmation.
  TODO(TIMEZONES): Normalize to recruiter timezone; show candidate local time tooltip.
  TODO(REALTIME): Subscribe to updates via WebSocket for collaborative scheduling.
*/

const DAYS = ['Mon','Tue','Wed','Thu','Fri'];

export default function RecruiterInterviews() {
  const [view, setView] = useState('week'); // 'week' | 'month'
  const { interviews, scheduleInterview, updateInterview } = useRecruiterData();
  const [draggingId, setDraggingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newSlot, setNewSlot] = useState({ title: '', candidate: '', day: 1, start: '09:00', end: '09:30' });
  const { push } = useToast();

  function onDragStart(id) { setDraggingId(id); }
  function onDragEnd(day) {
    if (!draggingId) return;
    updateInterview(draggingId, { day });
    push('Interview moved.', { type: 'info' });
    setDraggingId(null);
  }

  function createSlot(e) {
    e.preventDefault();
    // In month view allow user to enter explicit date (ISO) by reusing day field if it matches pattern YYYY-MM-DD
    const slot = { ...newSlot };
    if (view === 'month' && /\d{4}-\d{2}-\d{2}/.test(newSlot.day)) {
      slot.date = newSlot.day; // overloaded day input acts as date string
      // derive weekday number (Mon=1) for consistency if needed
      const dObj = new Date(newSlot.day + 'T00:00:00');
      const weekday = dObj.getDay(); // 0 Sun
      slot.day = ((weekday + 6) % 7) + 1; // convert to 1..7 with Mon=1 (Fri=5 etc.) still stored limited to 1..7
    }
    scheduleInterview(slot);
    push('Interview scheduled.', { type: 'success' });
    setShowModal(false);
  }

  // Month view calculations
  const monthModel = useMemo(() => {
    if (view !== 'month') return null;
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const daysInMonth = last.getDate();
    const startWeekday = first.getDay(); // 0 Sun
    const cells = [];
    // Leading blanks
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    // Pad to complete weeks (multiples of 7)
    while (cells.length % 7 !== 0) cells.push(null);
    // Aggregate interviews by date (using interview.date; fallback approximate using weekday distribution)
    const byDate = new Map();
    interviews.forEach(iv => {
      if (iv.date) {
        byDate.set(iv.date, [...(byDate.get(iv.date) || []), iv]);
      } else {
        // Fallback: map to nearest upcoming day this month
        const targetWeekday = iv.day || 1; // 1..7 Mon..Sun (approx stored) but our week uses 0..6 Sun..Sat
        // Find first date in month whose getDay matches conversion back
        for (let d = 1; d <= daysInMonth; d++) {
          const dateObj = new Date(year, month, d);
            const calWd = dateObj.getDay();
            const monBased = ((calWd + 6) % 7) + 1; // convert to 1..7 Mon=1
            if (monBased === targetWeekday) {
              const iso = dateObj.toISOString().slice(0,10);
              byDate.set(iso, [...(byDate.get(iso) || []), iv]);
              break;
            }
        }
      }
    });
    return { cells, year, month, byDate };
  }, [view, interviews]);

  return (
    <div className="recruiter-interviews-grid">
      <header className="surface inter-head">
        <h1>Interview Scheduler</h1>
        <div className="row gap-sm">
          <div className="view-toggle" role="tablist" aria-label="Calendar view switch">
            {['week','month'].map(v => (
              <button key={v} role="tab" aria-selected={view===v} className={"toggle-btn" + (view===v ? ' active' : '')} onClick={()=>setView(v)}>{v}</button>
            ))}
          </div>
          <button className="btn-primary" onClick={()=>setShowModal(true)}>New Interview</button>
        </div>
      </header>

      {view === 'week' && (
        <div className="recruiter-calendar-wrapper" role="grid" aria-label="Week schedule">
          <div className="cal-head" role="row">
            <div className="time-col" />
            {DAYS.map((d,i) => <div key={d} role="columnheader" className="day-head" onDragOver={e=>e.preventDefault()} onDrop={()=>onDragEnd(i+1)}>{d}</div>)}
          </div>
          <div className="recruiter-calendar-grid">
            {interviews.map(slot => (
              <div
                key={slot.id}
                className={"recruiter-calendar-day" + (draggingId===slot.id ? ' dragging' : '')}
                draggable
                aria-grabbed={draggingId===slot.id}
                onDragStart={()=>onDragStart(slot.id)}
                onDragEnd={()=>setDraggingId(null)}
                style={{ gridColumn: slot.day + 1 }}
                title={slot.candidate}
              >
                <strong>{slot.title}</strong>
                <span className="slot-time">{slot.start} - {slot.end}</span>
                <span className="slot-cand">{slot.candidate}</span>
              </div>
            ))}
            {/* Drop zones (visual columns) */}
            {DAYS.map((_,i)=>(
              <div
                key={i}
                className="drop-col"
                style={{ gridColumn: i + 2 }}
                onDragOver={e=>e.preventDefault()}
                onDrop={()=>onDragEnd(i+1)}
                aria-hidden
              />
            ))}
          </div>
        </div>
      )}

      {view === 'month' && monthModel && (
        <div className="month-grid surface" aria-label="Month schedule" role="grid">
          <div className="month-head" role="row">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="mh-cell" role="columnheader">{d}</div>)}
          </div>
          <div className="month-body">
            {monthModel.cells.map((dateObj, idx) => {
              if (!dateObj) return <div key={idx} className="m-cell empty" role="gridcell" aria-disabled="true" />;
              const iso = dateObj.toISOString().slice(0,10);
              const day = dateObj.getDate();
              const dayInterviews = monthModel.byDate.get(iso) || [];
              return (
                <div key={iso} className={"m-cell" + (dayInterviews.length ? ' has-items' : '')} role="gridcell" aria-label={`Day ${day} with ${dayInterviews.length} interviews`}>
                  <div className="m-cell-date">{day}</div>
                  {dayInterviews.length > 0 && (
                    <ul className="m-cell-list">
                      {dayInterviews.slice(0,3).map(iv => (
                        <li key={iv.id} className="m-pill" title={iv.candidate}>{iv.title}</li>
                      ))}
                      {dayInterviews.length > 3 && <li className="m-more">+{dayInterviews.length - 3} more</li>}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showModal && (
        <div className="recruiter-message-modal" role="dialog" aria-modal="true" aria-label="Create interview slot">
          <div className="recruiter-message-dialog">
            <header>
              <h2>New Interview</h2>
              <button className="icon-btn" aria-label="Close" onClick={()=>setShowModal(false)}>✕</button>
            </header>
            <form onSubmit={createSlot} className="col gap-sm">
              <label className="field">Title
                <input required value={newSlot.title} onChange={e=>setNewSlot(s=>({...s,title:e.target.value}))} />
              </label>
              <label className="field">Candidate
                <input required value={newSlot.candidate} onChange={e=>setNewSlot(s=>({...s,candidate:e.target.value}))} />
              </label>
              {view === 'week' && (
                <label className="field">Day
                  <select value={newSlot.day} onChange={e=>setNewSlot(s=>({...s,day:Number(e.target.value)}))}>{DAYS.map((d,i)=><option key={d} value={i+1}>{d}</option>)}</select>
                </label>
              )}
              {view === 'month' && (
                <label className="field">Date
                  <input type="date" value={/\d{4}-\d{2}-\d{2}/.test(newSlot.day)? newSlot.day : ''} onChange={e=>setNewSlot(s=>({...s,day:e.target.value}))} required />
                </label>
              )}
              <div className="row gap-sm">
                <label className="field grow">Start
                  <input type="time" value={newSlot.start} onChange={e=>setNewSlot(s=>({...s,start:e.target.value}))} />
                </label>
                <label className="field grow">End
                  <input type="time" value={newSlot.end} onChange={e=>setNewSlot(s=>({...s,end:e.target.value}))} />
                </label>
              </div>
              <footer>
                <button type="submit" className="btn-primary">Create</button>
                <button type="button" className="btn-ghost" onClick={()=>setShowModal(false)}>Cancel</button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
