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
  { id: "schedule",  label: "Schedule",   x: 21,   y: 61,  color: "#fb923c", rgb: "251,146,60"  }, // calendar centre
  { id: "myself",    label: "About Me",   x: 38,   y: 63,  color: "#60a5fa", rgb: "96,165,250"  }, // mac mini body
  { id: "research",  label: "Research",   x: 49,   y: 72,  color: "#fbbf24", rgb: "251,191,36"  }, // leather notebook centre
  { id: "personal",  label: "Personal",   x: 64,   y: 59,  color: "#f472b6", rgb: "244,114,182" }, // AirPods Max centre
  { id: "ube",       label: "UBE",        x: 76,   y: 42,  color: "#2dd4bf", rgb: "45,212,191"  }, // spine model centre
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
      "Director @ Davos Hospital",
      "",
      "Seoul / Yongin, South Korea",
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
    ],
  },
  myself_career: {
    command: "cat career/timeline.md",
    lines: [
      "",
      "# Career Timeline",
      "━━━━━━━━━━━━━━━━━",
      "",
      "2025  Director, Davos Hospital",
      "2025  AO Spine Fellowship, Keio",
      "2023  Asst Prof, Hallym Univ",
      "2021  Fellowship, SNU Hospital",
      "2019  Director, Military Academy",
      "2017  Board Certified, NS",
      "2013  Residency, SNU Hospital",
      "2006  Medical School, Keimyung",
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

  // ─ UBE ─
  ube: {
    command: "cat surgery/ube.md",
    lines: [
      "",
      "# Unilateral Biportal Endoscopy",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "Cases ····· 500+",
      "Specialty · MIS Spine Surgery",
      "Role ······ Director, ESC",
      "",
      "Notable: UBE resection of high cervical schwannoma",
      "",
    ],
    links: [{ label: "Davos Hospital →", url: SOCIAL_LINKS.hospital }],
    subPages: [
      { label: "What is UBE?", pageKey: "ube_what" },
      { label: "Case Statistics", pageKey: "ube_stats" },
    ],
  },
  ube_what: {
    command: "cat surgery/ube-intro.md",
    lines: [
      "",
      "# What is UBE?",
      "━━━━━━━━━━━━━━━",
      "",
      "Unilateral Biportal Endoscopy",
      "is a cutting-edge minimally",
      "invasive spine surgery that",
      "uses two small portals and",
      "an endoscope for clear",
      "visualization.",
      "",
      "Benefits:",
      "  ├─ Less tissue damage",
      "  ├─ Faster recovery",
      "  ├─ Less postop pain",
      "  └─ Same-day discharge",
      "",
    ],
  },
  ube_stats: {
    command: "cat surgery/statistics.md",
    lines: [
      "",
      "# Case Statistics",
      "━━━━━━━━━━━━━━━━━",
      "",
      "Total cases ····· 500+",
      "Lumbar ·········· 65%",
      "Cervical ········ 25%",
      "Thoracic ········ 10%",
      "",
      "Complications ··· < 2%",
      "Satisfaction ···· 94%",
      "",
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
      "  ├─ AI + Spine Diagnosis",
      "  ├─ ERAS Protocols",
      "  └─ Deep Learning Imaging",
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
      "SpineAlign AI",
      "  Auto spine alignment",
      "  measurement from X-rays",
      "",
      "Fracture Detection",
      "  Deep learning model for",
      "  vertebral fracture dx",
      "",
      "Surgery Dashboard",
      "  Interactive analytics",
      "  for 1,830+ cases",
      "",
    ],
  },
  research_pubs: {
    command: "ls research/publications/",
    lines: [
      "",
      "# Selected Publications",
      "━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "50+ peer-reviewed papers",
      "h-index 11",
      "15+ first/co-first author",
      "",
      "Key journals:",
      "  ├─ Neurospine",
      "  ├─ World Neurosurgery",
      "  ├─ European Spine Journal",
      "  └─ J Korean Neurosurg Soc",
      "",
    ],
    links: [
      { label: "Full list on Scholar →", url: SOCIAL_LINKS.scholar },
      { label: "ResearchGate →", url: SOCIAL_LINKS.researchgate },
    ],
  },

  // ─ Education ─
  education: {
    command: "cat education/training.md",
    lines: [
      "",
      "# Education & Training",
      "━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "International UBE Training Center",
      "  2024–2025, 40+ surgeons, 11+ countries",
      "",
      "Endoscopic Spine Surgery Workshop",
      "  for beginners, 2025–2026",
      "",
    ],
    subPages: [
      { label: "Training Program", pageKey: "edu_program" },
      { label: "Invited Lectures", pageKey: "edu_lectures" },
    ],
  },
  edu_program: {
    command: "cat education/program.md",
    lines: [
      "",
      "# UBE Training Program",
      "━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "Cadaver workshops / Live surgery",
      "Dummy workshops / Online tutorials",
      "",
      "Trainees from 11+ countries:",
      "  Japan, China, India, Thailand,",
      "  Indonesia, Vietnam, Philippines,",
      "  Egypt, Turkey, Brazil...",
      "",
    ],
  },
  edu_lectures: {
    command: "cat education/lectures.md",
    lines: [
      "",
      "# Invited Lectures",
      "━━━━━━━━━━━━━━━━━━",
      "",
      "International conferences",
      "and workshops worldwide.",
      "",
      "  ├─ WCMISST",
      "  ├─ KOMISS Annual Meeting",
      "  ├─ KOSESS Summit",
      "  ├─ AO Spine Events",
      "  └─ Various hospital",
      "     visiting lectures",
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
      "  ○ AI/ML side projects",
      "  ○ AI-agent augmented workflow",
      "  ○ Medical education innovation",
      "  ○ Coffee & late night coding",
      "",
    ],
    subPages: [
      { label: "Side Projects", pageKey: "personal_projects" },
    ],
  },
  personal_projects: {
    command: "ls ~/projects/",
    lines: [
      "",
      "# Side Projects",
      "━━━━━━━━━━━━━━━",
      "",
      "SpineAlign AI · DL spine alignment from X-rays",
      "Spinoscopy · multi-agents dashboard",
      "Patient-specific surgery dashboard",
      "Novel digitally converged PROM",
      "",
    ],
    links: [
      { label: "GitHub →", url: SOCIAL_LINKS.github },
      { label: "Dashboard →", url: "/dashboard" },
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
      "Editorial Board Member,",
      "  Neurospine",
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
      "# Conference & Lecture Schedule",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "Select a year to view details.",
      "",
    ],
    subPages: [
      { label: "2026", pageKey: "schedule_2026" },
      { label: "2025", pageKey: "schedule_2025" },
      { label: "2024", pageKey: "schedule_2024" },
      { label: "2023", pageKey: "schedule_2023" },
    ],
  },
  schedule_2026: {
    command: "cat schedule/2026.md",
    lines: [
      "",
      "# 2026 Schedule",
      "━━━━━━━━━━━━━━━",
      "",
      "Jan 09  KOMISS 신년하례식",
      "Jan 16  대척신 동계 · 무주",
      "Feb 07  PPEM Symposium · 부산",
      "Feb 26  Spine Summit · Phoenix, AZ",
      "Mar 06  척추기초연구회 춘계",
      "Mar 08  신경통증학회 춘계",
      "Mar 13  SNU-Stanford Symposium",
      "Mar 14  KOSESS Summit · 여수",
      "Mar 28  KOMISS 워크샵 · 대만",
      "Apr 04  WUBES",
      "Apr 16  대신 춘계 · 제주",
      "May 08  WCMISST · LA, CA",
      "Jul 09  KASS 2026 · Maui, Hawaii",
      "Aug 29  KOSESS 정기학술대회",
      "Dec 12  11th Neurospine Symp",
      "",
    ],
  },
  schedule_2025: {
    command: "cat schedule/2025.md",
    lines: [
      "",
      "# 2025 Schedule",
      "━━━━━━━━━━━━━━━",
      "",
      "Jan 17  대척신 동계 · 엘리시안 강촌",
      "Feb 15  PPEN 심포지엄 · 부산",
      "Feb 22  KOSESS 임원 워크샵 · 여수",
      "Mar 15  대한노인신경외과학회",
      "Mar 28  대한신경손상학회 춘계",
      "Apr 11  1회 튼튼 심포지엄 · 수원",
      "Apr 17  대신 춘계 · 대구",
      "Apr 25  WUBES 2025 · 서울성모",
      "May 03  Neurospine Symposium",
      "May 23  KOMISS Advanced Course",
      "Jun 13  10th Neurospine Symp",
      "Jul 10  KASS 2025 · Huntington Beach",
      "Jul 22  NASS Int'l · Taipei",
      "Aug 23  KOSESS 정기학술",
      "Sep 04  ASIA Spine 2025 · 부산",
      "Oct 12  신경통증학회 추계",
      "Oct 16  KNS 2025",
      "Oct 25  KOMISS-KOSESS Summit",
      "Nov 06  ThaiSMISST · Bangkok",
      "Nov 14  NASS 2025 · Denver, CO",
      "Nov 28  KOMISS 정기학술 · 인천",
      "Dec 13  9th Neurospine Symp",
      "",
    ],
  },
  schedule_2024: {
    command: "cat schedule/2024.md",
    lines: [
      "",
      "# 2024 Schedule",
      "━━━━━━━━━━━━━━━",
      "",
      "Jan 19  대척신 동계 · 곤지암",
      "Feb 05  DR Spine · Santo Domingo",
      "Feb 25  신경통증학회 36회 정기",
      "Mar 09  Neurosurgery Update",
      "Mar 15  척추기초연구회 춘계",
      "Apr 06  WUBES 2024",
      "Apr 11  WCO 2024 · London",
      "Apr 25  대신 춘계 · 광주",
      "Apr 26  ISASS 2024 · Miami",
      "May 01  LSRS 2024 · Chicago",
      "May 15  Global Spine Congress",
      "        · Bangkok",
      "Jun 15  대신디융 5차 학술대회",
      "Jul 11  KASS 19th · Park City, UT",
      "Sep 05  NSC 2024 · Annual KSNS",
      "Sep 10  SRS 59th · Barcelona",
      "Sep 18  10th ERAS · Malaga, Spain",
      "Oct 02  Eurospine 2024 · Vienna",
      "Oct 12  KOMISS-KOSESS Summit",
      "Oct 17  대신 추계",
      "Oct 25  KOSAIM 정기학회",
      "Nov 09  AO Spine Advanced",
      "Nov 23  KOSASS Annual Meeting",
      "Nov 28  NSK · Japan",
      "Dec 06  World MISS 2024 · 대전",
      "Dec 11  CSRS 2024 · Chicago",
      "Dec 28  7th Neurospine Symp",
      "",
    ],
  },
  schedule_2023: {
    command: "cat schedule/2023.md",
    lines: [
      "",
      "# 2023 Schedule",
      "━━━━━━━━━━━━━━━",
      "",
      "Feb 25  LASS · 서울",
      "Mar 18  척추골다공증연구회 10회",
      "Mar 24  KOSASS 부산증례토론회",
      "Mar 30  대신 춘계 · 제주",
      "May 12  Global Endoscopic Spine Day",
      "May 13  AO Cadaveric Workshop",
      "May 31  Global Spine Congress",
      "        · Prague, Czech",
      "Jun 03  KOMISS 20주년 학회",
      "Jun 10  대신디융-기초연구회",
      "Jul 07  WUBES 2023 · 서울성모",
      "Jul 15  성인 척추변형 심포지엄",
      "Sep 07  15th IANR 2023 Korea",
      "Sep 21  NSC 2023 · Annual KSNS",
      "        · 광주",
      "Oct 04  Eurospine 2023",
      "        · Frankfurt, Germany",
      "Oct 07  KOMISS-KOSESS Summit",
      "        · 제주",
      "Oct 18  NASS 2023 · Los Angeles",
      "Oct 19  대신 추계 63차",
      "Nov 04  KOSESS 2023",
      "Nov 10  MASS Symposium 2023",
      "Nov 29  CSRS 51st · Las Vegas",
      "Dec 01  KOMISS 정기학회",
      "Dec 09  5th Neurospine Symp",
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
          <div className="absolute top-3 left-3 font-mono text-[10px] text-white/40 tracking-wider">
            WTY.md
          </div>
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

      <div className="fixed top-5 left-6 font-mono text-xs text-white/40 tracking-wider">
        WTY.md
      </div>
    </div>
  );
}
