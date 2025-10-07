import { nanoid } from 'nanoid';

// In-memory seed data reflecting frontend structures
export const db = {
  jobs: [
    { id: nanoid(), title: 'Frontend Engineer Intern', company: 'Acme Corp', location: 'Remote', applicants: 12, status: 'open', createdAt: Date.now() - 86400000*2 },
    { id: nanoid(), title: 'Backend Engineer', company: 'Globex', location: 'NYC', applicants: 5, status: 'open', createdAt: Date.now() - 86400000*6 }
  ],
  applicants: [
    { id: nanoid(), name: 'Alice Johnson', role: 'Frontend Engineer Intern', status: 'applied', diversity: 'female', jobId: null },
    { id: nanoid(), name: 'Bob Smith', role: 'Backend Engineer', status: 'screening', diversity: 'male', jobId: null },
    { id: nanoid(), name: 'Chen Wei', role: 'Backend Engineer', status: 'interview', diversity: 'asian', jobId: null }
  ],
  interviews: [
    { id: nanoid(), title: 'Tech Screen', candidate: 'Alice Johnson', day: 2, start: '10:00', end: '10:30' },
    { id: nanoid(), title: 'System Design', candidate: 'Bob Smith', day: 3, start: '13:00', end: '14:00' }
  ],
  verifications: [
    { id: nanoid(), name: 'University Transcript', status: 'pending' },
    { id: nanoid(), name: 'Certification XYZ', status: 'verified' }
  ],
  assessments: {
    roles: {
      'frontend': { attempts: [], bestScore: 0 },
      'backend': { attempts: [], bestScore: 0 }
    }
  },
  messages: []
};
