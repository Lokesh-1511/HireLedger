import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';

// Separate simple profile store for canonical identity fields (not analytics/stats)
// Persists to localStorage. Role-specific shapes:
// student (canonical subset + editable identity):
// { firstName, lastName, college, department, graduationYear, cgpa, skills[], resumeURL, profileVisibility, contactPreferences{email,phone}, phone, email, location }
// recruiter: { name, companyName, companyWebsite, industry, location, phone, email }
// admin: { name, designation, permissions[], phone, email, location }

const STORAGE_KEY = 'hl_user_profiles_v1';

const defaultProfile = {
  student: {
    firstName: '',
    lastName: '',
    college: '',
    department: '',
    graduationYear: '',
    cgpa: '',
    skills: [],
    resumeURL: '',
    profileVisibility: 'public',
    contactPreferences: { email: true, phone: false },
    phone: '',
    email: '',
    location: ''
  },
  recruiter: {
    name: '',
    companyName: '',
    companyWebsite: '',
    industry: '',
    location: '',
    phone: '',
    email: ''
  },
  admin: {
    name: '',
    designation: '',
    permissions: [],
    phone: '',
    email: '',
    location: ''
  }
};

const UserProfileContext = createContext(null);

export function UserProfileProvider({ children }) {
  const [profiles, setProfiles] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...defaultProfile, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return defaultProfile;
  });
  const [dirty, setDirty] = useState(false);
  const saveRef = useRef(null);

  useEffect(() => {
    if (!dirty) return;
    if (saveRef.current) clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles)); } catch { /* ignore */ }
      setDirty(false);
    }, 400);
  }, [profiles, dirty]);

  const updateStudent = useCallback((patch) => {
    setProfiles(p => ({ ...p, student: { ...p.student, ...patch }}));
    setDirty(true);
  }, []);
  const updateRecruiter = useCallback((patch) => {
    setProfiles(p => ({ ...p, recruiter: { ...p.recruiter, ...patch }}));
    setDirty(true);
  }, []);
  const updateAdmin = useCallback((patch) => {
    setProfiles(p => ({ ...p, admin: { ...p.admin, ...patch }}));
    setDirty(true);
  }, []);

  const resetRole = useCallback((role) => {
    if (!defaultProfile[role]) return;
    setProfiles(p => ({ ...p, [role]: defaultProfile[role] }));
    setDirty(true);
  }, []);

  const value = {
    profiles,
    student: profiles.student,
    recruiter: profiles.recruiter,
    admin: profiles.admin,
    updateStudent, updateRecruiter, updateAdmin,
    resetRole
  };
  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}

export function useUserProfiles() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error('useUserProfiles must be used within UserProfileProvider');
  return ctx;
}
