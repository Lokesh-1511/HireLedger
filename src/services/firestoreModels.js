/**
 * Firestore Data Models (JSDoc typedefs)
 * These mirror the structures defined in `datamodels.md`.
 * Use them for editor intellisense and consistent shape references.
 * (If you later migrate to TypeScript you can convert these to interfaces.)
 */

/** @typedef {('student'|'recruiter'|'admin')} UserRole */

/**
 * @typedef UserDoc
 * @property {UserRole} role
 * @property {string} email
 * @property {string} [displayName]
 * @property {string} [photoURL]
 * @property {string} [phone]
 * @property {import('firebase/firestore').Timestamp} createdAt
 * @property {import('firebase/firestore').Timestamp} updatedAt
 * @property {boolean} [isVerified]
 * @property {string} [languagePreference]
 * @property {boolean} [notificationsEnabled]
 * @property {import('firebase/firestore').Timestamp} [lastLogin]
 */

/** @typedef {{
 *  title:string;
 *  description:string;
 *  techStack:string[];
 *  link?:string;
 * }} StudentProject
 */

/** @typedef {{
 *  title:string;
 *  issuer:string;
 *  date:string; // ISO date
 *  verified:boolean;
 * }} StudentCertificate */

/** @typedef {{ email:boolean; phone:boolean }} ContactPreferences */

/** @typedef {{
 *  college?:string;
 *  department?:string;
 *  graduationYear?:number;
 *  cgpa?:number;
 *  skills?:string[];
 *  resumeURL?:string;
 *  projects?:StudentProject[];
 *  certificates?:StudentCertificate[];
 *  achievements?:string[];
 *  profileVisibility?:('public'|'private');
 *  contactPreferences?:ContactPreferences;
 * }} StudentProfileDoc */

/** @typedef {{
 *  companyName?:string;
 *  companyWebsite?:string;
 *  industry?:string;
 *  location?:string;
 *  aboutCompany?:string;
 *  postedJobsCount?:number;
 *  verifiedByAdmin?:boolean;
 * }} RecruiterProfileDoc */

/** @typedef {{
 *  designation?:string;
 *  permissions?:string[];
 *  lastAuditReview?:import('firebase/firestore').Timestamp;
 * }} AdminProfileDoc */

/** @typedef {{
 *  title:string;
 *  description:string;
 *  companyId:string; // recruiter uid
 *  companyName:string;
 *  location:string;
 *  type:string; // Internship | Full-Time etc
 *  salaryRange?:string;
 *  skillsRequired?:string[];
 *  postedAt:import('firebase/firestore').Timestamp;
 *  deadline?:import('firebase/firestore').Timestamp;
 *  status:('active'|'closed'|'draft');
 * }} JobDoc */

/** @typedef {{
 *  jobId:string;
 *  studentId:string;
 *  recruiterId:string;
 *  appliedAt:import('firebase/firestore').Timestamp;
 *  status:('applied'|'shortlisted'|'interview'|'offer'|'rejected'|'withdrawn');
 *  feedback?:string;
 *  resumeURL?:string;
 * }} ApplicationDoc */

/** @typedef {{
 *  applicationId:string;
 *  jobId:string;
 *  studentId:string;
 *  recruiterId:string;
 *  scheduledAt:import('firebase/firestore').Timestamp;
 *  mode:('Online'|'Onsite');
 *  meetingLink?:string;
 *  status:('scheduled'|'completed'|'cancelled');
 *  feedback?:string;
 * }} InterviewDoc */

/** @typedef {{
 *  question:string;
 *  options:string[];
 *  correctOption:number; // index
 * }} AssessmentQuestion */

/** @typedef {{
 *  title:string;
 *  description?:string;
 *  createdBy:string; // admin uid
 *  duration:number; // minutes
 *  questions:AssessmentQuestion[];
 * }} AssessmentDoc */

/** @typedef {{
 *  assessmentId:string;
 *  score:number;
 *  total:number;
 *  attemptedAt:import('firebase/firestore').Timestamp;
 *  timeTaken:number; // minutes
 * }} AssessmentResultDoc */

/** @typedef {{
 *  userId:string; // subject user
 *  type:('certificate'|'project'|'degree');
 *  status:('pending'|'verified'|'rejected');
 *  verifiedBy?:string; // admin uid
 *  verifiedAt?:import('firebase/firestore').Timestamp;
 *  remarks?:string;
 * }} VerificationDoc */

/** @typedef {{
 *  title:string;
 *  message:string;
 *  type:('interview'|'job'|'system');
 *  createdAt:import('firebase/firestore').Timestamp;
 *  read:boolean;
 *  link?:string;
 * }} NotificationDoc */

/** @typedef {{
 *  senderId:string;
 *  receiverId:string;
 *  content:string;
 *  sentAt:import('firebase/firestore').Timestamp;
 *  read:boolean;
 * }} MessageDoc */

/** @typedef {{
 *  userId:string;
 *  action:string;
 *  details?:string;
 *  timestamp:import('firebase/firestore').Timestamp;
 *  ip?:string;
 * }} AuditLogDoc */

/** @typedef {{
 *  name:string;
 *  location?:string;
 *  domain?:string;
 *  status:('approved'|'pending'|'rejected');
 *  verifiedBy?:string; // admin uid
 *  verifiedAt?:import('firebase/firestore').Timestamp;
 * }} InstitutionDoc */

/** @typedef {{
 *  type:string; // jobStats etc
 *  totalJobs?:number;
 *  totalApplications?:number;
 *  avgApplicationsPerJob?:number;
 *  lastUpdated:import('firebase/firestore').Timestamp;
 * }} AnalyticsMetricDoc */

/** @typedef {({
 *  name:string;
 *  legalName?:string;
 *  website?:string;
 *  industry?:string;
 *  size?:string; // e.g., 1-10, 11-50
 *  headquarters?:string;
 *  foundedYear?:number;
 *  description?:string;
 *  social?:{ linkedin?:string; twitter?:string };
 *  createdAt:import('firebase/firestore').Timestamp;
 *  updatedAt:import('firebase/firestore').Timestamp;
 *  verified:boolean;
 *  verifiedBy?:string; // admin uid
 *  verifiedAt?:import('firebase/firestore').Timestamp;
 * })} CompanyDoc */

/** @typedef {({
 *  name:string;
 *  level:number; // 0-5
 *  goal?:number; // 1-5
 *  category?:string; // core/tool/language etc
 *  createdAt:import('firebase/firestore').Timestamp;
 *  updatedAt:import('firebase/firestore').Timestamp;
 * })} StudentSkillDoc */

// Exporting an empty object so file can be imported solely for types side-effect.
export {}; 
