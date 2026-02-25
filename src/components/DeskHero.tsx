import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Data ────────────────────────────────────────────────────────

const SOCIAL_LINKS = {
  email: "woontak.yuh@gmail.com",
  scholar: "https://scholar.google.com/citations?user=tbTBemUAAAAJ",
  linkedin: "https://www.linkedin.com/in/woon-tak-yuh-03420311b/",
  hospital:
    "https://www.davoshospital.co.kr/depart/page02-detail.html?dr_idx=139",
  researchgate:
    "https://www.researchgate.net/profile/Woon-Tak-Yuh?ev=hdr_xprf",
  github: "https://github.com/woontakyuh",
  dashboard: "https://dashboard.takmd.com",
};

type HotspotId =
  | "ube"
  | "myself"
  | "research"
  | "education"
  | "personal"
  | "schedule"
  | "roles";

interface Marker {
  id: HotspotId;
  label: string;
  /** centre of the dot, as % of image */
  x: number;
  y: number;
  color: string;
  rgb: string;
}

// Positions: exact centre of each object in desk3.png
const MARKERS: Marker[] = [
  { id: "roles",     label: "Roles",      x: 8,    y: 23,  color: "#38bdf8", rgb: "56,189,248"  }, // framed certificate on wall
  { id: "schedule",  label: "Presentations", x: 21, y: 55,  color: "#fb923c", rgb: "251,146,60"  }, // calendar centre
  { id: "myself",    label: "About Me",   x: 35,   y: 66,  color: "#60a5fa", rgb: "96,165,250"  }, // mac mini body
  { id: "research",  label: "Research",   x: 49,   y: 72,  color: "#fbbf24", rgb: "251,191,36"  }, // leather notebook centre
  { id: "personal",  label: "Personal",   x: 64,   y: 59,  color: "#f472b6", rgb: "244,114,182" }, // AirPods Max centre
  { id: "ube",       label: "Spine Surgery", x: 76, y: 42,  color: "#2dd4bf", rgb: "45,212,191"  }, // spine model centre
  { id: "education", label: "Education",  x: 88,   y: 56,  color: "#a78bfa", rgb: "167,139,250" }, // textbooks centre
];

const MONITOR = { x: 32, y: 28, w: 37, h: 30 };

// ─── Terminal page contents ──────────────────────────────────────

interface TermPage {
  command: string;
  lines: string[];
  links?: { label: string; url: string }[];
  subPages?: { label: string; pageKey: string }[];
}

