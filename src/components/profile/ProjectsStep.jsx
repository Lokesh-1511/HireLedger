import React from 'react';
import { useProfileBuilder } from '../../context/ProfileBuilderContext.jsx';

export default function ProjectsStep() {
  const { data, updateSection, errors, fieldErrors } = useProfileBuilder();
  const list = data.projects;
  const updateItem = (idx, patch) => updateSection('projects', list.map((p,i)=> i===idx ? { ...p, ...patch } : p));
  const add = () => updateSection('projects', [...list, { name:'', description:'', link:'' }]);
  const remove = (idx) => updateSection('projects', list.filter((_,i)=>i!==idx));
  return (
    <div className="col" style={{gap:'1rem'}}>
      {list.map((pr,i)=>(
        <div key={i} className="surface" style={{padding:'1rem', display:'grid', gap:'.75rem'}}>
          <label className="field-group"><span>Name</span><input className={fieldErrors.projects?.[i]?.name ? 'invalid' : ''} value={pr.name} onChange={e=>updateItem(i,{name:e.target.value})} />{fieldErrors.projects?.[i]?.name && <div className="field-error-msg">{fieldErrors.projects[i].name}</div>}</label>
          <label className="field-group"><span>Description</span><textarea rows={3} className={fieldErrors.projects?.[i]?.description ? 'invalid' : ''} value={pr.description} onChange={e=>updateItem(i,{description:e.target.value})} />{fieldErrors.projects?.[i]?.description && <div className="field-error-msg">{fieldErrors.projects[i].description}</div>}</label>
          <label className="field-group"><span>Link</span><input className={fieldErrors.projects?.[i]?.link ? 'invalid' : ''} value={pr.link} onChange={e=>updateItem(i,{link:e.target.value})} placeholder="https://" />{fieldErrors.projects?.[i]?.link && <div className="field-error-msg">{fieldErrors.projects[i].link}</div>}</label>
          <div className="actions-row">
            {list.length>1 && <button type="button" className="btn danger btn-sm" onClick={()=>remove(i)}>Remove</button>}
          </div>
        </div>
      ))}
      <button type="button" className="btn ghost" onClick={add}>Add Project</button>
      {errors.projects.length > 0 && (
        <ul className="error-list fs-xs" aria-live="polite">
          {errors.projects.map((e,i)=>(<li key={i}>{e}</li>))}
        </ul>
      )}
    </div>
  );
}
