import React, { useState } from 'react';
import '../styles/pages/Profile.css';
import { useAuth } from '../context/AuthContext.jsx';
import { useUserProfiles } from '../context/UserProfileContext.jsx';

function Field({ label, value, onChange, name, placeholder, disabled }) {
  return (
    <label className="pf-field">
      <span>{label}</span>
      <input
        name={name}
        value={value}
        onChange={e => onChange(e.target.name, e.target.value)}
        placeholder={placeholder || label}
        disabled={disabled}
      />
    </label>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const { student, recruiter, admin, updateStudent, updateRecruiter, updateAdmin } = useUserProfiles();
  const role = user?.role;
  const [editing, setEditing] = useState(false);

  const toggleEdit = () => setEditing(e => !e);

  const handleStudentChange = (field, value) => updateStudent({ [field]: value });
  const handleRecruiterChange = (field, value) => updateRecruiter({ [field]: value });
  const handleAdminChange = (field, value) => updateAdmin({ [field]: value });

  const fullName = role === 'student'
    ? [student.firstName, student.lastName].filter(Boolean).join(' ') || 'Student'
    : role === 'recruiter'
      ? recruiter.name || 'Recruiter'
      : admin.name || 'Admin';

  return (
    <main className="profile-page simple" aria-labelledby="profile-heading">
      <div className="profile-hero surface">
        <div className="avatar-circle" aria-hidden>{fullName[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}</div>
        <div className="hero-meta">
          <h1 id="profile-heading">{fullName} <span className="role-badge">{role}</span></h1>
          <p className="muted">{user?.email}</p>
          <button className="btn small" type="button" onClick={toggleEdit}>{editing ? 'Done' : 'Edit'}</button>
        </div>
      </div>
      {role === 'student' && (
        <section className="profile-section surface" aria-label="Student profile details">
          <h2>Student Details</h2>
          <div className="pf-grid">
            <Field label="First Name" name="firstName" value={student.firstName} onChange={handleStudentChange} disabled={!editing} />
            <Field label="Last Name" name="lastName" value={student.lastName} onChange={handleStudentChange} disabled={!editing} />
            <Field label="College" name="college" value={student.college} onChange={handleStudentChange} disabled={!editing} />
            <Field label="Department" name="department" value={student.department} onChange={handleStudentChange} disabled={!editing} />
            <Field label="Graduation Year" name="graduationYear" value={student.graduationYear} onChange={handleStudentChange} disabled={!editing} />
            <Field label="CGPA" name="cgpa" value={student.cgpa} onChange={handleStudentChange} disabled={!editing} />
            <Field label="Phone" name="phone" value={student.phone} onChange={handleStudentChange} disabled={!editing} />
            <Field label="Location" name="location" value={student.location} onChange={handleStudentChange} disabled={!editing} />
            <Field label="Email" name="email" value={student.email || user?.email || ''} onChange={handleStudentChange} disabled={!editing} />
            <Field label="Resume URL" name="resumeURL" value={student.resumeURL} onChange={handleStudentChange} disabled={!editing} />
            <Field label="Visibility" name="profileVisibility" value={student.profileVisibility} onChange={handleStudentChange} disabled={!editing} />
          </div>
        </section>
      )}
      {role === 'recruiter' && (
        <section className="profile-section surface" aria-label="Recruiter profile details">
          <h2>Recruiter Details</h2>
            <div className="pf-grid">
              <Field label="Name" name="name" value={recruiter.name} onChange={handleRecruiterChange} disabled={!editing} />
              <Field label="Company Name" name="companyName" value={recruiter.companyName} onChange={handleRecruiterChange} disabled={!editing} />
              <Field label="Company Website" name="companyWebsite" value={recruiter.companyWebsite} onChange={handleRecruiterChange} disabled={!editing} />
              <Field label="Industry" name="industry" value={recruiter.industry} onChange={handleRecruiterChange} disabled={!editing} />
              <Field label="Phone" name="phone" value={recruiter.phone} onChange={handleRecruiterChange} disabled={!editing} />
              <Field label="Location" name="location" value={recruiter.location} onChange={handleRecruiterChange} disabled={!editing} />
              <Field label="Email" name="email" value={recruiter.email || user?.email || ''} onChange={handleRecruiterChange} disabled={!editing} />
            </div>
        </section>
      )}
      {role === 'admin' && (
        <section className="profile-section surface" aria-label="Admin profile details">
          <h2>Admin Details</h2>
          <div className="pf-grid">
            <Field label="Name" name="name" value={admin.name} onChange={handleAdminChange} disabled={!editing} />
            <Field label="Designation" name="designation" value={admin.designation} onChange={handleAdminChange} disabled={!editing} />
            <Field label="Phone" name="phone" value={admin.phone} onChange={handleAdminChange} disabled={!editing} />
            <Field label="Location" name="location" value={admin.location} onChange={handleAdminChange} disabled={!editing} />
            <Field label="Email" name="email" value={admin.email || user?.email || ''} onChange={handleAdminChange} disabled={!editing} />
          </div>
        </section>
      )}
    </main>
  );
}
