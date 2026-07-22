import { formatLiveDate } from "./format";

interface LiveClockFaceProps {
  readonly now: Date | null;
}

export function LiveClockFace({ now }: LiveClockFaceProps) {
  const liveDate = formatLiveDate(now);

  return (
    <div className="pointer-events-none absolute left-[10%] top-[68.8%] z-30 grid h-[10.5%] w-[14.7%] rotate-[-8deg] content-center rounded-[18px] border border-white/60 bg-[#fffaf0]/54 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_18px_42px_rgba(88,68,42,0.18)] backdrop-blur-sm">
      <div className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-[#8f6432]">
        Current
      </div>
      <div className="mt-1 flex items-end justify-between gap-2">
        <div>
          <div className="font-mono text-[10px] font-bold tracking-[0.14em] text-[#2d362b]/62">
            {liveDate.year}
          </div>
          <div className="font-serif text-[1.55rem] leading-none tracking-[-0.08em] text-[#182016]">
            {liveDate.month}.{liveDate.day}
          </div>
        </div>
        <div className="pb-1 font-mono text-[11px] font-bold tracking-[0.04em] text-[#182016] [font-variant-numeric:tabular-nums]">
          {liveDate.time}
        </div>
      </div>
    </div>
  );
}
