import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  type TooltipProps,
} from "recharts";
import rawData from "../data/surgery-data.json";

interface PromPoint { timepoint: string; mean: number; n: number }
interface CategoryStats {
  totalCases: number;
  dateRange: { earliest: string; latest: string };
  byYear: Record<string, number>;
  bySex: Record<string, number>;
  byLevel: Record<string, number>;
  bySurgeon: Record<string, number>;
  byHospital: Record<string, number>;
  byClassA: Record<string, number>;
  byClassB: Record<string, number>;
  byClassC: Record<string, number>;
  byCTL: Record<string, number>;
  complicationRate: { total: number; withCx: number };
  ageDistribution: { mean: number; min: number; max: number; buckets: Record<string, number> };
  promTrends: { vas: PromPoint[]; odi: PromPoint[] };
}

const data = rawData as {
  generatedAt: string;
  overallStats: CategoryStats;
  categoryCounts: Record<string, number>;
  categoryStats: Record<string, CategoryStats>;
  cases: unknown[];
};

const TEAL = ["#0d9488", "#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4", "#ccfbf1"];
const CATEGORY_COLORS = [
  "#0d9488", "#f59e0b", "#6366f1", "#ec4899", "#14b8a6",
  "#8b5cf6", "#f97316", "#06b6d4", "#84cc16", "#ef4444",
  "#a855f7", "#10b981", "#e11d48", "#0ea5e9", "#eab308",
  "#d946ef", "#22d3ee", "#f43f5e", "#34d399", "#fb923c",
];
const PIE_COLORS_SEX = ["#0d9488", "#f472b6", "#a3a3a3"];
const ease = [0.22, 1, 0.36, 1] as const;

function sorted(obj: Record<string, number>, limit?: number, by: "key" | "value" = "value") {
  const entries = Object.entries(obj).map(([name, value]) => ({ name, value }));
  entries.sort(by === "value" ? (a, b) => b.value - a.value : (a, b) => a.name.localeCompare(b.name));
  return limit ? entries.slice(0, limit) : entries;
}

function fmtDateRange(e: string, l: string) {
  const f = (d: string) => { const [y, m] = d.split("-"); return `${y}.${m}`; };
  return `${f(e)} — ${f(l)}`;
}

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-neutral-100 px-4 py-3">
      <p className="text-sm font-medium text-neutral-900">{label}</p>
      {payload.map((e, i) => (
        <p key={i} className="text-sm text-teal-600 font-semibold">{e.value}건</p>
      ))}
    </div>
  );
}

function StatCard({ label, value, sub, i }: { label: string; value: string | number; sub?: string; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: i * 0.06, ease }}
      className="bg-white rounded-2xl p-5 sm:p-6"
    >
      <div className="text-sm text-neutral-400 font-medium">{label}</div>
      <div className="text-3xl sm:text-4xl font-bold text-teal-600 mt-1">{value}</div>
      {sub && <div className="text-xs text-neutral-400 mt-1">{sub}</div>}
    </motion.div>
  );
}

function ChartCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease }}
      className={`bg-white rounded-2xl p-5 sm:p-6 ${className}`}
    >
      <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </motion.div>
  );
}

