# 📁 HireLedger Firestore Data Model (Complete Schema)

This document defines the full Firestore structure for the **HireLedger Campus Recruitment PWA**, covering all roles, features, and future integrations (AI, Blockchain, Analytics, Backend APIs).

---

## 🗂 Firestore Collections and Documents

```json
// ---------------------------
// 1. USERS (All Accounts)
// ---------------------------
users (collection)
 └─ <uid> (document)
    {
      "role": "student" | "recruiter" | "admin",
      "email": "john@college.edu",
      "displayName": "John Doe",
      "photoURL": "https://...",
      "phone": "+91XXXXXXXXXX",
      "createdAt": <timestamp>,
      "updatedAt": <timestamp>,
      "isVerified": true,
      "languagePreference": "en" | "hi" | "ta",
      "notificationsEnabled": true,
      "lastLogin": <timestamp>
    }

// ---------------------------
// 2. STUDENT PROFILE (Subcollection)
// ---------------------------
users/<uid>/studentProfile (document)
{
  "college": "IIT Madras",
  "department": "CSE",
  "graduationYear": 2026,
  "cgpa": 8.9,
  "skills": ["React", "Node.js", "AI"],
  "resumeURL": "https://firebasestorage.../resume.pdf",
  "projects": [
    {
      "title": "Campus App",
      "description": "A PWA for event management",
      "techStack": ["React", "Firebase"],
      "link": "https://github.com/project"
    }
  ],
  "certificates": [
    {
      "title": "AWS Certified",
      "issuer": "Amazon",
      "date": "2024-07-10",
      "verified": false
    }
  ],
  "achievements": ["Hackathon Winner 2024", "Best Intern 2025"],
  "profileVisibility": "public",
  "contactPreferences": {
    "email": true,
    "phone": false
  }
}

// ---------------------------
// 3. RECRUITER PROFILE (Subcollection)
// ---------------------------
users/<uid>/recruiterProfile (document)
{
  "companyName": "TechCorp Pvt Ltd",
  "companyWebsite": "https://techcorp.com",
  "industry": "Software",
  "location": "Bengaluru, India",
  "aboutCompany": "We build scalable SaaS platforms.",
  "postedJobsCount": 12,
  "verifiedByAdmin": true
}

// ---------------------------
// 4. ADMIN PROFILE (Subcollection)
// ---------------------------
users/<uid>/adminProfile (document)
{
  "designation": "Super Admin",
  "permissions": ["manageUsers", "verifyInstitutions", "auditLogs", "assignRoles"],
  "lastAuditReview": <timestamp>
}

// ---------------------------
// 5. JOBS (Global Collection)
// ---------------------------
jobs (collection)
 └─ <jobId> (document)
    {
      "title": "Software Engineer Intern",
      "description": "Work on scalable backend services.",
      "companyId": "<recruiterUid>",
      "companyName": "TechCorp Pvt Ltd",
      "location": "Remote",
      "type": "Internship",
      "salaryRange": "6-8 LPA",
      "skillsRequired": ["Node.js", "React"],
      "postedAt": <timestamp>,
      "deadline": <timestamp>,
      "status": "active" | "closed" | "draft"
    }

// ---------------------------
// 6. APPLICATIONS (Global Collection)
// ---------------------------
applications (collection)
 └─ <applicationId> (document)
    {
      "jobId": "<jobId>",
      "studentId": "<studentUid>",
      "recruiterId": "<recruiterUid>",
      "appliedAt": <timestamp>,
      "status": "applied" | "shortlisted" | "interview" | "offer" | "rejected" | "withdrawn",
      "feedback": "Good backend skills",
      "resumeURL": "https://firebasestorage.../resume.pdf"
    }

// ---------------------------
// 7. INTERVIEWS (Global Collection)
// ---------------------------
interviews (collection)
 └─ <interviewId> (document)
    {
      "applicationId": "<applicationId>",
      "jobId": "<jobId>",
      "studentId": "<studentUid>",
      "recruiterId": "<recruiterUid>",
      "scheduledAt": <timestamp>,
      "mode": "Online" | "Onsite",
      "meetingLink": "https://meet.google.com/xyz",
      "status": "scheduled" | "completed" | "cancelled",
      "feedback": "Strong problem-solving skills"
    }

// ---------------------------
// 8. ASSESSMENTS (Global Collection)
// ---------------------------
assessments (collection)
 └─ <assessmentId> (document)
    {
      "title": "JavaScript Basics",
      "description": "MCQ test on JS fundamentals",
      "createdBy": "<adminUid>",
      "duration": 30,
      "questions": [
        {
          "question": "What is closure?",
          "options": ["A", "B", "C", "D"],
          "correctOption": 2
        }
      ]
    }

// ---------------------------
// 9. ASSESSMENT RESULTS (Subcollection under Users)
// ---------------------------
users/<uid>/assessmentResults (collection)
 └─ <attemptId> (document)
    {
      "assessmentId": "<assessmentId>",
      "score": 85,
      "total": 100,
      "attemptedAt": <timestamp>,
      "timeTaken": 25
    }

// ---------------------------
// 10. VERIFICATIONS (Global Collection)
// ---------------------------
verifications (collection)
 └─ <verificationId> (document)
    {
      "userId": "<studentUid>",
      "type": "certificate" | "project" | "degree",
      "status": "pending" | "verified" | "rejected",
      "verifiedBy": "<adminUid>",
      "verifiedAt": <timestamp>,
      "remarks": "Verified via blockchain"
    }

// ---------------------------
// 11. NOTIFICATIONS (Subcollection under Users)
// ---------------------------
users/<uid>/notifications (collection)
 └─ <notificationId> (document)
    {
      "title": "Interview Scheduled",
      "message": "Your interview with TechCorp is on 15th Oct.",
      "type": "interview" | "job" | "system",
      "createdAt": <timestamp>,
      "read": false,
      "link": "/dashboard/student/interviews/<id>"
    }

// ---------------------------
// 12. MESSAGES (Global Collection)
// ---------------------------
messages (collection)
 └─ <messageId> (document)
    {
      "senderId": "<recruiterUid>",
      "receiverId": "<studentUid>",
      "content": "We would like to schedule an interview.",
      "sentAt": <timestamp>,
      "read": false
    }

// ---------------------------
// 13. AUDIT LOGS (Admin Use)
// ---------------------------
auditLogs (collection)
 └─ <logId> (document)
    {
      "userId": "<uid>",
      "action": "createdJob",
      "details": "Job 'Backend Engineer' posted",
      "timestamp": <timestamp>,
      "ip": "192.168.1.12"
    }

// ---------------------------
// 14. INSTITUTIONS (Verification & Approval)
// ---------------------------
institutions (collection)
 └─ <institutionId> (document)
    {
      "name": "IIT Madras",
      "location": "Chennai",
      "domain": "iitm.ac.in",
      "status": "approved" | "pending" | "rejected",
      "verifiedBy": "<adminUid>",
      "verifiedAt": <timestamp>
    }

// ---------------------------
// 15. ANALYTICS (Optional - Aggregate Stats)
// ---------------------------
analytics (collection)
 └─ <metricId> (document)
    {
      "type": "jobStats",
      "totalJobs": 450,
      "totalApplications": 1800,
      "avgApplicationsPerJob": 4,
      "lastUpdated": <timestamp>
    }