const PAGES: Record<string, TermPage> = {
  // ─ Myself ─
  myself: {
    command: "whoami",
    lines: [
      "",
      "Woon Tak Yuh, MD",
      "━━━━━━━━━━━━━━━━━",
      "",
      "Spine Surgeon & AI Researcher",
      "Director, Center for Endoscopic Spine Surgery",
      "Davos Hospital, South Korea",
      "",
    ],
    links: [
      { label: "LinkedIn", url: SOCIAL_LINKS.linkedin },
      { label: "Scholar", url: SOCIAL_LINKS.scholar },
      { label: "Email", url: `mailto:${SOCIAL_LINKS.email}` },
    ],
    subPages: [
      { label: "Career Timeline", pageKey: "myself_career" },
      { label: "Affiliations", pageKey: "myself_affiliations" },
      { label: "Awards", pageKey: "myself_awards" },
    ],
  },
  myself_career: {
    command: "cat career/timeline.md",
    lines: [
      "",
      "# Career Timeline",
      "━━━━━━━━━━━━━━━━━",
      "",
      "2025-      Director, Davos Hospital",
      "2025       AO Spine Fellowship, Keio",
      "2024       WSO Mission, Dominican Republic",
      "2023-2025  Asst Prof, Hallym Univ",
      "2021-2022  Spine Fellowship, SNUH",
      "2019-2021  Director, Korean Military Academy",
      "2017       Board Certified, NS",
      "2013-2017  Neurosurgery Residency, SNUH",
      "2012-2013  Internship, SNUH",
      "2006-2012  Medical School, Keimyung",
      "",
    ],
  },
  myself_affiliations: {
    command: "cat affiliations.md",
    lines: [
      "",
      "# Affiliations",
      "━━━━━━━━━━━━━━",
      "",
      "KNS ········· Board Certified",
      "KSNS ········ Lifetime Member",
      "KOMISS ······ Academic Committee",
      "KOSESS ······ Education Committee",
      "Neurospine ·· Editorial Board",
      "NASS ········ Member",
      "KASS ········ Member",
      "AO Spine ···· Member",
      "",
    ],
  },
  myself_awards: {
    command: "cat awards.md",
    lines: [
      "",
      "# Awards",
      "━━━━━━━━",
      "",
      "2025 Best Research Award, KOSESS",
      "2024 Best Paper (이헌재학술상), KNS",
      "2024 Most Cited Paper, NSC",
      "",
    ],
  },

  // ─ UBE ─
  ube: {
    command: "cat surgery/overview.md",
    lines: [
      "",
      "# Spine Surgery",
      "━━━━━━━━━━━━━━━",
      "",
      "Cases ····· 500+",
      "Levels ···· 700+",
      "Role ······ Director, Center for",
      "            Endoscopic Spine Surgery",
      "",
    ],
    links: [
      { label: "Surgery Dashboard →", url: "/dashboard" },
      { label: "Davos Hospital →", url: SOCIAL_LINKS.hospital },
    ],
    subPages: [
      { label: "UBE (Unilateral Biportal Endoscopy)", pageKey: "surgery_ube" },
      { label: "MIS (Minimally Invasive Surgery)", pageKey: "surgery_mis" },
      { label: "Tumor", pageKey: "surgery_tumor" },
    ],
  },
  surgery_ube: {
    command: "cat surgery/ube.md",
    lines: [
      "",
      "# UBE",
      "━━━━━",
      "",
      "Unilateral Biportal Endoscopy",
      "",
      "Two small portals + endoscope",
      "for clear visualization.",
      "Less tissue damage, faster recovery.",
      "",
    ],
    links: [
      { label: "JMISST →", url: "https://doi.org/10.21182/jmisst.2025.02747" },
    ],
  },
  surgery_mis: {
    command: "cat surgery/mis.md",
    lines: [
      "",
      "# MIS",
      "━━━━━",
      "",
      "Minimally Invasive Spine Surgery",
      "",
      "MIS-TLIF / OLIF / LLIF",
      "Percutaneous pedicle screw fixation",
      "",
    ],
  },
  surgery_tumor: {
    command: "cat surgery/tumor.md",
    lines: [
      "",
      "# Tumor",
      "━━━━━━━",
      "",
      "Spinal cord & column tumors",
      "",
      "Schwannoma, meningioma,",
      "ependymoma, hemangioblastoma,",
      "metastatic spine tumors",
      "",
    ],
    subPages: [
      { label: "Published Papers", pageKey: "tumor_pubs" },
    ],
  },
  tumor_pubs: {
    command: "cat surgery/tumor-publications.md",
    lines: [
      "",
      "# Tumor Publications",
      "━━━━━━━━━━━━━━━━━━━━",
      "",
      "UBE Cervical Schwannoma · JMISST 2026",
      "Schwannoma Classification · Neurospine 2024",
      "ERAS in Spinal Tumors · J Neurosurg Spine 2023",
      "C1-C2 Epidural Schwannomas · Acta Neurochir 2023",
      "Embolization Timing · J Korean Neurosurg Soc 2023",
      "Hemangioblastoma · Oper Neurosurg 2022",
      "En Bloc Spondylectomy · Neurospine 2022",
      "MRI in Cord Tumors · Sci Rep 2022",
      "Subependymoma · J Korean Neurosurg Soc 2018",
      "Oligodendroglioma · Korean J Spine 2015",
      "",
    ],
    links: [
      { label: "JMISST 2026 →", url: "https://doi.org/10.21182/jmisst.2025.02747" },
      { label: "Neurospine 2024 →", url: "https://doi.org/10.14245/ns.2448468.234" },
      { label: "J Neurosurg Spine →", url: "https://doi.org/10.3171/2023.10.Spine23512" },
      { label: "Acta Neurochir →", url: "https://doi.org/10.1007/s00701-023-05707-2" },
    ],
  },

  // ─ Research ─
  research: {
    command: "ls research/",
    lines: [
      "",
      "Publications ···· 50+",
      "h-index ········· 11",
      "First author ···· 15+ papers",
      "",
      "Focus:",
      "  ├─ Endoscopic Spine Surgery",
      "  ├─ Spinal Tumor Research",
      "  ├─ AI Research",
      "  └─ ERAS in Spine Surgery",
      "",
    ],
    links: [
      { label: "Google Scholar →", url: SOCIAL_LINKS.scholar },
      { label: "ResearchGate →", url: SOCIAL_LINKS.researchgate },
    ],
    subPages: [
      { label: "AI Research", pageKey: "research_ai" },
      { label: "Publications", pageKey: "research_pubs" },
    ],
  },
  research_ai: {
    command: "cat research/ai-projects.md",
    lines: [
      "",
      "# AI Research Projects",
      "━━━━━━━━━━━━━━━━━━━━━",
      "",
      "DL Thoracolumbar Fx Measurement",
      "  → Neurospine 2024",
      "CNN Lumbar Spinal Stenosis Dx",
      "  → Sci Rep 2024",
      "DL Whole-Spine Landmark ID",
      "  → Bioengineering 2024",
      "DL Osteoporotic VCF Detection",
      "  → Sci Rep 2024",
      "Foundation Model Vertebral Collapse",
      "  → Sci Rep 2024",
      "Surgery Dashboard – 1,830+ cases",
      "",
    ],
  },
  research_pubs: {
    command: "ls research/publications/",
    lines: [
      "",
      "# Published Papers",
      "━━━━━━━━━━━━━━━━━━",
      "",
      "50+ peer-reviewed papers",
      "h-index 11",
      "15+ first/co-first author",
      "",
    ],
    links: [
      { label: "Full list on Scholar →", url: SOCIAL_LINKS.scholar },
      { label: "ResearchGate →", url: SOCIAL_LINKS.researchgate },
    ],
    subPages: [
      { label: "1st / Co-1st Author", pageKey: "pubs_first" },
      { label: "Co-Author", pageKey: "pubs_co" },
    ],
  },
  pubs_first: {
    command: "cat research/publications/first-author.md",
    lines: [
      "",
      "# 1st & Co-1st Author (15)",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      " 1. Spinal Cord Oligodendroglioma. KJ Spine 2015",
      " 2. Chiari Malformation Type 1. JKNS 2016",
      " 3. Spinal Cord Subependymoma. JKNS 2018",
      " 4. COVID-19 Contact Tracing. JMIR 2020",
      " 5. Endoscopic Lumbar Discectomy. IJP 2022",
      " 6. Hemangioblastoma Resection. Oper Neurosurg 2022",
      " 7. Cervical Reoperation Rate. Sci Rep 2023",
      " 8. Embolization Timing for Mets. JKNS 2023",
      " 9. Future of Endoscopic Spine. Bioeng 2023",
      "10. ERAS in All Spine Surgery. JNS Spine 2023",
      "11. DL Thoracolumbar Fx. Neurospine 2024",
      "12. Lumbar Surgery COVID Trends. PLoS One 2024",
      "13. Pharmacologic Tx in SCI. KJ Neurotrauma 2025",
      "14. Indigo Carmine in UBE. JMISST 2025",
      "15. UBE Cervical Schwannoma C1-2. JMISST 2026",
      "",
    ],
  },
  pubs_co: {
    command: "cat research/publications/co-author.md",
    lines: [
      "",
      "# Co-Author Papers (14)",
      "━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      " 1. Interlaminar Endoscopic Discectomy. IJSS 2021",
      " 2. Failure After En Bloc Spondylectomy. Neurospine 2022",
      " 3. MRI in Spinal Cord Tumors. Sci Rep 2022",
      " 4. Pressure Injury in Prone Surgery. JNA 2022",
      " 5. Genetic Odyssey to OPLL. Neurospine 2022",
      " 6. Decompression vs Fusion for LSS. Sci Rep 2022",
      " 7. C1-C2 Epidural Schwannomas. Acta Neurochir 2023",
      " 8. C3 Laminectomy in Laminoplasty RCT. Spine J 2023",
      " 9. OLIF: Double vs Nav Single Lateral. PLoS One 2023",
      "10. Multi-Pose CNN for Stenosis. Sci Rep 2024",
      "11. DL Whole-Spine Landmarks. Bioeng 2024",
      "12. Schwannoma Classification by MRI. Neurospine 2024",
      "13. AP vs Lateral DL for VCF. Sci Rep 2024",
      "14. VCF Prediction via Foundation Model. Sci Rep 2024",
      "",
    ],
  },

  // ─ Education ─
  education: {
    command: "cat education/overview.md",
    lines: [
      "",
      "# UBE Education",
      "━━━━━━━━━━━━━━━",
      "",
      "Teaching endoscopic spine surgery",
      "",
    ],
    subPages: [
      { label: "International Training Center", pageKey: "edu_intl" },
      { label: "ESS Workshop for Beginners", pageKey: "edu_workshop" },
    ],
  },
  edu_intl: {
    command: "cat education/intl-center.md",
    lines: [
      "",
      "# International UBE Training Center",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "2024–current, 80+ surgeons, 15+ countries",
      "",
      "Hands-on surgical training",
      "with live surgery observation",
      "",
      "Trainees from 15+ countries:",
      "  Japan, China, India, Thailand,",
      "  Indonesia, Vietnam, Philippines,",
      "  Egypt, Turkey, Brazil...",
      "",
    ],
  },
  edu_workshop: {
    command: "cat education/ess-workshop.md",
    lines: [
      "",
      "# ESS Workshop for Beginners",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "2025–current",
      "Government-funded national project",
      "w/ Incheon Technopark & Hayan Medical",
      "",
      "For domestic surgeons in Korea",
      "",
      "  ○ Dummy workshop",
      "  ○ Live animal workshop",
      "  ○ Cadaver workshop",
      "",
    ],
  },

  // ─ Personal ─
  personal: {
    command: "cat ~/personal.md",
    lines: [
      "",
      "Interests beyond the OR:",
      "",
    ],
    subPages: [
      { label: "Vibe Coding", pageKey: "personal_vibe" },
      { label: "BJJ", pageKey: "personal_bjj" },
      { label: "Family", pageKey: "personal_family" },
      { label: "Etc", pageKey: "personal_etc" },
    ],
  },
  personal_vibe: {
    command: "cat ~/vibe-coding.md",
    lines: [
      "",
      "# Vibe Coding",
      "━━━━━━━━━━━━━",
      "",
      "Built with Claude Code",
      "",
      "  ○ takmd.com (this site)",
      "  ○ Surgery Dashboard",
      "  ○ Multi-Agents Dashboard",
      "  ○ Patient-Specific Dashboard",
      "",
    ],
    links: [
      { label: "GitHub →", url: SOCIAL_LINKS.github },
      { label: "Surgery Dashboard →", url: "/dashboard" },
      { label: "Multi-Agents Dashboard →", url: SOCIAL_LINKS.dashboard },
    ],
  },
  personal_bjj: {
    command: "cat ~/bjj.md",
    lines: [
      "",
      "# Brazilian Jiu-Jitsu",
      "━━━━━━━━━━━━━━━━━━━━━",
      "",
      "Training since 2019",
      "Blue Belt",
      "",
    ],
  },
  personal_family: {
    command: "cat ~/family.md",
    lines: [
      "",
      "# Family",
      "━━━━━━━━",
      "",
      "Jinju's husband",
      "Chris's dad",
      "",
    ],
  },
  personal_etc: {
    command: "cat ~/etc.md",
    lines: [
      "",
      "# Etc",
      "━━━━━━",
      "",
      "Nose riding · 9'6\" Beacon, Bing Surfboards",
      "Giant Slalom · Alpine Snowboard, F2",
      "FSD · Model 3 Highland, Tesla",
      "Crypto",
      "",
    ],
  },

  // ─ Roles (nameplate) ─
  roles: {
    command: "cat roles/current.md",
    lines: [
      "",
      "# Society Roles & Positions",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "Editorial Board Member, Neurospine (IF 3.6)",
      "Academic Committee, KOMISS",
      "Education Committee, KOSESS",
      "Computation Committee, KSNS",
      "Academic Committee, KNDCRS",
      "",
    ],
    subPages: [
      { label: "Neurospine", pageKey: "roles_neurospine" },
      { label: "KOMISS (Korean Minimally Invasive Spine Society)", pageKey: "roles_komiss" },
      { label: "KOSESS (Korean Research Society of Endoscopic Spine Surgery)", pageKey: "roles_kosess" },
      { label: "KSNS (Korean Spinal Neurosurgery Society)", pageKey: "roles_ksns" },
      { label: "KNDCRS (Korean Neurosurgical Digital Convergence Research Society)", pageKey: "roles_kndcrs" },
    ],
  },
  roles_neurospine: {
    command: "cat roles/neurospine.md",
    lines: [
      "",
      "# AI Section Editor",
      "━━━━━━━━━━━━━━━━━━━",
      "",
      "Neurospine",
      "Official journal of KSNS",
      "(Korean Spinal Neurosurgery",
      "Society)",
      "",
      "AI & computational research",
      "in spine surgery and",
      "neuroscience",
      "",
    ],
  },
  roles_komiss: {
    command: "cat roles/komiss.md",
    lines: [
      "",
      "# Academic Committee",
      "━━━━━━━━━━━━━━━━━━━━",
      "",
      "KOMISS",
      "Korean Minimally Invasive",
      "Spine Society",
      "",
    ],
  },
  roles_kosess: {
    command: "cat roles/kosess.md",
    lines: [
      "",
      "# Education Committee",
      "━━━━━━━━━━━━━━━━━━━━━",
      "",
      "KOSESS",
      "Korean Research Society of",
      "Endoscopic Spine Surgery",
      "",
    ],
  },
  roles_ksns: {
    command: "cat roles/ksns.md",
    lines: [
      "",
      "# Computation Committee",
      "━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "KSNS",
      "Korean Spinal Neurosurgery",
      "Society",
      "",
    ],
  },
  roles_kndcrs: {
    command: "cat roles/kndcrs.md",
    lines: [
      "",
      "# Academic Committee",
      "━━━━━━━━━━━━━━━━━━━━",
      "",
      "KNDCRS",
      "Korean Neurosurgical Digital",
      "Convergence Research Society",
      "",
    ],
  },

  // ─ Schedule ─
  schedule: {
    command: "cat schedule/overview.md",
    lines: [
      "",
      "# Presentations & Lectures",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "Browse by year.",
      "",
    ],
    subPages: [
      { label: "2026", pageKey: "schedule_2026" },
      { label: "2025", pageKey: "schedule_2025" },
      { label: "2024", pageKey: "schedule_2024" },
      { label: "2023", pageKey: "schedule_2023" },
      { label: "2022", pageKey: "schedule_2022" },
      { label: "2021", pageKey: "schedule_2021" },
    ],
  },
  schedule_2026: {
    command: "cat schedule/2026.md",
    lines: [
      "",
      "# 2026 Upcoming",
      "━━━━━━━━━━━━━━━━",
      "",
      "Feb 26  Spine Summit",
      "Mar 14  경추-부울경 합동 심포지엄",
      "Mar 28  KOMISS 대만 워크샵",
      "Apr 04  WUBES 2026",
      "May 08  WCMISST",
      "Jul 09  KASS 2026",
      "",
    ],
  },
  schedule_2025: {
    command: "cat schedule/2025.md",
    lines: [
      "",
      "# 2025 Upcoming",
      "━━━━━━━━━━━━━━━━",
      "",
      "Jan 18  NT Focus",
      "  → Potential Pharmacological Treatment of Spinal Cord Injury",
      "Feb 23  KOSESS 임원진",
      "Mar 15  Geriatric Neurosurgery Society",
      "  → ERAS in Geriatric Population",
      "Mar 28  손상 임원진 워크샵",
      "May 03  Neurospine",
      "May 04  UBE Dummy 1",
      "May 24  KOMISS",
      "May 31  신경손상학회",
      "Jun 15  UBE Dummy 2",
      "Jul 10  KASS 2025",
      "Aug 23  KOSESS",
      "Sep 04  ASIA Spine & KSNS",
      "Sep 14  나누리 22주년 심포지엄",
      "  → ERAS in Spine Surgery",
      "Oct 16  KNS",
      "Nov 07  ThaiSMISST",
      "  → UBE High Cervical Dumbbell Schwannoma Removal",
      "Nov 28  KOMISS",
      "Dec 13  Neurospine Symposium",
      "Dec 20  Animal Workshop",
      "",
    ],
  },
  schedule_2024: {
    command: "cat schedule/2024.md",
    lines: [
      "",
      "# 2024 Presentations & Lectures",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "── Invited Lectures ──────",
      "12.28 Neurospine Symposium",
      "  → AI Tools for Spinal Imaging and Diagnosis",
      "12.08 World MISS 2024",
      "  → The Developmental Status of Spinal Endoscopic Tools: Scopes, Surgical Instruments and Navigation Systems",
      "12.04 Chonnam Univ. Hospital CDW Symposium",
      "  → Deep Learning Applications in Spinal Diagnostics: From Fracture Quantification to Collapse Progression Prediction",
      "10.13 Korean Pain Research Society",
      "  → Lumbar Spinal Pain을 유발하는 질환의 최신 수술 지견: Percutaneous Surgery (PELD, UBE, Endofusion)",
      "10.11 Hwaseong Community Health Lecture",
      "  → 퇴행성 척추질환의 적절한 관리, 진단 치료",
      "09.27 Neurotrauma Symposium",
      "  → How to Manage CNCP (Chronic Non Cancer Pain) in Elderly",
      "04.26 Vietnam Endoscopic Spine Surgery Symposium",
      "  → Introduction to UBE Surgery - Pearls and Pitfalls",
      "03.23 KOSESS-KSNS Honam Joint Symposium",
      "  → Endoscopic Surgery in Infectious Spondylo-Discitis",
      "",
      "── Oral Presentations ────",
      "11.23 KOSASS",
      "  → UBE Removal of a Cervical Extradural Schwannoma at C1-C2 Level",
      "10.12 KOMISS-KOSESS Summit",
      "  → Delayed Spinous Process Fracture After Endoscopic ULBD Surgery",
      "07.11 KASS 2024, Park City, UT, USA",
      "  → Deep Learning-Assisted Quantitative Measurement of Thoracolumbar Fracture Features on Lateral Radiographs",
      "04.06 WUBES 2024 Annual Meeting",
      "  → The Revisit of Intraoperative Indigo Carmine in UBE Surgery for Protecting Neural Injury",
      "03.22 KOSASS Case Conference",
      "  → Deep Learning-Assisted Quantitative Measurement of Thoracolumbar Fracture Features on Lateral Radiographs",
      "",
    ],
  },
  schedule_2023: {
    command: "cat schedule/2023.md",
    lines: [
      "",
      "# 2023 Presentations & Lectures",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "── Invited Lectures ──────",
      "12.02 5th Biospine Annual Meeting",
      "  → Automated Deep Learning System for Quantitative Measurement of Vertebral Body Compression and Kyphotic Angle in Thoracolumbar Fracture Patients using Radiography",
      "09.09 15th IANR 2023 Korea",
      "  → Trends in Lumbar Spinal Surgery During the COVID-19 Pandemic in a National Health Insurance System",
      "",
      "── Oral Presentations ────",
      "08.16 ISASS AP 2023",
      "  → The Comprehensive ERAS Protocol in Spinal Surgery: A Comparative Analysis of Clinical Outcomes and Medical Costs between Primary Spinal Tumors and Degenerative Spinal Diseases",
      "07.15 12th Adult Spinal Deformity Symposium",
      "  → Surgery for Kyphotic Deformity After TL Junctional Fracture in Severe Osteoporotic Patient",
      "07.10 KNDCRS-Basic Science Joint Meeting",
      "  → Trends in Lumbar Spinal Surgery During the COVID-19 Pandemic in a National Health Insurance System",
      "",
    ],
  },
  schedule_2022: {
    command: "cat schedule/2022.md",
    lines: [
      "",
      "# 2022 Oral Presentations",
      "━━━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "11.16 CSRS 50th Annual Meeting, San Diego, CA, USA",
      "  → Reduced Tethering of Nerve Root by Medial Bony Trough May Reduce C5 Palsy in Cervical Laminoplasty",
      "09.22 ASIA Spine 2022 13th Joint Meeting",
      "  → Comprehensive Enhanced Recovery After Surgery (ERAS) in Spine Surgery: A Single-Center 19-Year Experience and Clinical Outcomes",
      "08.27 2nd NS-OS Tumor Joint Meeting",
      "  → AESOP Syndrome with Multiple Myeloma Diagnosed by Plasmacytoma at the Lumbar Spinous Process",
      "06.18 Cervical Spine Research Society 15th Meeting",
      "  → The Additional Surgery Rate After Anterior or Posterior Cervical Spinal Surgery: Nationwide Sample Data Analysis",
      "06.11 KNDCRS",
      "  → The Additional Surgery Rate After Anterior or Posterior Cervical Spinal Surgery: Nationwide Sample Data Analysis",
      "04.23 KNS Spring Meeting",
      "  → Intra-thoracic Paraspinal Tumor Surgery using a VATS Technique: A Single-center Experience and Feasibility Outcomes",
      "03.11 KSNS Spring Meeting",
      "  → Long Term Surgical Outcomes of Fusion-only Surgery for Atlantoaxial Instability with Retro-odontoid Pseudotumor",
      "02.26 Cervical Spine Case Review",
      "  → Occurrence of Cervical Kyphosis after Removal of C1-2 Schwannoma",
      "",
    ],
  },
  schedule_2021: {
    command: "cat schedule/2021.md",
    lines: [
      "",
      "# 2021",
      "━━━━━━",
      "",
      "AESC",
      "Asan BME Symposium",
      "KNS 추계",
      "KOMISS Cadaver Symposium",
      "KORSIS",
      "KSNS & WSCS 추계",
      "Medtronic Cadaver Workshop",
      "Young Researcher",
      "성인변형-경추연구회 추계",
      "제10차 성인 척추변형 심포지엄",
      "",
    ],
  },
};

