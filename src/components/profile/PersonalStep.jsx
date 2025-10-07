import React from 'react';
import { useProfileBuilder } from '../../context/ProfileBuilderContext.jsx';

export default function PersonalStep() {
  const { data, updateSection, errors, fieldErrors } = useProfileBuilder();
  const p = data.personal;
  const handle = (field) => (e) => updateSection('personal', { ...p, [field]: e.target.value });
  return (
    <div className="grid" style={{gap:'1rem', maxWidth:620}}>
      <label className="field-group">
        <span>First Name <abbr title="Required" aria-label="Required">*</abbr></span>
        <input
          required
            name="firstName"
          aria-required="true"
          aria-invalid={!!fieldErrors.personal?.firstName}
          className={fieldErrors.personal?.firstName ? 'invalid' : ''}
          value={p.firstName}
          onChange={handle('firstName')}
          placeholder="Jane"
        />
        {fieldErrors.personal?.firstName && <div className="field-error-msg">{fieldErrors.personal.firstName}</div>}
      </label>
      <label className="field-group">
        <span>Last Name <abbr title="Required" aria-label="Required">*</abbr></span>
        <input
          required
          name="lastName"
          aria-required="true"
          aria-invalid={!!fieldErrors.personal?.lastName}
          className={fieldErrors.personal?.lastName ? 'invalid' : ''}
          value={p.lastName}
          onChange={handle('lastName')}
          placeholder="Doe"
        />
        {fieldErrors.personal?.lastName && <div className="field-error-msg">{fieldErrors.personal.lastName}</div>}
      </label>
      <label className="field-group">
        <span>Email <span className="muted fs-xs" title="Use institutional email if possible">(why?)</span></span>
        <input
          required
          name="email"
          type="email"
          aria-required="true"
          aria-invalid={!!fieldErrors.personal?.email}
          className={fieldErrors.personal?.email ? 'invalid' : ''}
          value={p.email}
          onChange={handle('email')}
          placeholder="you@university.edu"
        />
        {fieldErrors.personal?.email && <div className="field-error-msg">{fieldErrors.personal.email}</div>}
      </label>
      <label className="field-group">
        <span>Phone <span className="muted fs-xs" title="International format recommended">(info)</span></span>
        <input
          name="phone"
          inputMode="tel"
          pattern="[+0-9()\-\s]{7,}"
          aria-invalid={!!fieldErrors.personal?.phone}
          className={fieldErrors.personal?.phone ? 'invalid' : ''}
          value={p.phone}
          onChange={handle('phone')}
          placeholder="(+1) 555-1234"
        />
        {fieldErrors.personal?.phone && <div className="field-error-msg">{fieldErrors.personal.phone}</div>}
      </label>
      {errors.personal.length > 0 && (
        <ul className="error-list fs-xs" aria-live="polite">
          {errors.personal.map((e,i)=>(<li key={i}>{e}</li>))}
        </ul>
      )}
    </div>
  );
}
