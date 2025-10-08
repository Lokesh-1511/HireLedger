import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useRecruiterData } from '../../context/RecruiterDataContext.jsx';
import { useStudentData } from '../../context/StudentDataContext.jsx';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase.js';

// Lightweight notification bell that merges context notifications and provides Sent/Received tabs.
// For students: only "Received" tab shown (their notifications). For recruiters: both tabs.

function useOutsideClick(ref, handler, when = true) {
  useEffect(() => {
    if (!when) return; 
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) handler(); }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [ref, handler, when]);
}

export function NotificationBell() {
  const { user } = useAuth();
  const isRecruiter = user?.role === 'recruiter';
  const { notifications: recruiterNotifications } = isRecruiter ? useRecruiterData() : { notifications: [] };
  const { notifications: studentNotifications } = user?.role === 'student' ? useStudentData() : { notifications: [] };
  const all = user?.role === 'student' ? studentNotifications : recruiterNotifications;
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('received'); // received | sent
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const panelRef = useRef(null);
  useOutsideClick(panelRef, () => setOpen(false), open);

  // Cache of user display names { uid: { name, loaded } }
  const [userNames, setUserNames] = useState({});

  // Collect senderIds and (for recruiter) potential receiver ids (not stored yet, so just sender)
  const senderIds = useMemo(() => Array.from(new Set((all||[]).map(n => n.senderId).filter(Boolean))), [all]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const missing = senderIds.filter(id => !userNames[id]);
      if (!missing.length) return;
      const entries = await Promise.all(missing.map(async id => {
        try {
          const snap = await getDoc(doc(db, 'users', id));
          if (snap.exists()) {
            const d = snap.data();
            return [id, { name: d.displayName || d.email || id.slice(0,6), loaded: true }];
          }
          return [id, { name: id.slice(0,6), loaded: true }];
        } catch {
          return [id, { name: id.slice(0,6), loaded: true }];
        }
      }));
      if (!cancelled) setUserNames(prev => {
        const next = { ...prev }; entries.forEach(([id, val]) => { next[id] = val; }); return next;
      });
    })();
    return () => { cancelled = true; };
  }, [senderIds, userNames]);

  const received = useMemo(() => (all || []).filter(n => !n.type?.startsWith('sent') && n.senderId !== user?.uid), [all, user]);
  const sent = useMemo(() => (all || []).filter(n => n.type?.startsWith('sent') || n.senderId === user?.uid), [all, user]);
  const unreadCount = useMemo(() => received.filter(n => !n.read).length, [received]);

  async function markRead(id) {
    try {
      await updateDoc(doc(db, 'users', user.uid, 'notifications', id), { read: true });
    } catch (e) { /* ignore */ }
  }

  const list = useMemo(() => (tab === 'received' ? received : sent), [tab, received, sent]);
  const sortedFull = useMemo(() => [...list].sort((a,b) => {
    const at = a.createdAt?.toMillis?.() || a.createdAt || 0;
    const bt = b.createdAt?.toMillis?.() || b.createdAt || 0;
    return bt - at;
  }), [list]);
  const totalPages = Math.max(1, Math.ceil(sortedFull.length / pageSize));
  const pageSlice = sortedFull.slice((page-1)*pageSize, page*pageSize);
  const dropdownSlice = sortedFull.slice(0, 8); // show fewer in dropdown for brevity

  useEffect(() => { if (page > totalPages) setPage(1); }, [page, totalPages]);

  function typeIcon(t) {
    if (!t) return '•';
    if (t.includes('message')) return '💬';
    if (t.includes('status')) return '📈';
    if (t.includes('job')) return '🧾';
    if (t.includes('sent')) return '📤';
    return '•';
  }

  function typeClass(t) {
    if (!t) return 't-generic';
    if (t.includes('message')) return 't-message';
    if (t.includes('status')) return 't-status';
    if (t.includes('job')) return 't-job';
    if (t.includes('sent')) return 't-sent';
    return 't-generic';
  }

  async function markAllVisibleRead() {
    const slice = showModal ? pageSlice : dropdownSlice;
    await Promise.all(slice.filter(n => !n.read).map(n => updateDoc(doc(db, 'users', user.uid, 'notifications', n.id), { read: true })));
  }

  return (
    <div className="notif-bell-wrapper" ref={panelRef}>
      <button className="notif-bell-btn" aria-label="Notifications" onClick={() => setOpen(o=>!o)}>
        🔔{unreadCount>0 && <span className="notif-badge" aria-label={`${unreadCount} unread notifications`}>{unreadCount}</span>}
      </button>
      {open && (
        <div className="notif-panel surface" role="dialog" aria-label="Notifications panel">
          <header className="notif-panel-header">
            <strong>Notifications</strong>
            {isRecruiter && (
              <nav className="notif-tabs" aria-label="Notification tabs">
                <button className={tab==='received'? 'active':''} onClick={()=>setTab('received')}>Received</button>
                <button className={tab==='sent'? 'active':''} onClick={()=>setTab('sent')}>Sent</button>
              </nav>
            )}
            <div className="notif-actions">
              <button className="na-btn" onClick={markAllVisibleRead} title="Mark visible as read">✓</button>
              <button className="na-btn" onClick={()=>{ setShowModal(true); setOpen(false); }} title="View all">↗</button>
            </div>
          </header>
          <ul className="notif-items" role="list">
            {dropdownSlice.length === 0 && <li className="empty" aria-label="No notifications">No {tab} notifications.</li>}
            {dropdownSlice.map(n => {
              const ts = new Date((n.createdAt?.toMillis?.() || n.createdAt || Date.now()));
              const senderName = n.senderId ? userNames[n.senderId]?.name || n.senderId.slice(0,6) : '';
              return (
                <li key={n.id} className={"notif-item "+ typeClass(n.type) + (!n.read ? ' unread':'')} onClick={()=>markRead(n.id)}>
                  <div className="notif-icon" aria-hidden="true">{typeIcon(n.type)}</div>
                  <div className="notif-main">
                    <div className="notif-title">{n.title || 'Notification'} {n.type && <span className={"notif-chip "+typeClass(n.type)}>{n.type}</span>}</div>
                    <div className="notif-meta">{senderName && <span className="sender" title={senderName}>From: {senderName}</span>}</div>
                    <div className="notif-msg" dangerouslySetInnerHTML={{ __html: n.message || '' }} />
                  </div>
                  <time className="notif-time" dateTime={ts.toISOString()}>
                    {ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </time>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {showModal && (
        <div className="notif-modal-overlay" role="dialog" aria-label="All notifications">
          <div className="notif-modal">
            <header className="nm-head">
              <h2>{tab === 'received' ? 'Received' : 'Sent'} Notifications</h2>
              <div className="row-actions">
                <button className="btn-ghost" onClick={markAllVisibleRead}>Mark page read</button>
                <button className="btn-ghost" onClick={()=>setShowModal(false)}>Close</button>
              </div>
            </header>
            <ul className="nm-list" role="list">
              {pageSlice.length === 0 && <li className="empty">Empty.</li>}
              {pageSlice.map(n => {
                const ts = new Date((n.createdAt?.toMillis?.() || n.createdAt || Date.now()));
                const senderName = n.senderId ? userNames[n.senderId]?.name || n.senderId.slice(0,6) : '';
                return (
                  <li key={n.id} className={"nm-item "+ typeClass(n.type) + (!n.read ? ' unread':'')} onClick={()=>markRead(n.id)}>
                    <div className="icon">{typeIcon(n.type)}</div>
                    <div className="body">
                      <div className="row1"><span className="title">{n.title || 'Notification'}</span> {n.type && <span className={"chip "+ typeClass(n.type)}>{n.type}</span>}</div>
                      <div className="row2">{senderName && <span className="from" title={senderName}>From: {senderName}</span>} <time>{ts.toLocaleString([], { hour:'2-digit', minute:'2-digit', month:'short', day:'numeric' })}</time></div>
                      <div className="msg" dangerouslySetInnerHTML={{ __html: n.message || '' }} />
                    </div>
                  </li>
                );
              })}
            </ul>
            <footer className="nm-foot">
              <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="btn-ghost">Prev</button>
              <span className="status">Page {page} / {totalPages}</span>
              <button disabled={page===totalPages} onClick={()=>setPage(p=>p+1)} className="btn-ghost">Next</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;