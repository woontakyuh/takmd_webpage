import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

const SOCIAL_LINKS = {
  email: "woontak.yuh@gmail.com",
  scholar: "https://scholar.google.com/citations?user=tbTBemUAAAAJ",
  researchgate: "https://www.researchgate.net/profile/Woon-Tak-Yuh",
  linkedin: "https://www.linkedin.com/in/woon-tak-yuh-03420311b/",
  hospital: "https://www.davoshospital.co.kr/depart/page02-detail.html?dr_idx=139",
};

const TIMELINE_DATA = [
  { year: 2025, entries: [
    { title: "Director", org: "Davos Hospital", type: "clinical", start: 2025, end: 2026 },
    { title: "AO Spine Fellowship", org: "Keio Univ, Tokyo", type: "fellowship", start: 2025, end: 2025 },
  ]},
  { year: 2023, entries: [
    { title: "Assistant Professor", org: "Hallym Univ", type: "academic", start: 2023, end: 2025 },
  ]},
  { year: 2022, entries: [
    { title: "Clinical Asst Prof", org: "Hallym Dongtan", type: "academic", start: 2022, end: 2023 },
  ]},
  { year: 2021, entries: [
    { title: "Fellowship", org: "SNU Hospital", type: "fellowship", start: 2021, end: 2022 },
  ]},
  { year: 2019, entries: [
    { title: "Director", org: "Military Academy", type: "clinical", start: 2019, end: 2021 },
  ]},
  { year: 2017, entries: [
    { title: "Board Certified", org: "Neurosurgery", type: "milestone", start: 2017, end: 2017 },
  ]},
  { year: 2013, entries: [
    { title: "Residency", org: "SNU Hospital", type: "training", start: 2013, end: 2017 },
  ]},
  { year: 2012, entries: [
    { title: "Internship", org: "SNU Hospital", type: "training", start: 2012, end: 2013 },
  ]},
  { year: 2006, entries: [
    { title: "Medical School", org: "Keimyung Univ", type: "education", start: 2006, end: 2012 },
  ]},
];

const AFFILIATIONS = [
  "KNS · Board Certified",
  "KSNS · Lifetime Member", 
  "KOMISS · Academic Committee",
  "KOSESS · Education Committee",
  "Neurospine · Editorial Board",
  "NASS · Member",
  "KASS · Member",
  "AO Spine · Member",
];

const HIGHLIGHTED_WORK = [
  {
    title: "Deep Learning for Spine Diagnosis",
    description: "AI-powered detection of vertebral fractures and spine pathology using deep learning models.",
    tags: ["AI/ML", "Imaging", "Diagnosis"],
    link: SOCIAL_LINKS.scholar,
  },
  {
    title: "UBE Surgical Training Program",
    description: "International training center for Unilateral Biportal Endoscopy. Surgeons from 10+ countries.",
    tags: ["Education", "UBE", "International"],
  },
  {
    title: "ERAS Protocol Research",
    description: "Enhanced Recovery After Surgery protocols for spine surgery, improving outcomes and reducing costs.",
    tags: ["Clinical", "Outcomes", "ERAS"],
  },
  {
    title: "Endoscopic Spine Techniques",
    description: "Advancing minimally invasive approaches for complex spine conditions.",
    tags: ["Surgery", "Innovation", "MIS"],
  },
];

const SIDE_PROJECTS = [
  {
    icon: "🔬",
    title: "SpineAlign AI",
    description: "Deep learning app for automatic spine alignment measurement from X-rays.",
    url: "#",
  },
  {
    icon: "📊",
    title: "Surgical Outcomes DB",
    description: "Personal database tracking surgical outcomes and patient follow-ups.",
    url: "#",
  },
  {
    icon: "📱",
    title: "UBE Training App",
    description: "Mobile app for endoscopic surgery trainees with video tutorials.",
    url: "#",
  },
  {
    icon: "🤖",
    title: "Medical AI Research",
    description: "Collaborative projects applying AI to clinical problems.",
    url: SOCIAL_LINKS.scholar,
  },
];

