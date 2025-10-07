import React, { useState, useEffect, useMemo } from 'react';
import '../styles/pages/SkillAssessment.css';

/*
  SkillAssessment Page
  --------------------
  Static quiz UI with:
    - Progress bar
    - Timer badge
    - Question card (single-choice)
    - Submit button (disabled until answer picked)
    - Result view (score summary, percentile radial, recommendations)
  Notes / Future Integrations:
    - TODO(API): Fetch assessment metadata & question batch from backend (paginated / adaptive)
    - TODO(API): Post user responses and capture answer timing for analytics
    - TODO(SECURITY): Server-side validation of score; never trust client-calculated results
    - TODO(ADAPTIVE): Adaptive difficulty algorithm (e.g., IRT or simple ladder) based on correctness streak
    - TODO(ANTI-CHEAT): Obfuscate question order & implement focus/blur detection, possible integrity hash
    - TODO(BLOCKCHAIN): Optional on-chain credential hash after passing score threshold
*/

// Assessment bank grouped by topic
const QUESTION_BANK = {
  'JavaScript Fundamentals': [
    { id: 'js-q1', prompt: 'Which array method creates a new array with all elements that pass the test?', options: ['map()', 'forEach()', 'filter()', 'reduce()'], answer: 2 },
    { id: 'js-q2', prompt: 'Value of typeof NaN?', options: ['number', 'NaN', 'undefined', 'object'], answer: 0 },
    { id: 'js-q3', prompt: 'Which keyword declares a block-scoped variable?', options: ['var', 'let', 'const', 'both let & const'], answer: 3 }
  ],
  'Algorithms': [
    { id: 'alg-q1', prompt: 'Big-O time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], answer: 1 },
    { id: 'alg-q2', prompt: 'Data structure ideal for BFS traversal implementation?', options: ['Stack', 'Queue', 'Priority Queue', 'Set'], answer: 1 },
    { id: 'alg-q3', prompt: 'Which sort has worst case O(n^2)?', options: ['Merge sort', 'Heap sort', 'Quick sort (naive pivot)', 'Radix sort'], answer: 2 }
  ],
  'Web Protocols': [
    { id: 'web-q1', prompt: 'Which HTTP status means Unauthorized?', options: ['400', '401', '403', '422'], answer: 1 },
    { id: 'web-q2', prompt: 'HTTP method considered idempotent?', options: ['POST', 'PATCH', 'PUT', 'CONNECT'], answer: 2 },
    { id: 'web-q3', prompt: 'Header used for content type?', options: ['Content-Type', 'Accept-Language', 'X-Powered-By', 'Transfer-Encoding'], answer: 0 }
  ],
  'Databases': [
    { id: 'db-q1', prompt: 'SQL command to remove a table schema & data?', options: ['DELETE TABLE users', 'REMOVE users', 'DROP TABLE users', 'TRUNCATE users'], answer: 2 },
    { id: 'db-q2', prompt: 'Index primarily improves?', options: ['Storage capacity', 'Write throughput always', 'Read query performance', 'Backup speed'], answer: 2 },
    { id: 'db-q3', prompt: 'Normalization reduces?', options: ['Redundancy', 'Integrity', 'Atomicity', 'Scalability'], answer: 0 }
  ],
  'CSS': [
    { id: 'css-q1', prompt: 'CSS property to create a flex container?', options: ['display: flex', 'flex: container', 'flex: 1', 'container: flex'], answer: 0 },
    { id: 'css-q2', prompt: 'Unit relative to root font size?', options: ['em', 'rem', 'vh', 'ch'], answer: 1 },
    { id: 'css-q3', prompt: 'Which creates a stacking context?', options: ['position: static', 'z-index: auto', 'opacity: 0.9', 'display: block'], answer: 2 }
  ]
};

// Role -> topics mapping (first topics more weighted for role relevance)
const ROLE_TOPIC_MAP = {
  'Frontend Engineer': ['JavaScript Fundamentals', 'CSS', 'Web Protocols'],
  'Backend Engineer': ['Algorithms', 'Databases', 'Web Protocols', 'JavaScript Fundamentals'],
  'Full Stack Engineer': ['JavaScript Fundamentals', 'CSS', 'Web Protocols', 'Algorithms', 'Databases'],
  'Data Analyst': ['Databases', 'Algorithms', 'JavaScript Fundamentals'],
  'DevOps Engineer': ['Algorithms', 'Databases', 'Web Protocols'],
};

const STORAGE_KEY = 'hl_assessment_role_stats_v1';

function loadStats() {
  if (typeof window === 'undefined') return {};
  try { const raw = window.localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}
function persistStats(stats) {
  if (typeof window === 'undefined') return; try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats)); } catch { /* ignore */ }
}

