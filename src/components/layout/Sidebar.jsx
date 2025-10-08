import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useStudentData } from '../../context/StudentDataContext.jsx';
import { useRecruiterData } from '../../context/RecruiterDataContext.jsx';

function buildNav(role) {
  const base = [];
  if (role === 'student') {
    base.push(
      { to: '/dashboard/student', label: 'Dashboard', icon: '🎓' },
      { to: '/profile/builder', label: 'Profile Builder', icon: '🛠️' },
      { to: '/student/jobs', label: 'Jobs', icon: '💼' },
      { to: '/student/assessments', label: 'Assessments', icon: '🧪' },
      { to: '/student/credentials', label: 'Credentials', icon: '📜' },
      { to: '/notifications', label: 'Notifications', icon: '🔔' },
      { to: '/settings', label: 'Settings', icon: '⚙️' }
    );
  } else if (role === 'recruiter') {
    base.push(
      { to: '/recruiter/dashboard', label: 'Dashboard', icon: '📊' },
      { to: '/recruiter/jobs/new', label: 'Post Job', icon: '📝' },
      { to: '/recruiter/interviews', label: 'Interviews', icon: '🗓️' },
      { to: '/recruiter/analytics', label: 'Analytics', icon: '📈' },
      { to: '/recruiter/applicants', label: 'Applicants', icon: '👥' },
      { to: '/notifications', label: 'Notifications', icon: '🔔' },
      { to: '/settings', label: 'Settings', icon: '⚙️' }
    );
  } else if (role === 'admin') {
    base.push(
      { to: '/dashboard/admin', label: 'Dashboard', icon: '📊' },
      { to: '/admin/roles', label: 'Roles', icon: '🧩' },
      { to: '/admin/institutions', label: 'Institutions', icon: '🏛️' },
      { to: '/admin/audit', label: 'Audit Logs', icon: '🗂️' },
      { to: '/admin/api', label: 'API', icon: '🔌' },
      { to: '/notifications', label: 'Notifications', icon: '🔔' },
      { to: '/settings', label: 'Settings', icon: '⚙️' }
    );
  } else {
    base.push({ to: '/', label: 'Home', icon: '🏠' });
  }
  return base;
}

export function Sidebar({ collapsed, onNavigate }) {
  const { user } = useAuth();
  const studentCtx = user?.role === 'student' ? useStudentData() : null;
  const recruiterCtx = user?.role === 'recruiter' ? useRecruiterData() : null;
  const unread = (() => {
    const notifs = user?.role === 'student' ? studentCtx?.notifications : recruiterCtx?.notifications;
    if (!notifs) return 0;
    return notifs.filter(n => !n.read && !(n.type||'').startsWith('sent') && n.senderId !== user?.uid).length;
  })();
  const navItems = useMemo(()=> buildNav(user?.role), [user?.role]);
  return (
    <nav className={['sidebar', collapsed ? 'collapsed' : ''].join(' ')} aria-label="Main navigation">
      <ul className="sidebar-nav">
        {navItems.map(item => (
          <li key={item.to}>
            <NavLink
              onClick={onNavigate}
              to={item.to}
              end={/\/dashboard\//.test(item.to) || item.to === '/'}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) => 'sidebar-link sidebar-item' + (isActive ? ' active' : '')}
            >
              <span aria-hidden className="icon fs-base">{item.icon}</span>
              <span className="label ellipsis">{item.label}
                {item.label === 'Notifications' && unread > 0 && (
                  <span className="notif-inline-badge" aria-label={`${unread} unread`}>{unread}</span>
                )}
              </span>
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="mt-auto fs-xs opacity-75 pad-footer ls-05">
        v0.1.0
      </div>
    </nav>
  );
}
