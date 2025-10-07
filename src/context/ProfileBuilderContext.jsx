import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext.jsx';
import { upsertStudentProfile } from '../services/firestoreService.js';
import { validateProfile, sectionErrorFlags } from '../utils/profileValidation.js';

const STORAGE_KEY = 'hl_profile_builder_v1';

export const steps = [
  'personal',
  'education',
  'skills',
  'projects',
  'resume',
  'certificates',
  'review'
];

const defaultData = {
  personal: { firstName: '', lastName: '', email: '', phone: '' },
  education: [{ school: '', degree: '', start: '', end: '', gpa: '' }],
  skills: { core: [], tools: [], languages: [] },
  projects: [{ name: '', description: '', link: '' }],
  resume: { file: null },
  certificates: [],
};

const ProfileBuilderContext = createContext(null);

export function ProfileBuilderProvider({ children }) {
  const { user } = useAuth();
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...defaultData, ...JSON.parse(raw) };
    } catch(e) { /* ignore */ }
    return defaultData;
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [dirty, setDirty] = useState(false);
  // Perform initial validation against the ACTUAL loaded draft (may contain prior user input),
  // not the empty defaults, to avoid falsely marking filled fields as required on first paint.
  const initialValidation = validateProfile(typeof data === 'object' ? data : defaultData);
  const [errors, setErrors] = useState(() => initialValidation.errors);
  const [fieldErrors, setFieldErrors] = useState(() => initialValidation.fieldErrors || {});
  // One-time mount revalidation safeguard (covers edge cases where data is hydrated after lazy load)
  useEffect(() => {
    const { errors: freshErrors, fieldErrors: freshFieldErrors } = validateProfile(data);
    setErrors(freshErrors);
    setFieldErrors(freshFieldErrors);
  // run only once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const saveRef = useRef(null);
  useEffect(() => {
    if (!dirty) return;
    if (saveRef.current) clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e) { /* ignore */ }
      setDirty(false);
    }, 600); // debounce save
  }, [data, dirty]);

  const updateSection = useCallback((section, value) => {
    // Atomic update + full validation to prevent stale closure / race conditions.
    setData(prev => {
      const next = { ...prev, [section]: value };
      const { errors: freshErrors, fieldErrors: freshFieldErrors } = validateProfile(next);
      setErrors(freshErrors);      // full replacement ensures removed errors disappear
      setFieldErrors(freshFieldErrors);
      return next;
    });
    setDirty(true);
  }, []);

  const next = useCallback(() => setCurrentStep(s => { const n = Math.min(s + 1, steps.length - 1); setDirty(true); return n; }), []);
  const prev = useCallback(() => setCurrentStep(s => { const n = Math.max(s - 1, 0); setDirty(true); return n; }), []);
  const goTo = useCallback((index) => { setDirty(true); setCurrentStep(() => Math.min(Math.max(index,0), steps.length -1)); }, []);
  const reset = useCallback(() => {
    setData(defaultData);
    const { errors: freshErrors, fieldErrors: freshFieldErrors } = validateProfile(defaultData);
    setErrors(freshErrors);
    setFieldErrors(freshFieldErrors);
    setCurrentStep(0);
    setDirty(true);
  }, []);

  // Full validation function
  const validateAll = useCallback(() => {
    const result = validateProfile(data);
    setErrors(result.errors);
    setFieldErrors(result.fieldErrors);
    return result;
  }, [data]);

  const buildStudentProfileDoc = useCallback(() => {
    // Map builder draft to StudentProfileDoc shape
    const { personal, education, skills, projects } = data;
    return {
      college: education[0]?.school || '',
      department: education[0]?.degree || '',
      graduationYear: Number(education[0]?.end) || undefined,
      cgpa: education[0]?.gpa ? Number(education[0].gpa) : undefined,
      skills: skills.core.concat(skills.tools, skills.languages).filter(Boolean),
      projects: projects.filter(p=>p.name?.trim()).map(p=>({
        title: p.name,
        description: p.description,
        techStack: [],
        link: p.link || undefined
      })),
      certificates: [], // future: integrate certificate upload & metadata
      achievements: [],
      profileVisibility: 'public',
      contactPreferences: { email: true, phone: !!personal.phone }
    };
  }, [data]);

  const submitProfile = useCallback(async () => {
    if (!user?.uid) return { ok:false, error:'Not authenticated' };
    const { isValid } = validateAll();
    if (!isValid) {
      return { ok:false, error:'Please fix validation errors before submitting.' };
    }
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const doc = buildStudentProfileDoc();
      await upsertStudentProfile(user.uid, doc);
      // Re-validate to clear any transient error states post-submit
      const { errors: freshErrors, fieldErrors: freshFieldErrors } = validateProfile(data);
      setErrors(freshErrors);
      setFieldErrors(freshFieldErrors);
      setSubmitResult({ ok:true });
      return { ok:true };
    } catch(e) {
      console.error('submitProfile failed', e);
      const msg = e.message || 'Submission failed';
      setSubmitResult({ ok:false, error: msg });
      return { ok:false, error: msg };
    } finally {
      setSubmitting(false);
    }
  }, [user, validateAll, buildStudentProfileDoc]);

  const value = {
    data, updateSection,
    currentStep, steps, next, prev, goTo, reset,
    saveDraft: () => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e) {}
      const { errors: freshErrors, fieldErrors: freshFieldErrors } = validateProfile(data);
      setErrors(freshErrors);
      setFieldErrors(freshFieldErrors);
      setDirty(false);
    },
    dirty,
  errors,
  fieldErrors,
    hasSectionErrors: sectionErrorFlags(errors),
    validateAll,
    submitProfile,
    submitting,
    submitResult,
    buildStudentProfileDoc
  };
  return <ProfileBuilderContext.Provider value={value}>{children}</ProfileBuilderContext.Provider>;
}

export function useProfileBuilder() {
  const ctx = useContext(ProfileBuilderContext);
  if (!ctx) throw new Error('useProfileBuilder must be used within ProfileBuilderProvider');
  return ctx;
}
