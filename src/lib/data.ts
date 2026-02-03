export const profile = {
  name: {
    ko: "여운탁",
    en: "Woon Tak Yuh",
  },
  degree: "MD, MS",
  title: "Neurosurgeon & AI Researcher",
  subtitle: "Spine Endoscopy Specialist",
  currentPosition: {
    title: "Director, Spine Endoscopy Center",
    organization: "Davos Hospital",
  },
  previousPosition: {
    title: "Assistant Professor, Department of Neurosurgery",
    organization: "Hallym University Dongtan Sacred Heart Hospital",
  },
  education: {
    degree: "MS in Neurosurgery",
    institution: "Seoul National University College of Medicine",
  },
  specialties: [
    "Spine Surgery",
    "Endoscopic Spine Surgery (UBE)",
    "Clinical AI Research",
  ],
  stats: {
    hIndex: 11,
    presentations: "30+",
    workshopsLed: "10+",
    yearsExperience: "15+",
  },
  academicPositions: [
    { role: "Academic Secretary", organization: "KOMISS" },
    { role: "Research Committee", organization: "KOSESS" },
    { role: "Editor", organization: "Neurospine Journal" },
    { role: "Lifetime Member, IT Committee, Editorial Board", organization: "Korean Society of Spine Surgery" },
    { role: "IT Committee", organization: "KOSASS" },
    { role: "Academic Secretary", organization: "Korean Digital Convergence Neurosurgery Research Group" },
    { role: "Full Member", organization: "NASS (North American Spine Society)" },
    { role: "Full Member", organization: "KASS" },
  ],
  educationActivities: [
    {
      title: "International Endoscopic Spine Surgery Training Center",
      description: "Training international physicians in advanced endoscopic techniques",
      period: "2024-2025",
    },
    {
      title: "Endoscopic Spine Surgery Workshop for Beginners",
      description: "Comprehensive training program including dummy, live pig, and cadaver workshops",
      period: "2024-2025",
    },
  ],
  links: {
    googleScholar: "https://scholar.google.com/citations?user=YOUR_ID",
    researchGate: "https://www.researchgate.net/profile/Woon-Tak-Yuh",
    email: "woontak.yuh@gmail.com",
    linkedin: "https://www.linkedin.com/in/woon-tak-yuh-03420311b/",
  },
} as const;

export const navigation = [
  { name: "About", href: "#about" },
  { name: "Experience", href: "#experience" },
  { name: "Research", href: "#research" },
  { name: "Education", href: "#education" },
  { name: "Contact", href: "#contact" },
] as const;