function NavButton({ direction, onClick, disabled }: { direction: 'prev' | 'next'; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center h-7 w-12 rounded-md text-xs border border-stone-200 bg-white text-stone-700 shadow-sm transition-all duration-150 hover:bg-stone-50 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
    >
      {direction === 'prev' ? (
        <svg viewBox="0 0 14 14" fill="none" className="h-4 w-4">
          <path d="M8.5 3.5 5 7l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 14 14" fill="none" className="h-4 w-4">
          <path d="M5.5 3.5 9 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

function CardColumn({ id, title, children, index }: { id: string; title: string; children: React.ReactNode; index: number }) {
  return (
    <motion.div
      data-column-id={id}
      className="relative shrink-0 snap-start overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm"
      style={{ width: '95%', maxWidth: '460px', height: '100%' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div className="h-full w-full overflow-y-auto scrollbar-hide">
        <header className="sticky top-0 z-50 h-14 flex items-center px-5 bg-gradient-to-b from-white via-white/90 to-transparent">
          <span className="text-xs font-medium uppercase tracking-wider text-stone-500">{title}</span>
        </header>
        <div className="px-5 pb-6">{children}</div>
      </div>
    </motion.div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[11px] uppercase tracking-wide text-stone-400">{label}</span>
        <span className="flex-1 border-t border-dotted border-stone-200" />
      </div>
      <div className="text-sm text-stone-600 leading-relaxed">{value}</div>
    </div>
  );
}

function SocialButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target={href.startsWith("mailto") ? undefined : "_blank"}
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 h-10 px-4 rounded-md text-sm font-medium border border-stone-200 bg-white text-stone-700 shadow-sm transition-all duration-150 hover:bg-stone-50 hover:-translate-y-0.5"
    >
      {children}
    </a>
  );
}

function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 h-10 px-4 rounded-md text-sm font-medium border border-stone-200 bg-white text-stone-700 shadow-sm transition-all duration-150 hover:bg-stone-50 hover:-translate-y-0.5"
    >
      {copied ? "Copied!" : "Copy email"}
    </button>
  );
}

export default function Portfolio() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollButtons);
      updateScrollButtons();
      return () => el.removeEventListener('scroll', updateScrollButtons);
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const cardWidth = 460 + 24;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -cardWidth : cardWidth, behavior: 'smooth' });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-stone-100">
      <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 bg-stone-100">
        <div className="flex h-14 md:h-16 items-center justify-between">
          <h1 className="text-sm text-stone-500 tracking-tight">Woon Tak Yuh, MD</h1>
          <div className="flex items-center gap-2">
            <NavButton direction="prev" onClick={() => scroll('left')} disabled={!canScrollLeft} />
            <NavButton direction="next" onClick={() => scroll('right')} disabled={!canScrollRight} />
          </div>
        </div>
      </header>

      <main className="flex-1 mt-14 md:mt-16 h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-4rem)]">
        <div ref={scrollRef} className="h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden scrollbar-hide scroll-pl-4 md:scroll-pl-8">
          <div className="flex h-full gap-6 p-4 md:p-6 pt-1">
            
            {/* Card 1: About Me */}
            <CardColumn id="about" title="About me" index={0}>
              <div className="space-y-6">
                {/* Visual Avatar Area */}
                <div className="relative aspect-[1.5/1] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-600 shadow-lg">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-7xl font-bold text-white/90 drop-shadow-lg">W</span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                    <span className="px-2 py-1 rounded-md bg-white/20 backdrop-blur text-xs text-white font-medium">Spine Surgeon</span>
                    <span className="px-2 py-1 rounded-md bg-white/20 backdrop-blur text-xs text-white font-medium">AI Researcher</span>
                  </div>
                </div>

                {/* Intro */}
                <div>
                  <h2 className="text-xl leading-snug text-stone-800 mb-3">
                    Hey, I'm Woon Tak. I operate, research, and teach minimally invasive spine surgery.
                  </h2>
                  <p className="text-stone-600 leading-relaxed">
                    Currently directing the Endoscopic Spine Center at{" "}
                    <a href={SOCIAL_LINKS.hospital} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-stone-800">
                      Davos Hospital
                    </a>
                    , specializing in <strong className="font-medium text-stone-800">Unilateral Biportal Endoscopy (UBE)</strong> and clinical AI applications.
                  </p>
                </div>

                {/* Social Buttons */}
                <div className="flex flex-wrap gap-2">
                  <SocialButton href={SOCIAL_LINKS.linkedin}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </SocialButton>
                  <SocialButton href={SOCIAL_LINKS.scholar}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M12 24a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm0-24L0 9.5l4.838 3.94A8 8 0 0 1 12 9a8 8 0 0 1 7.162 4.44L24 9.5z"/>
                    </svg>
                    Scholar
                  </SocialButton>
                  <CopyEmailButton email={SOCIAL_LINKS.email} />
                </div>

                {/* Stats */}
                <div className="space-y-4">
                  <StatItem label="Role" value="Spine Surgeon. Director of Endoscopic Spine Center at Davos Hospital." />
                  <StatItem label="Specialty" value="Unilateral Biportal Endoscopy (UBE) — cutting-edge minimally invasive spine surgery." />
                  <StatItem label="Research" value="50+ publications, h-index 11. Pioneering AI applications in spine diagnosis." />
                  <StatItem label="Teaching" value="International training center director. Trained surgeons from 10+ countries." />
                  <StatItem label="Experience" value="15+ years in neurosurgery and spine surgery." />
                  <StatItem label="Location" value="Seoul / Yongin, South Korea" />
                </div>

                {/* Affiliations */}
                <div className="pt-2">
                  <div className="text-xs font-medium uppercase tracking-wider text-stone-400 mb-3">Affiliations</div>
                  <div className="flex flex-wrap gap-2">
                    {AFFILIATIONS.map((aff) => (
                      <span key={aff} className="px-2 py-1 rounded-md bg-stone-100 text-xs text-stone-600">{aff}</span>
                    ))}
                  </div>
                </div>
              </div>
            </CardColumn>

            {/* Card 2: Career Journey */}
            <CardColumn id="timeline" title="Career Journey" index={1}>
              <div className="relative">
                {/* Year markers on left + Timeline */}
                <div className="relative flex">
                  {/* Years Column */}
                  <div className="w-12 shrink-0 relative">
                    {[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006].map((year) => (
                      <div key={year} className="h-10 flex items-center justify-end pr-3">
                        <span className="font-mono text-[11px] text-stone-400">{year}</span>
                      </div>
                    ))}
                    {/* Vertical line */}
                    <div className="absolute right-0 top-0 bottom-0 w-px bg-stone-200" />
                  </div>

                  {/* Timeline Entries */}
                  <div className="flex-1 relative pl-4">
                    {/* Vertical guide line */}
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-stone-100" />
                    
                    {TIMELINE_DATA.map((yearGroup) => {
                      const topOffset = (2026 - yearGroup.year) * 40;
                      return yearGroup.entries.map((entry, idx) => {
                        const height = Math.max((entry.end - entry.start + 1) * 40 - 8, 32);
                        const bgColor = 
                          entry.type === 'clinical' ? 'bg-teal-500' :
                          entry.type === 'academic' ? 'bg-blue-500' :
                          entry.type === 'fellowship' ? 'bg-purple-500' :
                          entry.type === 'training' ? 'bg-amber-500' :
                          entry.type === 'education' ? 'bg-emerald-500' :
                          'bg-stone-400';
                        
                        return (
                          <div
                            key={`${yearGroup.year}-${idx}`}
                            className={`absolute left-6 right-2 rounded-lg ${bgColor} px-3 py-2 text-white shadow-sm`}
                            style={{ top: topOffset, height }}
                          >
                            <div className="text-xs font-medium truncate">{entry.title}</div>
                            <div className="text-[10px] opacity-80 truncate">{entry.org}</div>
                          </div>
                        );
                      });
                    })}
                  </div>
                </div>

                {/* Rotated Side Label */}
                <div className="absolute -right-2 top-1/2 -translate-y-1/2">
                  <div className="origin-center -rotate-90 whitespace-nowrap text-xs font-medium text-stone-300 tracking-wider">
                    CLINICAL & ACADEMIC
                  </div>
                </div>
              </div>
            </CardColumn>

            {/* Card 3: Highlighted Work */}
            <CardColumn id="projects" title="Highlighted work" index={2}>
              <div className="space-y-4">
                {HIGHLIGHTED_WORK.map((work, idx) => (
                  <motion.div
                    key={work.title}
                    className="group rounded-xl border border-stone-200 bg-stone-50 overflow-hidden hover:border-stone-300 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                  >
                    {/* Visual placeholder */}
                    <div className="aspect-[2/1] bg-gradient-to-br from-stone-200 to-stone-300 relative overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl opacity-30">
                          {idx === 0 ? '🧠' : idx === 1 ? '🎓' : idx === 2 ? '📊' : '🔬'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-stone-800 mb-1">{work.title}</h3>
                      <p className="text-xs text-stone-500 mb-3 leading-relaxed">{work.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {work.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded bg-white border border-stone-200 text-[10px] text-stone-500">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Publications Summary */}
                <div className="mt-6 p-4 rounded-xl bg-teal-50 border border-teal-100">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl font-bold text-teal-600">50+</span>
                    <span className="text-sm text-teal-700">Publications</span>
                  </div>
                  <p className="text-xs text-teal-600 mb-3">h-index 11 · First/co-first author on 15+ papers</p>
                  <a 
                    href={SOCIAL_LINKS.scholar}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800"
                  >
                    View on Google Scholar →
                  </a>
                </div>
              </div>
            </CardColumn>

            {/* Card 4: Side Projects */}
            <CardColumn id="side_projects" title="Side projects" index={3}>
              <div className="space-y-4">
                <p className="text-stone-600 text-sm leading-relaxed mb-4">
                  Personal projects exploring AI applications in medicine and beyond.
                </p>

                {SIDE_PROJECTS.map((project, idx) => (
                  <motion.a
                    key={project.title}
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 rounded-xl border border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm transition-all"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-xl">
                        {project.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-stone-800 mb-1">{project.title}</h3>
                        <p className="text-xs text-stone-500 leading-relaxed">{project.description}</p>
                      </div>
                    </div>
                  </motion.a>
                ))}

                {/* Contact CTA */}
                <div className="mt-8 p-4 rounded-xl bg-stone-800 text-white">
                  <h3 className="font-medium mb-2">Let's connect</h3>
                  <p className="text-sm text-stone-300 mb-4">Interested in collaboration or training programs?</p>
                  <div className="flex flex-wrap gap-2">
                    <a 
                      href={`mailto:${SOCIAL_LINKS.email}`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white text-stone-800 text-sm font-medium hover:bg-stone-100 transition-colors"
                    >
                      Email me
                    </a>
                    <a 
                      href={SOCIAL_LINKS.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-stone-700 text-white text-sm font-medium hover:bg-stone-600 transition-colors"
                    >
                      LinkedIn
                    </a>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-6 text-xs text-stone-400 text-center">
                  © 2026 Woon Tak Yuh, MD. Seoul, South Korea.
                </div>
              </div>
            </CardColumn>

          </div>
        </div>
      </main>
    </div>
  );
}
