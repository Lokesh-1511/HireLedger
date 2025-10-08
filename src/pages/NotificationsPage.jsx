import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useStudentData } from '../context/StudentDataContext.jsx';
import { useRecruiterData } from '../context/RecruiterDataContext.jsx';
import { db } from '../firebase.js';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

// Unified Notifications Page
// Shows all notifications for current user with pagination and filters.

const PAGE_SIZE = 30;

export default function NotificationsPage() {
  const { user } = useAuth();
  const role = user?.role;
  const isRecruiter = role === 'recruiter';
  const { notifications: recruiterNotifications } = isRecruiter ? useRecruiterData() : { notifications: [] };
  const { notifications: studentNotifications } = role === 'student' ? useStudentData() : { notifications: [] };
  const all = role === 'student' ? studentNotifications : recruiterNotifications;
  const { filter } = useParams();
  const navigate = useNavigate();
  const tab = (filter === 'unread' || filter === 'sent') ? filter : 'all';
  const [page, setPage] = useState(1);
  const [names, setNames] = useState({});

  // Derive lists
  const received = useMemo(() => (all||[]).filter(n => !n.type?.startsWith('sent') && n.senderId !== user?.uid), [all, user]);
  const sent = useMemo(() => (all||[]).filter(n => n.type?.startsWith('sent') || n.senderId === user?.uid), [all, user]);
  const list = useMemo(() => {
    switch(tab) {
      case 'unread': return received.filter(n => !n.read);
      case 'sent': return sent;
      default: return [...received, ...sent];
    }
  }, [tab, received, sent]);

  const sorted = useMemo(() => [...list].sort((a,b)=>{
    const at = a.createdAt?.toMillis?.() || a.createdAt || 0;
    const bt = b.createdAt?.toMillis?.() || b.createdAt || 0;
    return bt - at;
  }), [list]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const slice = sorted.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  useEffect(()=>{ if (page>totalPages) setPage(1); }, [page,totalPages]);

  // Fetch sender names
  const senderIds = useMemo(()=> Array.from(new Set(sorted.map(n=>n.senderId).filter(Boolean))), [sorted]);
  useEffect(()=> {
    let cancelled = false;
    (async () => {
      const missing = senderIds.filter(id => !names[id]);
      if (!missing.length) return;
      const entries = await Promise.all(missing.map(async id => {
        try { const snap = await getDoc(doc(db,'users',id)); if (snap.exists()) { const d=snap.data(); return [id, d.displayName || d.email || id.slice(0,6)]; } } catch {}
        return [id, id.slice(0,6)];
      }));
      if (!cancelled) setNames(prev => { const next={...prev}; entries.forEach(([id,name])=>{ next[id]=name; }); return next; });
    })();
    return () => { cancelled = true; };
  }, [senderIds, names]);

  async function markRead(id) {
    try { await updateDoc(doc(db,'users',user.uid,'notifications',id), { read:true }); } catch {}
  }
  async function markAllPage() {
    await Promise.all(slice.filter(n=>!n.read).map(n => updateDoc(doc(db,'users',user.uid,'notifications',n.id), { read:true })));
  }

  function typeIcon(t){ if(!t) return '•'; if(t.includes('message')) return '💬'; if(t.includes('status')) return '📈'; if(t.includes('job')) return '🧾'; if(t.includes('sent')) return '📤'; return '•'; }
  function typeClass(t){ if(!t) return 't-generic'; if(t.includes('message')) return 't-message'; if(t.includes('status')) return 't-status'; if(t.includes('job')) return 't-job'; if(t.includes('sent')) return 't-sent'; return 't-generic'; }

  return (
    <div className="notifications-page">
      <header className="surface np-head">
        <h1>Notifications</h1>
        <p className="muted small">Central feed of system and user events.</p>
      </header>
      <div className="np-toolbar surface">
        <nav className="np-tabs" aria-label="Filter notifications">
          <button className={tab==='all'?'active':''} onClick={()=>{ navigate('/notifications'); setPage(1); }}>All</button>
          <button className={tab==='unread'?'active':''} onClick={()=>{ navigate('/notifications/unread'); setPage(1); }}>Unread</button>
          <button className={tab==='sent'?'active':''} onClick={()=>{ navigate('/notifications/sent'); setPage(1); }}>Sent</button>
        </nav>
        <div className="np-actions">
          <button className="btn-ghost" onClick={markAllPage}>Mark Page Read</button>
        </div>
      </div>
      <ul className="np-list">
        {slice.length === 0 && <li className="empty">No notifications.</li>}
        {slice.map(n => {
          const ts = new Date((n.createdAt?.toMillis?.() || n.createdAt || Date.now()));
          const senderName = n.senderId ? names[n.senderId] || n.senderId.slice(0,6) : '';
          return (
            <li key={n.id} className={"np-item "+typeClass(n.type)+(!n.read?' unread':'')} onClick={()=>markRead(n.id)}>
              <div className="icon" aria-hidden="true">{typeIcon(n.type)}</div>
              <div className="body">
                <div className="row1"><span className="title">{n.title || 'Notification'}</span>{n.type && <span className={"chip "+typeClass(n.type)}>{n.type}</span>}</div>
                <div className="row2">{senderName && <span className="from">From: {senderName}</span>} <time>{ts.toLocaleString([], { hour:'2-digit', minute:'2-digit', month:'short', day:'numeric' })}</time></div>
                <div className="msg" dangerouslySetInnerHTML={{ __html: n.message || '' }} />
              </div>
            </li>
          );
        })}
      </ul>
      <footer className="np-foot surface">
        <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="btn-ghost">Prev</button>
        <span className="status">Page {page} / {totalPages}</span>
        <button disabled={page===totalPages} onClick={()=>setPage(p=>p+1)} className="btn-ghost">Next</button>
      </footer>
    </div>
  );
}