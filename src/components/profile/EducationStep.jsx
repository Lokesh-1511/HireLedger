import React from 'react';
import { useProfileBuilder } from '../../context/ProfileBuilderContext.jsx';

export default function EducationStep() {
  const { data, updateSection, errors, fieldErrors } = useProfileBuilder();
  const list = data.education;
  const updateItem = (idx, patch) => {
    const next = list.map((it,i)=> i===idx ? { ...it, ...patch } : it);
    updateSection('education', next);
  };
  const add = () => updateSection('education', [...list, { school:'', degree:'', start:'', end:'', gpa:'' }]);
  const remove = (idx) => updateSection('education', list.filter((_,i)=>i!==idx));
  return (
    <div className="col" style={{gap:'1rem'}}>
      {list.map((ed,i)=>(
        <div key={i} className="surface" style={{padding:'1rem', display:'grid', gap:'.75rem'}}>
          <div className="grid cols-2" style={{gap:'.75rem'}}>
        <label className="field-group"><span>School <abbr title="Required" aria-label="Required">*</abbr></span><input required name={`education-${i}-school`} aria-required="true" aria-invalid={!!fieldErrors.education?.[i]?.school} className={fieldErrors.education?.[i]?.school ? 'invalid' : ''} value={ed.school} onChange={e=>updateItem(i,{school:e.target.value})} />{fieldErrors.education?.[i]?.school && <div className="field-error-msg">{fieldErrors.education[i].school}</div>}</label>
        <label className="field-group"><span>Degree <abbr title="Required" aria-label="Required">*</abbr></span><input required name={`education-${i}-degree`} aria-required="true" aria-invalid={!!fieldErrors.education?.[i]?.degree} className={fieldErrors.education?.[i]?.degree ? 'invalid' : ''} value={ed.degree} onChange={e=>updateItem(i,{degree:e.target.value})} />{fieldErrors.education?.[i]?.degree && <div className="field-error-msg">{fieldErrors.education[i].degree}</div>}</label>
          </div>
          <div className="grid cols-3" style={{gap:'.75rem'}}>
        <label className="field-group"><span>Start</span><input inputMode="numeric" pattern="\\d{4}" aria-invalid={!!fieldErrors.education?.[i]?.start} className={fieldErrors.education?.[i]?.start ? 'invalid' : ''} value={ed.start} onChange={e=>updateItem(i,{start:e.target.value})} placeholder="2022" />{fieldErrors.education?.[i]?.start && <div className="field-error-msg">{fieldErrors.education[i].start}</div>}</label>
        <label className="field-group"><span>End</span><input inputMode="numeric" pattern="\\d{4}" aria-invalid={!!fieldErrors.education?.[i]?.end} className={fieldErrors.education?.[i]?.end ? 'invalid' : ''} value={ed.end} onChange={e=>updateItem(i,{end:e.target.value})} placeholder="2026" />{fieldErrors.education?.[i]?.end && <div className="field-error-msg">{fieldErrors.education[i].end}</div>}</label>
        <label className="field-group"><span>GPA</span><input inputMode="decimal" aria-invalid={!!fieldErrors.education?.[i]?.gpa} className={fieldErrors.education?.[i]?.gpa ? 'invalid' : ''} value={ed.gpa} onChange={e=>updateItem(i,{gpa:e.target.value})} placeholder="3.8" />{fieldErrors.education?.[i]?.gpa && <div className="field-error-msg">{fieldErrors.education[i].gpa}</div>}</label>
          </div>
          <div className="actions-row">
            {list.length>1 && <button type="button" className="btn danger btn-sm" onClick={()=>remove(i)}>Remove</button>}
          </div>
        </div>
      ))}
      <button type="button" className="btn ghost" onClick={add}>Add Education</button>
      {errors.education.length > 0 && (
        <ul className="error-list fs-xs" aria-live="polite">
          {errors.education.map((e,i)=>(<li key={i}>{e}</li>))}
        </ul>
      )}
    </div>
  );
}
