export const profileImage = '/images/profile.webp';

export const academicInterests = [
  'Minimally invasive spine surgery',
  'Endoscopic spine surgery, UBE',
  'Artificial intelligence',
] as const;

export const activities = [
  { organization: 'Korean Neurosurgical Society (KNS)', role: 'Board Certified Member' },
  { organization: 'Korean Spinal Neurosurgery Society (KSNS)', role: 'Lifetime Member; Computation Committee' },
  { organization: 'Korean Minimally Invasive Spine Surgery Society (KOMISS)', role: 'Lifetime Member; Scientific Administrator' },
  { organization: 'Korean Research Society of Endoscopic Spine Surgery (KOSESS)', role: 'Member; Education Secretary' },
  { organization: 'World UBE Society (WUBES)', role: 'Member; Auditor' },
  { organization: 'Neurospine', role: 'Editorial Board Member' },
  { organization: 'JMISST', role: 'Editorial Board Member' },
  { organization: 'North American Spine Society (NASS)', role: 'Member' },
  { organization: 'Korean American Spine Society (KASS)', role: 'Member' },
  { organization: 'AO Spine', role: 'Member' },
] as const;

export const currentRoles = [
  'Director, Center for Endoscopic Spine Surgery, Davos Hospital',
  ...activities.map(activity => `${activity.organization} · ${activity.role}`),
];

export const career = [
  { year: '2025-', text: 'Director, Davos Hospital' },
  { year: '2025', text: 'AO Spine Fellowship, Keio University' },
  { year: '2024', text: 'WSO Mission, Dominican Republic' },
  { year: '2023-2025', text: 'Assistant Professor, Hallym University' },
  { year: '2021-2022', text: 'Spine Fellowship, Seoul National University Hospital' },
  { year: '2019-2021', text: 'Director, Korean Military Academy' },
  { year: '2017', text: 'Board Certified Neurosurgeon' },
  { year: '2013-2017', text: 'Neurosurgery Residency, Seoul National University Hospital' },
  { year: '2012-2013', text: 'Internship, Seoul National University Hospital' },
  { year: '2006-2012', text: 'Medical School, Keimyung University' },
];

export const educationPrograms = [
  {
    title: 'International UBE Training Center',
    meta: '2024-current',
    description: 'Hands-on endoscopic spine training with live surgery observation for 80+ surgeons from 15+ countries.',
  },
  {
    title: 'ESS Workshop for Beginners',
    meta: '2025-current',
    description: 'Government-funded national project with Incheon Technopark and Hayan Co., Ltd. for domestic surgeons in Korea.',
  },
  {
    title: 'Cadaver, live animal, and dummy workshops',
    meta: 'Ongoing',
    description: 'Progressive skill acquisition format for portal orientation, anatomy, tissue handling, and full procedural sequence.',
  },
];

export const awards = [
  { year: '2026', text: 'Best Shorts Award, KOSESS' },
  { year: '2025', text: 'Best Research Award, KOSESS' },
  { year: '2024', text: 'Best Paper Award, Korean Neurosurgical Society' },
  { year: '2024', text: 'Most Cited Paper, Neurospine Congress' },
];