function HBarChart({ items, color = TEAL[0] }: { items: { name: string; value: number }[]; color?: string }) {
  const h = Math.max(200, items.length * 36);
  return (
    <div style={{ height: h }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={items} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#525252" }} axisLine={false} tickLine={false} width={100} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function VBarChart({ items, color = TEAL[0] }: { items: { name: string; value: number }[]; color?: string }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={items} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PromLineChart({ points, color, label }: { points: PromPoint[]; color: string; label: string }) {
  const hasData = points.some((p) => p.n > 0);
  if (!hasData) return <div className="h-48 flex items-center justify-center text-neutral-300 text-sm">데이터 없음</div>;

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
          <XAxis dataKey="timepoint" tick={{ fontSize: 12, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
          <Tooltip
            content={({ active, payload, label: tp }) => {
              if (!active || !payload?.length) return null;
              const pt = points.find((p) => p.timepoint === tp);
              return (
                <div className="bg-white rounded-xl shadow-lg border border-neutral-100 px-4 py-3">
                  <p className="text-sm font-medium text-neutral-900">{label} — {tp}</p>
                  <p className="text-sm font-semibold" style={{ color }}>
                    {payload[0].value} <span className="text-neutral-400 font-normal">(n={pt?.n})</span>
                  </p>
                </div>
              );
            }}
          />
          <Line type="monotone" dataKey="mean" stroke={color} strokeWidth={2.5} dot={{ r: 4, fill: color }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function OverviewView({ onSelectCategory }: { onSelectCategory: (cat: string) => void }) {
  const s = data.overallStats;
  const catData = sorted(data.categoryCounts, 20);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="전체 수술 건수" value={s.totalCases} sub="cases" i={0} />
        <StatCard label="수술 기간" value={fmtDateRange(s.dateRange.earliest, s.dateRange.latest)} i={1} />
        <StatCard label="수술 분류" value={Object.keys(data.categoryCounts).length} sub="categories" i={2} />
        <StatCard label="평균 연령" value={s.ageDistribution.mean} sub={`${s.ageDistribution.min}–${s.ageDistribution.max}세`} i={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="수술 분류별 분포" className="lg:col-span-2">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="h-72 w-full lg:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={catData} cx="50%" cy="50%" outerRadius={110} innerRadius={50}
                    paddingAngle={1} dataKey="value" stroke="none" cursor="pointer"
                    onClick={(_, idx) => onSelectCategory(catData[idx].name)}
                  >
                    {catData.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as { name: string; value: number };
                      return (
                        <div className="bg-white rounded-xl shadow-lg border border-neutral-100 px-4 py-3">
                          <p className="text-sm font-medium text-neutral-900">{d.name}</p>
                          <p className="text-sm text-teal-600 font-semibold">{d.value}건 ({((d.value / s.totalCases) * 100).toFixed(1)}%)</p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 w-full lg:w-1/2 max-h-72 overflow-y-auto">
              {catData.map((d, i) => (
                <button key={d.name} onClick={() => onSelectCategory(d.name)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-50 transition-colors text-left"
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                  <span className="text-sm text-neutral-700 truncate">{d.name}</span>
                  <span className="text-xs text-neutral-400 ml-auto">{d.value}</span>
                </button>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="부위별 분포 (CTL)">
          <VBarChart items={sorted(s.byCTL)} color="#14b8a6" />
        </ChartCard>

        <ChartCard title="ClassA 분포">
          <HBarChart items={sorted(s.byClassA, 10)} color="#0d9488" />
        </ChartCard>

        <ChartCard title="ClassB 분포 (진단)">
          <HBarChart items={sorted(s.byClassB, 10)} color="#14b8a6" />
        </ChartCard>

        {Object.keys(s.byClassC).length > 0 && (
          <ChartCard title="ClassC 분포">
            <HBarChart items={sorted(s.byClassC, 10)} color="#2dd4bf" />
          </ChartCard>
        )}

        <ChartCard title="연도별 수술 건수" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sorted(s.byYear, undefined, "key")} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 13, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" fill="#0d9488" radius={[6, 6, 0, 0]} maxBarSize={64} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="VAS 추이 (전체)">
          <PromLineChart points={s.promTrends.vas} color="#0d9488" label="VAS" />
        </ChartCard>

        <ChartCard title="ODI 추이 (전체)">
          <PromLineChart points={s.promTrends.odi} color="#f59e0b" label="ODI" />
        </ChartCard>
      </div>
    </>
  );
}

function DetailView({ category }: { category: string }) {
  const stats = data.categoryStats[category];
  if (!stats) return <div className="text-neutral-400 text-center py-12">상세 데이터가 없습니다.</div>;

  const cxRate = stats.totalCases > 0 ? ((stats.complicationRate.withCx / stats.complicationRate.total) * 100).toFixed(1) : "0";
  const ageBucketOrder = ["10s", "20s", "30s", "40s", "50s", "60s", "70s", "80s", "90s"];
  const ageItems = ageBucketOrder.filter((b) => stats.ageDistribution.buckets[b] != null).map((b) => ({ name: b, value: stats.ageDistribution.buckets[b] }));
  const sexItems = sorted(stats.bySex);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="수술 건수" value={stats.totalCases} i={0} />
        <StatCard label="수술 기간" value={fmtDateRange(stats.dateRange.earliest, stats.dateRange.latest)} i={1} />
        <StatCard label="평균 연령" value={stats.ageDistribution.mean} sub={`${stats.ageDistribution.min}–${stats.ageDistribution.max}세`} i={2} />
        <StatCard label="합병증률" value={`${cxRate}%`} sub={`${stats.complicationRate.withCx}/${stats.complicationRate.total}`} i={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="연도별 수술 건수" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sorted(stats.byYear, undefined, "key")} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 13, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" fill="#0d9488" radius={[6, 6, 0, 0]} maxBarSize={64} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="진단별 분포 (ClassB)">
          <HBarChart items={sorted(stats.byClassB, 8)} color="#14b8a6" />
        </ChartCard>

        <ChartCard title="수술 레벨 분포">
          <HBarChart items={sorted(stats.byLevel, 10)} color="#0d9488" />
        </ChartCard>

        <ChartCard title="수술자별 건수">
          <VBarChart items={sorted(stats.bySurgeon)} color="#0d9488" />
        </ChartCard>

        <ChartCard title="연령대 분포">
          <VBarChart items={ageItems} color="#2dd4bf" />
        </ChartCard>

        <ChartCard title="성별 분포">
          <div className="flex flex-col items-center">
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sexItems} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">
                    {sexItems.map((_, i) => <Cell key={i} fill={PIE_COLORS_SEX[i % PIE_COLORS_SEX.length]} />)}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as { name: string; value: number };
                      return (
                        <div className="bg-white rounded-xl shadow-lg border border-neutral-100 px-4 py-3">
                          <p className="text-sm font-medium text-neutral-900">{d.name === "M" ? "남성" : d.name === "F" ? "여성" : "미기록"}</p>
                          <p className="text-sm text-teal-600 font-semibold">{d.value}건 ({((d.value / stats.totalCases) * 100).toFixed(1)}%)</p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-5 mt-1 text-sm">
              {sexItems.map((d, i) => (
                <span key={d.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS_SEX[i] }} />
                  <span className="text-neutral-600">{d.name === "M" ? "남" : d.name === "F" ? "여" : "?"}</span>
                  <span className="text-neutral-400">{d.value}</span>
                </span>
              ))}
            </div>
          </div>
        </ChartCard>

        {Object.keys(stats.byCTL).length > 0 && (
          <ChartCard title="부위별 (CTL)">
            <VBarChart items={sorted(stats.byCTL)} color="#14b8a6" />
          </ChartCard>
        )}

        <ChartCard title="VAS 추이" className="lg:col-span-2">
          <PromLineChart points={stats.promTrends.vas} color="#0d9488" label="VAS" />
        </ChartCard>

        <ChartCard title="ODI 추이" className="lg:col-span-2">
          <PromLineChart points={stats.promTrends.odi} color="#f59e0b" label="ODI" />
        </ChartCard>
      </div>
    </>
  );
}

export default function Dashboard() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-neutral-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div>
            {selectedCategory ? (
              <button onClick={() => setSelectedCategory(null)}
                className="text-sm text-neutral-400 hover:text-teal-600 transition-colors inline-flex items-center gap-1 mb-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                전체 수술
              </button>
            ) : (
              <a href="/" className="text-sm text-neutral-400 hover:text-teal-600 transition-colors inline-flex items-center gap-1 mb-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                Portfolio
              </a>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
              {selectedCategory ?? "Surgery Dashboard"}
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              {selectedCategory ? "Category Detail" : "Surgical Case Analytics"}
            </p>
          </div>
          <div className="text-xs text-neutral-300">
            Updated {new Date(data.generatedAt).toLocaleDateString("ko-KR")}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {selectedCategory ? (
            <motion.div key={selectedCategory} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3, ease }}>
              <DetailView category={selectedCategory} />
            </motion.div>
          ) : (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease }}>
              <OverviewView onSelectCategory={setSelectedCategory} />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mt-8 text-center text-sm text-neutral-300">
          Data sourced from clinical records · Anonymized aggregate statistics only
        </motion.footer>
      </div>
    </main>
  );
}
