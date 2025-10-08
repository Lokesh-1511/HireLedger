import React, { useState } from 'react';
import { useSearch } from '../../context/SearchContext.jsx';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../ui/Button.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import { NotificationBell } from './NotificationBell.jsx';
import { useStudentData } from '../../context/StudentDataContext.jsx';
import { useRecruiterData } from '../../context/RecruiterDataContext.jsx';

export function Navbar({ onToggleSidebar, isSidebarCollapsed, children, onToggleTheme, theme }) {
  const location = useLocation();
  const hideNav = location.pathname.startsWith('/login');
  const { user, logout } = useAuth();
  const studentCtx = user?.role === 'student' ? useStudentData() : null;
  const recruiterCtx = user?.role === 'recruiter' ? useRecruiterData() : null;
  const unread = (() => {
    const notifs = user?.role === 'student' ? studentCtx?.notifications : recruiterCtx?.notifications;
    if (!notifs) return 0;
    return notifs.filter(n => !n.read && !(n.type||'').startsWith('sent') && n.senderId !== user?.uid).length;
  })();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const search = useSearch();

  if (hideNav) return null;

  return (
    <header className="top-nav" role="banner" aria-label="Primary navigation bar">
      <Button
        aria-label={isSidebarCollapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
        onClick={onToggleSidebar}
        variant="ghost"
        size="sm"
        className="sw-toggle-btn"
      >☰</Button>
      <div className="brand" aria-label="Application name">
        <span className="brand-badge">HL</span> HireLedger
      </div>
      <div className="flex-1" />
      <button
        className="nav-search-btn"
        onClick={()=>search.setOpen(true)}
        aria-label="Open global search (Ctrl+K)"
      >🔍<span className="hint">Ctrl+K</span></button>
      <NotificationBell />
      <Button aria-label="Toggle color theme" variant="ghost" size="sm" onClick={onToggleTheme} className="theme-btn">
        {theme === 'dark' ? '🌙' : '☀️'}
      </Button>
      {user && (
  <div className="relative">
          <Button
            onClick={() => setOpen(o => !o)}
            aria-haspopup="menu"
            aria-expanded={open}
            variant="ghost"
            size="sm"
            className="profile-trigger"
          >
            <Avatar label={user.email} />
            <span className="user-stack">
              <strong>{user.email.split('@')[0]}</strong>
              <span className="role">{user.role}</span>
            </span>
          </Button>
          {open && (
            <ul role="menu" className="profile-menu">
              <li role="menuitem">
                <button className="btn ghost btn-sm menu-btn" onClick={() => { setOpen(false); navigate('/notifications'); }}>
                  Notifications{unread>0 && <span className="notif-inline-badge" aria-label={`${unread} unread`}>{unread}</span>}
                </button>
              </li>
              <li role="menuitem"><button className="btn ghost btn-sm menu-btn" onClick={() => { setOpen(false); navigate('/profile'); }}>Profile</button></li>
              <li role="menuitem"><button className="btn danger btn-sm menu-btn" onClick={() => { setOpen(false); logout(); }}>Logout</button></li>
            </ul>
          )}
        </div>
      )}
      {children}
    </header>
  );
}

// Inline helper removed; using btn classes now.

