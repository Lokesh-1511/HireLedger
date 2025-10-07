// Minimal mock auth service (replace with real identity provider later)
import { nanoid } from 'nanoid';

const users = [
  { id: 'u_admin', email: 'admin@example.com', password: 'admin', role: 'admin' },
  { id: 'u_recruiter', email: 'recruiter@example.com', password: 'recruit', role: 'recruiter' },
  { id: 'u_student', email: 'student@example.com', password: 'student', role: 'student' }
];

export function login(email, password) {
  const user = users.find(u=>u.email===email && u.password===password);
  if(!user) return null;
  // naive token
  return { token: nanoid(), user: { id:user.id, email: user.email, role: user.role } };
}