/* Stats model per role:
  stats[role] = {
    attempts: number,
    bestScorePct: number,
    fastestTimeSec: number | null,
    lastScorePct: number,
    lastTimeSec: number,
    totalQuestionsAnswered: number
  }
*/

function ProgressBar({ current, total }) {
  const pct = (current / total) * 100;
  return (
    <div className="assess-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={current} aria-label="Assessment progress">
      <div className="assess-progress-fill" style={{ width: pct + '%' }} />
    </div>
  );
}

function RadialScore({ scorePct }) {
  const circ = 2 * Math.PI * 48;
  const offset = circ - (scorePct / 100) * circ;
  return (
    <div className="radial-score" aria-label={`Score ${scorePct}%`}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="48" className="track" strokeWidth="12" />
        <circle cx="60" cy="60" r="48" className="bar" strokeWidth="12" strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <div className="radial-score-value">{scorePct}%</div>
    </div>
  );
}

export default function SkillAssessment() {
  const roles = Object.keys(ROLE_TOPIC_MAP);
  const [role, setRole] = useState(null); // selected role
  const [questions, setQuestions] = useState([]); // active role questions
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [startedAt, setStartedAt] = useState(null); // Date.now when test begins
  const [endedAt, setEndedAt] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [stats, setStats] = useState(() => loadStats());
  const testActive = role && startedAt && !submitted;
  const testFinished = submitted;

  const elapsedSec = useMemo(() => {
    if (!startedAt) return 0;
    const end = endedAt || Date.now();
    return Math.floor((end - startedAt) / 1000);
  }, [startedAt, endedAt]);

  const currentQuestion = testActive ? questions[index] : null;
  const answeredCurrent = currentQuestion ? answers[currentQuestion.id] != null : false;

  const scoreInfo = useMemo(() => {
    if (!testFinished || !questions.length) return null;
    let correct = 0;
    questions.forEach(q => { if (answers[q.id] === q.answer) correct++; });
    const pct = Math.round((correct / questions.length) * 100);
    const percentile = Math.min(99, Math.max(1, pct + 10));
    const recommendations = [];
    // Primitive recos based on misses
    questions.forEach(q => { if (answers[q.id] !== q.answer) recommendations.push('Review: ' + q.prompt.slice(0, 48) + '…'); });
    if (recommendations.length === 0) recommendations.push('Great performance! Consider attempting a harder pool.');
    return { correct, pct, percentile, recommendations };
  }, [testFinished, questions, answers]);

  // Persist stats whenever updated
  useEffect(() => { persistStats(stats); }, [stats]);

  function buildRoleQuestionPool(selectedRole, numQuestions) {
    const relatedTopics = ROLE_TOPIC_MAP[selectedRole] || [];
    // Aggregate questions from all mapped topics
    const aggregated = relatedTopics.flatMap(t => QUESTION_BANK[t] || []);
    // Simple random shuffle
    const shuffled = [...aggregated].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.max(1, Math.min(numQuestions, shuffled.length)));
  }

  function beginRole(selectedRole, numQuestions) {
    const slice = buildRoleQuestionPool(selectedRole, numQuestions);
    setRole(selectedRole);
    setQuestions(slice);
    setIndex(0);
    setAnswers({});
    setStartedAt(Date.now());
    setEndedAt(null);
    setSubmitted(false);
  }

  function selectOption(optIndex) {
    if (!testActive) return;
    setAnswers(a => ({ ...a, [currentQuestion.id]: optIndex }));
  }
  function goNext() { if (index < questions.length - 1) setIndex(i => i + 1); }
  function goPrev() { if (index > 0) setIndex(i => i - 1); }

  function submit() {
    setSubmitted(true);
    setEndedAt(Date.now());
    // compute + store stats
    setStats(prev => {
      if (!role) return prev;
      const info = { ...(prev[role] || { attempts: 0, bestScorePct: 0, fastestTimeSec: null, lastScorePct: 0, lastTimeSec: 0, totalQuestionsAnswered: 0 }) };
      let correct = 0; questions.forEach(q => { if (answers[q.id] === q.answer) correct++; });
      const pct = Math.round((correct / questions.length) * 100);
      const timeSec = Math.max(1, elapsedSec);
      info.attempts += 1;
      info.lastScorePct = pct;
      info.lastTimeSec = timeSec;
      info.totalQuestionsAnswered += questions.length;
      if (pct > info.bestScorePct) info.bestScorePct = pct;
      if (info.fastestTimeSec == null || timeSec < info.fastestTimeSec) info.fastestTimeSec = timeSec;
      return { ...prev, [role]: info };
    });
  }

  function resetFlow() {
    setRole(null); setQuestions([]); setIndex(0); setAnswers({}); setStartedAt(null); setEndedAt(null); setSubmitted(false);
  }

  // Derived chosen role stats
  const roleStats = role ? stats[role] : null;

  if (!role) {
    // Role selection screen
    return (
      <div className="assessment-page">
        <div className="question-card" style={{ gap: '1.75rem' }}>
          <h2>Select a Role</h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '1rem' }}>
            {roles.map(r => {
              const st = stats[r];
              return (
                <li key={r} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', background: 'var(--color-surface-muted, #fff)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
                      <strong>{r}</strong>
                      {st ? (
                        <span className="muted" style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.3px' }}>
                          Best {st.bestScorePct}% · Fastest {st.fastestTimeSec ? st.fastestTimeSec + 's' : '—'} · Attempts {st.attempts}
                        </span>
                      ) : (
                        <span className="muted" style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.3px' }}>No attempts yet</span>
                      )}
                    </div>
                    <RoleStartForm role={r} onStart={beginRole} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }

  if (testFinished && scoreInfo) {
    return (
      <div className="assessment-page">
        <div className="result-wrap">
          <div className="result-card">
            <h2>{role} Result</h2>
            <div className="result-top">
              <RadialScore scorePct={scoreInfo.pct} />
              <div className="result-stats">
                <p><strong>{scoreInfo.correct}</strong> / {questions.length} correct</p>
                <p>Percentile: <strong>{scoreInfo.percentile}</strong></p>
                <p>Time: {elapsedSec}s</p>
                {roleStats && (
                  <p className="muted" style={{ fontSize: '.7rem' }}>Best {roleStats.bestScorePct}% · Fastest {roleStats.fastestTimeSec || '—'}s · Attempts {roleStats.attempts}</p>
                )}
              </div>
            </div>
            <div className="reco-block">
              <h3>Recommended Review</h3>
              <ul>
                {scoreInfo.recommendations.map(r => <li key={r}>{r}</li>)}
              </ul>
            </div>
            <div className="actions-row">
              <button onClick={() => beginRole(role, questions.length)} className="btn-primary">Retake Role Quiz</button>
              <button onClick={resetFlow} className="btn-ghost">Choose Another Role</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!testActive) {
    // Role chosen but not started (should not occur because start sets startedAt)
    return null;
  }

  const minutes = Math.floor(elapsedSec / 60);
  const secs = elapsedSec % 60;

  // Live quiz view
  return (
    <div className="assessment-page">
      <header className="assessment-head">
        <div className="timer" role="status" aria-live="polite">⏱ {minutes}:{secs.toString().padStart(2,'0')}</div>
        <ProgressBar current={index + (answeredCurrent ? 1 : 0)} total={questions.length} />
        <div className="question-meta">{role} · Question {index + 1} / {questions.length}</div>
      </header>

      <main className="question-card" aria-labelledby="qprompt">
        <h2 id="qprompt" className="prompt">{currentQuestion.prompt}</h2>
        <ul className="options" role="list">
          {currentQuestion.options.map((opt, i) => {
            const selected = answers[currentQuestion.id] === i;
            return (
              <li key={i}>
                <button
                  className={"option-btn" + (selected ? ' selected' : '')}
                  onClick={()=>selectOption(i)}
                  aria-pressed={selected}
                >{opt}</button>
              </li>
            );
          })}
        </ul>
        <div className="nav-row">
          <button onClick={goPrev} disabled={index===0} className="btn-ghost">Prev</button>
          {index < questions.length - 1 && (
            <button onClick={goNext} disabled={!answeredCurrent} className="btn-secondary">Next</button>
          )}
          {index === questions.length - 1 && (
            <button onClick={submit} disabled={!answeredCurrent} className="btn-primary">Finish</button>
          )}
        </div>
      </main>
    </div>
  );
}

function RoleStartForm({ role, onStart }) {
  const [count, setCount] = useState(5);
  const options = [3,5,8,10];
  return (
    <form onSubmit={(e)=>{ e.preventDefault(); onStart(role, count); }} style={{ display:'flex', gap:'.5rem', alignItems:'center', flexWrap:'wrap' }}>
      <label style={{ fontSize:'.7rem', textTransform:'uppercase', letterSpacing:'.35px', fontWeight:600 }}>Questions
        <select value={count} onChange={e=>setCount(Number(e.target.value))} style={{ marginLeft:'.4rem' }}>
          {options.map(o=> <option key={o} value={o}>{o}</option>)}
        </select>
      </label>
      <button type="submit" className="btn-primary" style={{ fontSize:'.7rem', padding:'.55rem .9rem' }}>Start Test</button>
    </form>
  );
}
