import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/StudentDashboard.css';
import { useAuth } from '../context/AuthContext.jsx';
import { useStudentData } from '../context/StudentDataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

function formatInterviewDate(value) {
  if (!value) return 'TBD';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  } catch {
    return value;
  }
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    jobs,
    applications,
    applicationStages,
    interviews,
    skills,
    notifications,
    profileCompletion,
    refreshProfileCompletion,
    applyToJob,
    toggleSavedJob
  } = useStudentData();
  const { push } = useToast();

  useEffect(() => {
    refreshProfileCompletion();
  }, [refreshProfileCompletion]);

  const recommendedJobs = useMemo(() => {
    const sorted = jobs
      .filter(job => job.status !== 'rejected')
      .sort((a, b) => {
        if (!!a.saved === !!b.saved) {
          const aTime = a.updatedAt || 0;
          const bTime = b.updatedAt || 0;
          return bTime - aTime;
        }
        return a.saved ? -1 : 1;
      });
    return sorted.slice(0, 4);
  }, [jobs]);

  const activeApplications = useMemo(() => (
    applications.map(app => {
      const status = app.status;
      const idx = applicationStages.indexOf(status);
      return {
        id: app.id,
        jobId: app.jobId,
        title: app.job?.title || 'Opportunity',
        company: app.job?.company || app.job?.companyName || 'Pending company',
        stageIndex: idx === -1 ? 0 : idx
      };
    })
  ), [applications, applicationStages]);

  const upcomingInterviews = useMemo(() => (
    interviews
      .slice()
      .sort((a, b) => {
        const aDate = new Date(a.scheduledAt || 0).getTime();
        const bDate = new Date(b.scheduledAt || 0).getTime();
        return aDate - bDate;
      })
      .slice(0, 3)
      .map(iv => ({
        id: iv.id,
        title: iv.job?.title || 'Interview',
        company: iv.job?.company || 'Company TBD',
        date: formatInterviewDate(iv.scheduledAt),
        type: iv.type || 'Interview'
      }))
  ), [interviews]);

  const skillInsights = useMemo(() => (
    skills.map(item => ({
      skill: item.name,
      level: item.level,
      goal: item.goal
    }))
  ), [skills]);

  const dashboardNotifications = useMemo(() => notifications.slice(0, 6).map(n => ({
    id: n.id,
    type: n.type,
    text: n.message || n.title || n.text
  })), [notifications]);

  function handleApply(job) {
    if (job.status && job.status !== 'withdrawn') {
      navigate('/student/jobs');
      return;
    }
    applyToJob(job.id);
    push(`Application started for ${job.title}.`, { type: 'success' });
  }

  function handleToggleSaved(job) {
    const wasSaved = job.saved;
    toggleSavedJob(job.id);
    push(wasSaved ? `${job.title} removed from saved jobs.` : `${job.title} added to saved jobs.`, { type: wasSaved ? 'info' : 'success' });
  }

  return (
    <div className="student-dash-grid">
      <section className="surface hero" aria-labelledby="hero-heading">
        <h2 id="hero-heading" className="mt-0">Welcome back, {user?.email.split('@')[0] || 'Student'} 👋</h2>
        <div className="progress-wrap" aria-label="Profile completion" role="group">
          <div className="progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={profileCompletion}>
            <span style={{ width: `${profileCompletion}%` }} />
          </div>
          <span className="progress-text fs-xs muted">Profile {profileCompletion}% complete</span>
        </div>
      </section>

      <section className="surface job-feed" aria-labelledby="jobs-heading">
        <div className="section-head">
          <h3 id="jobs-heading" className="mt-0">Job Feed</h3>
          <button className="btn btn-sm ghost" onClick={() => navigate('/student/jobs')}>View all</button>
        </div>
        <div className="job-grid">
          {recommendedJobs.length === 0 && (
            <article className="job-card" aria-label="No recommendations">
              <p className="muted">No recommendations yet. Explore roles in the jobs hub to get tailored suggestions.</p>
              <div className="job-actions">
                <button className="btn btn-sm primary" onClick={() => navigate('/student/jobs')}>Browse jobs</button>
              </div>
            </article>
          )}
          {recommendedJobs.map(job => (
            <article key={job.id} className="job-card" aria-label={`${job.title} at ${job.company}`}>
              <div className="job-head">
                <div className="logo" aria-hidden>{job.logo || (job.company || job.companyName || '?').charAt(0).toUpperCase()}</div>
                <div className="meta">
                  <h4 className="job-title">{job.title}</h4>
                  <span className="company muted fs-xs">{job.company}</span>
                </div>
              </div>
              <div className="job-tags">
                {job.tags?.map(tag => <span key={tag} className="tag">{tag}</span>)}
              </div>
              <div className="job-info fs-xs">
                <span>{job.location || 'Remote friendly'}</span>
                {job.salary && <span>• {job.salary}</span>}
              </div>
              <div className="job-actions">
                <button className="btn btn-sm primary" onClick={() => handleApply(job)}>
                  {job.status && job.status !== 'withdrawn' ? 'Manage application' : 'Quick apply'}
                </button>
                <button className="btn btn-sm ghost" onClick={() => handleToggleSaved(job)}>
                  {job.saved ? 'Saved' : 'Save'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="surface status-tracker" aria-labelledby="status-heading">
        <h3 id="status-heading" className="mt-0">Application Status</h3>
        <ul className="app-list">
          {activeApplications.length === 0 && (
            <li className="app-row" aria-label="No active applications">
              <div className="app-meta">
                <strong className="fs-sm">No active applications</strong>
                <span className="muted fs-xs">Start applying to see your progress here.</span>
              </div>
            </li>
          )}
          {activeApplications.map(app => (
            <li key={app.id} className="app-row">
              <div className="app-meta">
                <strong className="fs-sm">{app.title}</strong>
                <span className="muted fs-xs">{app.company}</span>
              </div>
              <ol className="stage-line" aria-label={`Progress for ${app.title}`}>
                {applicationStages.map((stage, index) => {
                  const state = index < app.stageIndex ? 'done' : index === app.stageIndex ? 'current' : 'upcoming';
                  return <li key={stage} className={`stage ${state}`}>{stage}</li>;
                })}
              </ol>
            </li>
          ))}
        </ul>
      </section>

      <section className="surface interviews" aria-labelledby="interviews-heading">
        <h3 id="interviews-heading" className="mt-0">Upcoming Interviews</h3>
        <ul className="interview-list">
          {upcomingInterviews.length === 0 && (
            <li className="interview-row" aria-label="No scheduled interviews">
              <div className="iv-meta">
                <strong className="fs-sm">No interviews scheduled</strong>
                <span className="muted fs-xs">Keep an eye on your inbox for recruiter responses.</span>
              </div>
            </li>
          )}
          {upcomingInterviews.map(iv => (
            <li key={iv.id} className="interview-row">
              <div className="iv-meta">
                <strong className="fs-sm">{iv.title}</strong>
                <span className="muted fs-xs">{iv.company}</span>
              </div>
              <div className="iv-time fs-xs">{iv.date}</div>
              <span className="badge">{iv.type}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="surface skills" aria-labelledby="skills-heading">
        <h3 id="skills-heading" className="mt-0">Skill Insights</h3>
        <div className="skill-bars">
          {skillInsights.length === 0 && (
            <p className="muted">Add skills in your profile builder to surface growth goals here.</p>
          )}
          {skillInsights.map(skill => (
            <div key={skill.skill} className="skill-bar" aria-label={`${skill.skill} proficiency ${skill.level} of ${skill.goal || 5}`}>
              <span className="label fs-xs">{skill.skill}</span>
              <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={skill.goal || 5} aria-valuenow={skill.level}>
                <span style={{ width: `${Math.min((skill.level / (skill.goal || 5)) * 100, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <aside className="surface notifications" aria-labelledby="notifications-heading">
        <h3 id="notifications-heading" className="mt-0">Notifications</h3>
        <ul className="notif-list" role="list">
          {dashboardNotifications.length === 0 && (
            <li className="notif" aria-label="No notifications">You're all caught up.</li>
          )}
          {dashboardNotifications.map(item => (
            <li key={item.id} className={`notif ${item.type}`}>{item.text}</li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
