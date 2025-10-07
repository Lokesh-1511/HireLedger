// Profile Builder Validation Utility
// Returns detailed errors per section for display.

/**
 * Validate the profile builder draft structure.
 * @param {object} data
 * @returns {{errors: Record<string,string[]>, isValid: boolean}}
 */
export function validateProfile(data) {
  const errors = { personal: [], education: [], skills: [], projects: [], resume: [], certificates: [] };
  const fieldErrors = { personal:{}, education:[], projects:[], skills:{} };

  // --- Personal ---
  if (!data.personal.firstName?.trim()) { errors.personal.push('First name is required'); fieldErrors.personal.firstName='Required'; }
  if (!data.personal.lastName?.trim()) { errors.personal.push('Last name is required'); fieldErrors.personal.lastName='Required'; }
  if (data.personal.email) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.personal.email)) { errors.personal.push('Email appears invalid'); fieldErrors.personal.email='Invalid email'; }
  } else { fieldErrors.personal.email='Required'; errors.personal.push('Email is required'); }
  if (data.personal.phone) {
    if (data.personal.phone.replace(/[^0-9]/g,'').length < 7) { errors.personal.push('Phone number seems too short'); fieldErrors.personal.phone='Too short'; }
  }

  // --- Education --- (at least one entry with school & degree)
  if (!Array.isArray(data.education) || data.education.length === 0) {
    errors.education.push('At least one education entry required');
  } else {
    data.education.forEach((e, i) => {
      const eErr = {};
      const yearRegex = /^\d{4}$/;
      if (!e.school?.trim()) { errors.education.push(`Education #${i+1}: school required`); eErr.school='Required'; }
      if (!e.degree?.trim()) { errors.education.push(`Education #${i+1}: degree required`); eErr.degree='Required'; }
      if (e.start && !yearRegex.test(e.start)) { errors.education.push(`Education #${i+1}: start year invalid`); eErr.start='YYYY'; }
      if (e.end && !yearRegex.test(e.end)) { errors.education.push(`Education #${i+1}: end year invalid`); eErr.end='YYYY'; }
      if (e.start && e.end && yearRegex.test(e.start) && yearRegex.test(e.end) && Number(e.start) > Number(e.end)) { errors.education.push(`Education #${i+1}: start > end`); eErr.start='> end'; eErr.end='< start'; }
      if (e.gpa) {
        const g = Number(e.gpa);
        if (isNaN(g)) { errors.education.push(`Education #${i+1}: GPA must be numeric`); eErr.gpa='Numeric'; }
        else if (g < 0 || g > 10) { errors.education.push(`Education #${i+1}: GPA out of range 0-10`); eErr.gpa='0-10'; }
      }
      fieldErrors.education[i] = eErr;
    });
  }

  // --- Skills --- (recommend at least 1 core skill)
  if (!Array.isArray(data.skills.core) || data.skills.core.length === 0) {
    errors.skills.push('Add at least one core skill');
    fieldErrors.skills.core='At least one required';
  }
  ['core','tools','languages'].forEach(cat => {
    const list = data.skills[cat] || [];
    list.forEach((v, i) => { if (!v.trim()) errors.skills.push(`${cat} skill #${i+1} is empty`); });
  });

  // --- Projects --- (optional, but if provided must have name)
  data.projects.forEach((p, i) => {
    const pErr = {};
    if (!p.name?.trim()) { errors.projects.push(`Project #${i+1}: name required`); pErr.name='Required'; }
    if (p.link && !/^https?:\/\//i.test(p.link)) { errors.projects.push(`Project #${i+1}: link must start with http(s)://`); pErr.link='Invalid URL'; }
    fieldErrors.projects[i] = pErr;
  });

  // --- Resume --- (optional for now, placeholder)
  // Example: enforce file type/size when implemented.

  // --- Certificates --- (placeholder; file validation could be added later)

  const isValid = Object.values(errors).every(arr => arr.length === 0);
  return { errors, isValid, fieldErrors };
}

/**
 * Utility to reduce validation errors into a step error summary map
 * @param {Record<string,string[]>} errors
 * @returns {Record<string, boolean>} sectionHasErrors
 */
export function sectionErrorFlags(errors) {
  const flags = {};
  Object.entries(errors).forEach(([k,v]) => { flags[k] = v.length > 0; });
  return flags;
}
