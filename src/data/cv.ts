export const profileImage = '/images/profile.webp';

export const academicInterests = [
  'MISS',
  'Endoscopic Spine Surgery (UBE)',
  'AI research',
  'Multi-Center Prospective Spine Registry',
] as const;

export const activities = [
  { organization: 'Korean Neurosurgical Society (KNS)', role: 'Board Certified Member' },
  { organization: 'Korean Spinal Neurosurgery Society (KSNS)', role: 'Lifetime Member; Computation Committee' },
  { organization: 'Korean Minimally Invasive Spine Surgery Society (KOMISS)', role: 'Lifetime Member; Scientific Administrator\nKOMISS Registry Steering Committee' },
  { organization: 'World UBE Society (WUBES)', role: 'Member; Auditor' },
  { organization: 'Neurospine', role: 'Editorial Board Member' },
  { organization: 'JMISST', role: 'Editorial Board Member' },
  { organization: 'Videobook of Spinoscopy', role: 'Executive Editor' },
  { organization: 'North American Spine Society (NASS)', role: 'Member' },
  { organization: 'Korean American Spine Society (KASS)', role: 'Member' },
  { organization: 'AO Spine', role: 'Member' },
] as const;

export const currentRoles = [
  ...activities.map(activity => `${activity.organization} · ${activity.role}`),
];

export const education = [
  { year: '2006–2012', text: 'M.D., Keimyung University School of Medicine' },
  { year: '2012–2013', text: 'Internship, Seoul National University Hospital' },
  { year: '2013–2017', text: 'Neurosurgery Residency, Seoul National University Hospital' },
  { year: '2016–2018', text: 'M.S. in Medicine (Neurosurgery), Seoul National University' },
  { year: '2021–2022', text: 'Spine & Epilepsy Fellowship, Seoul National University Hospital' },
  { year: '2025', text: 'AO Spine Fellowship, Keio University School of Medicine' },
];

export const career = [
  { year: '2019–2021', text: 'Director of Neurosurgery, Korea Military Academy Hospital' },
  { year: '2022–2023', text: 'Clinical Assistant Professor, Hallym University Dongtan Sacred Heart Hospital' },
  { year: '2023–2025', text: 'Assistant Professor, Hallym University College of Medicine / Dongtan Sacred Heart Hospital' },
  { year: '2025–Oct 2026', text: 'Director, Center for Endoscopic Spine Surgery, Davos Hospital' },
  { year: 'From Nov 2026', text: 'Clinical Professor, Spine Center, Chamjoeun General Hospital (affiliated with Kyung Hee University Medical Center)' },
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
