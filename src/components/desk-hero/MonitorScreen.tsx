import { motion } from "framer-motion";
import { formatNumber } from "./format";
import type { DeskSection, HomeMetrics, PresentationPreview, PublicationPreview } from "./types";

interface MonitorScreenProps {
  readonly section: DeskSection;
  readonly metrics: HomeMetrics;
  readonly publications: readonly PublicationPreview[];
  readonly presentations: readonly PresentationPreview[];
}

export function MonitorScreen({ section, metrics, publications, presentations }: MonitorScreenProps) {
  const secondaryHref = section.secondaryHref ?? "/cv";
  const secondaryHrefLabel = section.secondaryHrefLabel ?? "Living record";
  const metricItems = [
    ["Papers", formatNumber(metrics.publications)],
    ["First author", formatNumber(metrics.firstAuthor)],
    ["Talks", formatNumber(metrics.presentations)],
    ["Cases", formatNumber(metrics.cases)],
    ["Countries", metrics.trainingCountries],
    ["Latest case", metrics.latestCase],
  ] satisfies readonly (readonly [string, string])[];

  return (
    <div className="relative h-full overflow-hidden rounded-[24px] border border-white/70 bg-[#fdfaf3]/94 text-[#182016] shadow-[0_0_0_1px_rgba(255,255,255,0.72),0_24px_80px_rgba(56,44,31,0.2),inset_0_1px_0_rgba(255,255,255,0.86)] backdrop-blur-md">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_8%,rgba(255,255,255,0.78),transparent_18rem),radial-gradient(circle_at_88%_84%,rgba(232,179,104,0.14),transparent_16rem),linear-gradient(120deg,rgba(255,255,255,0.46),transparent_38%,rgba(85,129,156,0.055)_72%,transparent)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(111,90,62,.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(111,90,62,.1)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
      <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: section.accent }} />

      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-[#6f5a3e]/12 bg-white/38 px-4 py-2.5 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#d9a35f]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#8eb6a0]" />
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: section.accent }} />
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden h-px w-16 bg-gradient-to-r from-transparent via-[#6f5a3e]/24 to-transparent sm:block" />
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#2d362b]/54">
              TakMD / {section.object}
            </p>
          </div>
        </div>

        <motion.div
            key={section.id}
            className="grid flex-1 gap-3 overflow-hidden px-4 py-3.5 sm:px-6 sm:py-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(176px,0.72fr)]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#6f5a3e]/12 bg-white/54 px-3 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: section.accent }} />
                <p
                  className="font-mono text-[10px] font-bold uppercase tracking-[0.22em]"
                  style={{ color: section.accent }}
                >
                  {section.eyebrow}
                </p>
              </div>
              <h2 className="mt-3 max-w-3xl text-balance text-3xl font-semibold leading-[0.96] tracking-[-0.06em] text-[#182016] sm:text-[2.15rem] xl:text-[2.35rem] 2xl:text-[2.55rem]">
                {section.title}
              </h2>
              <p className="mt-3 max-w-2xl text-pretty text-sm leading-5 text-[#2d362b]/76 xl:text-[14px] 2xl:text-[15px]">
                {section.summary}
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {section.bullets.map((bullet) => (
                  <div key={bullet} className="rounded-2xl border border-[#6f5a3e]/10 bg-white/52 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                    <p className="text-xs font-semibold leading-5 text-[#182016]/78 xl:text-[13px]">{bullet}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid min-w-0 content-start gap-3">
              <div className="grid grid-cols-3 gap-2">
                {metricItems.map(([label, value]) => (
                  <Metric key={label} label={label} value={value} />
                ))}
              </div>

              <div className="hidden gap-3 min-[1780px]:grid min-[1780px]:grid-cols-2">
                <RecordList
                  title="Latest paper"
                  items={publications.slice(0, 1).map((publication) => ({
                    meta: `${publication.year} / ${publication.journal} / ${publication.role}`,
                    title: publication.title,
                    href: publication.url,
                  }))}
                />
                <div className="hidden 2xl:block">
                  <RecordList
                    title="Recent schedule"
                    items={presentations.slice(0, 1).map((presentation) => ({
                      meta: `${presentation.date} / ${presentation.place || "TBA"}`,
                      title: presentation.name,
                    }))}
                  />
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
                <a
                  href={section.href}
                  className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-bold text-[#182016] shadow-[0_16px_36px_rgba(56,44,31,0.16)] transition hover:-translate-y-0.5 hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6f5a3e]"
                  style={{ backgroundColor: section.accent }}
                >
                  {section.hrefLabel}
                </a>
                <a
                  href={secondaryHref}
                  className="inline-flex items-center justify-center rounded-full border border-[#6f5a3e]/16 bg-white/46 px-5 py-3 text-sm font-bold text-[#2d362b]/82 transition hover:-translate-y-0.5 hover:border-[#6f5a3e]/32 hover:bg-white/76 hover:text-[#182016] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6f5a3e]"
                >
                  {secondaryHrefLabel}
                </a>
              </div>
            </div>
        </motion.div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#6f5a3e]/10 bg-white/58 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.76)]">
      <p className="truncate font-serif text-[1.05rem] leading-none tracking-[-0.04em] text-[#182016] sm:text-xl">{value}</p>
      <p className="mt-2 truncate font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-[#2d362b]/48">{label}</p>
    </div>
  );
}

function RecordList({
  title,
  items,
}: {
  readonly title: string;
  readonly items: readonly {
    readonly meta: string;
    readonly title: string;
    readonly href?: string;
  }[];
}) {
  return (
    <div className="rounded-2xl border border-[#6f5a3e]/10 bg-[#f5efe4]/68 p-3">
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#2d362b]/48">{title}</p>
      <div className="mt-3 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-[#2d362b]/56">No entries yet.</p>
        ) : (
          items.map((item) => {
            const content = (
              <>
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#2d362b]/44">{item.meta}</p>
                <p className="mt-1 text-sm font-semibold leading-5 text-[#182016]/82">{item.title}</p>
              </>
            );

            return item.href ? (
              <a
                key={`${item.meta}-${item.title}`}
                href={item.href}
                className="block rounded-xl p-1.5 transition hover:bg-white/64 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6f5a3e]"
              >
                {content}
              </a>
            ) : (
              <div key={`${item.meta}-${item.title}`} className="rounded-xl p-1.5">
                {content}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