// ─── Components ──────────────────────────────────────────────────

function TypewriterText({ text, speed = 25 }: { text: string; speed?: number }) {
  const [len, setLen] = useState(0);

  useEffect(() => {
    setLen(0);
  }, [text]);

  useEffect(() => {
    if (len >= text.length) return;
    const t = setTimeout(() => setLen((l) => l + 1), speed);
    return () => clearTimeout(t);
  }, [len, text, speed]);

  return <>{text.slice(0, len)}</>;
}

function TerminalView({
  rootPageKey,
  onClose,
  mobile = false,
}: {
  rootPageKey: HotspotId;
  onClose: () => void;
  mobile?: boolean;
}) {
  const [pageStack, setPageStack] = useState<string[]>([rootPageKey]);
  const [typingDone, setTypingDone] = useState(false);
  const [bodyText, setBodyText] = useState("");
  const pageKey = pageStack[pageStack.length - 1];
  const page = PAGES[pageKey];
  const allText = page.lines.join("\n");

  useEffect(() => {
    setBodyText("");
    setTypingDone(false);
  }, [pageKey]);

  useEffect(() => {
    setPageStack([rootPageKey]);
  }, [rootPageKey]);

  useEffect(() => {
    if (bodyText.length >= allText.length) {
      setTypingDone(true);
      return;
    }
    const t = setTimeout(
      () => setBodyText(allText.slice(0, bodyText.length + 1)),
      10,
    );
    return () => clearTimeout(t);
  }, [bodyText, allText]);

  const goBack = () => {
    if (pageStack.length > 1) setPageStack((s) => s.slice(0, -1));
    else onClose();
  };

  const goSub = (subKey: string) => setPageStack((s) => [...s, subKey]);

  return (
    <div className="w-full h-full flex flex-col font-mono text-green-400 overflow-hidden relative">
      {/* CRT scanlines */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,65,0.03) 2px,rgba(0,255,65,0.03) 4px)",
        }}
      />

      {/* Top bar */}
      <div className={`shrink-0 flex items-center justify-between z-20 ${mobile ? "px-4 pt-3 pb-1" : "px-[6%] pt-[5%] pb-[2%]"}`}>
        <button
          onClick={goBack}
          className={`${mobile ? "text-xs" : "text-[min(1.2vw,11px)]"} text-green-600 hover:text-green-400 transition-colors pointer-events-auto`}
        >
          {pageStack.length > 1 ? "← back" : "✕ close"}
        </button>
        <span className={`${mobile ? "text-[10px]" : "text-[min(1vw,10px)]"} text-green-700`}>
          {pageStack.join(" / ")}
        </span>
      </div>

      {/* Command line */}
      <div className={`shrink-0 leading-relaxed z-20 ${mobile ? "px-4 text-sm" : "px-[6%] text-[min(1.3vw,13px)]"}`}>
        <span className="text-green-500">~</span>
        <span className="text-green-600"> $ </span>
        <TypewriterText text={page.command} speed={25} />
      </div>

      {/* Body */}
      <div className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden z-20 scrollbar-hide ${mobile ? "px-4 pb-4" : "px-[6%] pb-[4%]"}`}>
        <pre className={`${mobile ? "text-[13px] leading-[1.8]" : "text-[min(1.15vw,11.5px)] leading-[1.7]"} whitespace-pre-wrap break-words text-green-300`}>
          {bodyText}
          {!typingDone && (
            <span className="inline-block w-[0.5em] h-[1em] bg-green-400 ml-0.5 animate-pulse align-middle" />
          )}
        </pre>

        {typingDone && page.links && (
          <motion.div
            className="flex flex-wrap gap-2 mt-1 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {page.links.map((l) => (
              <a
                key={l.label}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${mobile ? "text-xs px-3 py-1" : "text-[min(1.05vw,10.5px)] px-2 py-0.5"} border border-green-500/40 rounded text-green-400 hover:bg-green-500/10 hover:border-green-400/60 transition-colors`}
              >
                {l.label}
              </a>
            ))}
          </motion.div>
        )}

        {typingDone && page.subPages && (
          <motion.div
            className="flex flex-col gap-1.5 mt-3 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {page.subPages.map((sp) => (
              <button
                key={sp.pageKey}
                onClick={() => goSub(sp.pageKey)}
                className={`text-left ${mobile ? "text-xs px-3 py-2" : "text-[min(1.1vw,11px)] px-2 py-1"} border border-green-500/30 rounded text-green-400 hover:bg-green-500/10 hover:border-green-400/50 transition-colors`}
              >
                → {sp.label}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

/**
 * Glowing dot marker — wider hit area, centred on the object.
 */
function DotMarker({
  marker,
  isHovered,
  isLocked,
  onHover,
  onLeave,
  onClick,
}: {
  marker: Marker;
  isHovered: boolean;
  isLocked: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const active = isHovered || isLocked;

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 flex items-center justify-center"
      style={{
        left: `${marker.x}%`,
        top: `${marker.y}%`,
        /* wider circular hit area */
        width: 56,
        height: 56,
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      {/* Glow ring */}
      <motion.div
        className="absolute rounded-full"
        animate={{
          width: active ? 40 : 20,
          height: active ? 40 : 20,
          opacity: active ? 0.4 : 0.15,
        }}
        transition={{ duration: 0.3 }}
        style={{
          background: `radial-gradient(circle, rgba(${marker.rgb},0.6) 0%, transparent 70%)`,
        }}
      />

      {/* Dot */}
      <motion.div
        className="relative rounded-full"
        animate={{
          width: active ? 12 : 7,
          height: active ? 12 : 7,
          boxShadow: active
            ? `0 0 10px rgba(${marker.rgb},0.9), 0 0 25px rgba(${marker.rgb},0.4)`
            : `0 0 6px rgba(${marker.rgb},0.5)`,
        }}
        transition={{ duration: 0.3 }}
        style={{ backgroundColor: marker.color }}
      />

      {/* Label */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-mono pointer-events-none"
        style={{
          bottom: "100%",
          marginBottom: 6,
          color: marker.color,
          fontSize: "min(1.1vw, 11px)",
          textShadow: `0 0 8px rgba(${marker.rgb},0.6)`,
        }}
        initial={false}
        animate={{ opacity: active ? 1 : 0, y: active ? 0 : 4 }}
        transition={{ duration: 0.2 }}
      >
        {marker.label}
      </motion.div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────

export default function DeskHero() {
  const [hovered, setHovered] = useState<HotspotId | null>(null);
  const [locked, setLocked] = useState<HotspotId | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [imageDims, setImageDims] = useState({
    width: 0,
    height: 0,
    offsetX: 0,
    offsetY: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const activeSpot = locked ?? hovered;

  const updateDims = useCallback(() => {
    const c = containerRef.current;
    const img = imgRef.current;
    if (!c || !img) return;
    const cW = c.clientWidth;
    const cH = c.clientHeight;
    const nW = img.naturalWidth || 1024;
    const nH = img.naturalHeight || 680;
    const iA = nW / nH;
    const cA = cW / cH;
    let rW: number, rH: number;
    if (cA > iA) {
      rH = cH;
      rW = cH * iA;
    } else {
      rW = cW;
      rH = cW / iA;
    }
    setImageDims({
      width: rW,
      height: rH,
      offsetX: (cW - rW) / 2,
      offsetY: (cH - rH) / 2,
    });
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    updateDims();
    window.addEventListener("resize", () => {
      checkMobile();
      updateDims();
    });
    return () => window.removeEventListener("resize", updateDims);
  }, [updateDims]);

  const handleClick = (id: HotspotId) =>
    setLocked((prev) => (prev === id ? null : id));

  const handleBgClick = () => {
    if (locked) setLocked(null);
  };

  // ─── Mobile layout ──────────────────────────────────────────────
  if (isMobile) {
    return (
      <div
        className="flex flex-col min-h-screen bg-[#0a0a0a] select-none"
        onClick={handleBgClick}
      >
        {/* Hero image with dots */}
        <div
          ref={containerRef}
          className="relative w-full shrink-0"
          style={{ aspectRatio: "1024 / 680" }}
        >
          <img
            ref={imgRef}
            src="/desk-setup.png"
            alt="Desk setup"
            className="absolute inset-0 w-full h-full object-contain"
            onLoad={updateDims}
            draggable={false}
          />
          {imageDims.width > 0 && (
            <div
              className="absolute"
              style={{
                left: imageDims.offsetX,
                top: imageDims.offsetY,
                width: imageDims.width,
                height: imageDims.height,
              }}
            >
              {MARKERS.map((m) => (
                <DotMarker
                  key={m.id}
                  marker={m}
                  isHovered={false}
                  isLocked={locked === m.id}
                  onHover={() => {}}
                  onLeave={() => {}}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleClick(m.id);
                  }}
                />
              ))}
            </div>
          )}
          <button
            onClick={() => setLocked(null)}
            className="absolute top-3 left-3 font-mono text-[10px] text-white/40 tracking-wider hover:text-white/70 transition-colors cursor-pointer"
          >
            WTY.md
          </button>
        </div>

        {/* Terminal below image */}
        <AnimatePresence mode="wait">
          {locked && (
            <motion.div
              key={`mobile-term-${locked}`}
              className="flex-1 min-h-[50vh] bg-black/95 border-t border-green-500/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <TerminalView
                rootPageKey={locked}
                onClose={() => setLocked(null)}
                mobile
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!locked && (
          <div className="py-4 text-center font-mono text-[10px] text-white/25">
            tap the dots to explore
          </div>
        )}
      </div>
    );
  }

  // ─── Desktop layout ─────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen bg-[#0a0a0a] overflow-hidden select-none"
      onClick={handleBgClick}
    >
      <img
        ref={imgRef}
        src="/desk-setup.png"
        alt="Desk setup"
        className="absolute"
        style={{
          left: imageDims.offsetX,
          top: imageDims.offsetY,
          width: imageDims.width,
          height: imageDims.height,
        }}
        onLoad={updateDims}
        draggable={false}
      />

      {imageDims.width > 0 && (
        <div
          className="absolute"
          style={{
            left: imageDims.offsetX,
            top: imageDims.offsetY,
            width: imageDims.width,
            height: imageDims.height,
          }}
        >
          {MARKERS.map((m) => (
            <DotMarker
              key={m.id}
              marker={m}
              isHovered={hovered === m.id}
              isLocked={locked === m.id}
              onHover={() => {
                if (!locked) setHovered(m.id);
              }}
              onLeave={() => {
                if (!locked) setHovered(null);
              }}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleClick(m.id);
              }}
            />
          ))}

          {/* Monitor screen */}
          <div
            className="absolute overflow-hidden"
            style={{
              left: `${MONITOR.x}%`,
              top: `${MONITOR.y}%`,
              width: `${MONITOR.w}%`,
              height: `${MONITOR.h}%`,
              borderRadius: "0.6%",
            }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <AnimatePresence mode="wait">
              {activeSpot && (
                <motion.div
                  key={activeSpot}
                  className="absolute inset-0 bg-black/92"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <TerminalView
                    rootPageKey={activeSpot}
                    onClose={() => setLocked(null)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      <AnimatePresence>
        {!locked && (
          <motion.div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 font-mono text-[11px] text-white/30 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1 }}
          >
            hover or click the dots to explore
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => { setLocked(null); setHovered(null); }}
        className="fixed top-5 left-6 font-mono text-xs text-white/40 tracking-wider hover:text-white/70 transition-colors cursor-pointer z-50"
      >
        WTY.md
      </button>
    </div>
  );
}
