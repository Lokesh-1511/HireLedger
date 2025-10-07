import React, { useState } from 'react';
import { useProfileBuilder } from '../../context/ProfileBuilderContext.jsx';

function TagInput({ label, values, onChange, placeholder }) {
  const [draft,setDraft] = useState('');
  const add = () => { if(draft.trim()){ onChange([...values, draft.trim()]); setDraft(''); }};
  const remove = (idx) => onChange(values.filter((_,i)=>i!==idx));
  return (
    <div className="field-group">
      <span>{label}</span>
      <div className="tagbox" onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); add(); } }}>
        <ul className="taglist">
          {values.map((v,i)=>(<li key={v+i}><span>{v}</span><button type="button" aria-label={`Remove ${v}`} onClick={()=>remove(i)}>×</button></li>))}
        </ul>
        <input value={draft} onChange={e=>setDraft(e.target.value)} placeholder={placeholder} />
        <button type="button" className="btn btn-sm" onClick={add}>Add</button>
      </div>
    </div>
  );
}

export default function SkillsStep() {
  const { data, updateSection, errors } = useProfileBuilder();
  const s = data.skills;
  const set = (field) => (vals) => updateSection('skills', { ...s, [field]: vals });
  return (
    <div className="col" style={{gap:'1rem', maxWidth:720}}>
      <TagInput label="Core Skills" values={s.core} onChange={set('core')} placeholder="Add a core skill" />
      <TagInput label="Tools" values={s.tools} onChange={set('tools')} placeholder="Add a tool" />
      <TagInput label="Languages" values={s.languages} onChange={set('languages')} placeholder="Add a language" />
      {errors.skills.length > 0 && (
        <ul className="error-list fs-xs" aria-live="polite">
          {errors.skills.map((e,i)=>(<li key={i}>{e}</li>))}
        </ul>
      )}
    </div>
  );
}
