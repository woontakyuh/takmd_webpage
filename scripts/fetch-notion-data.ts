/**
 * Build-time script: Fetches ALL surgical cases from Notion Patient DB,
 * anonymizes them, computes per-category stats + PROM trends,
 * and writes surgery-data.json for the dashboard.
 *
 * Usage: bun run scripts/fetch-notion-data.ts
 * Requires: NOTION_TOKEN env var (or ~/.journal_alert_env)
 */

const DATABASE_ID = "a4058c50-e8fc-43f8-aeeb-baefcc7b923c";
const API_VERSION = "2022-06-28";
const API_BASE = "https://api.notion.com/v1";

if (!process.env.NOTION_TOKEN) {
  const fs = await import("fs");
  const path = await import("path");
  const envPath = path.join(process.env.HOME ?? "", ".journal_alert_env");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
      const m = line.match(/^export\s+(\w+)=["']?(.+?)["']?\s*$/);
      if (m) process.env[m[1]] = m[2];
    }
  }
}
const token = process.env.NOTION_TOKEN;
if (!token) {
  console.error("ERROR: NOTION_TOKEN not found");
  process.exit(1);
}

// --- Types ---

interface NotionPage { id: string; properties: Record<string, any> }

interface SurgeryCase {
  id: string;
  opDate: string;
  year: number;
  age: number | null;
  sex: string;
  level: string;
  opCategory: string[];
  ctl: string[];
  classA: string[];
  classB: string[];
  classC: string[];
  surgeon: string[];
  hospital: string;
  cx: string;
  preVAS: number | null;
  oneMonthVAS: number | null;
  threeMonthVAS: number | null;
  sixMonthVAS: number | null;
  oneYearVAS: number | null;
  preODI: number | null;
  oneMonthODI: number | null;
  threeMonthODI: number | null;
  sixMonthODI: number | null;
  oneYearODI: number | null;
  preJOA: number | null;
  preNDI: number | null;
  opTime: number | null;
  rsFactor: string[];
}

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
  promTrends: {
    vas: { timepoint: string; mean: number; n: number }[];
    odi: { timepoint: string; mean: number; n: number }[];
  };
}

// --- Notion helpers ---

function getRichText(prop: any): string {
  if (!prop?.rich_text?.length) return "";
  return prop.rich_text.map((rt: any) => rt.plain_text).join("").trim();
}
function getSelect(prop: any): string {
  return prop?.select?.name?.trim() ?? "";
}
function getMultiSelect(prop: any): string[] {
  return (prop?.multi_select ?? []).map((ms: any) => ms.name.trim());
}
function getNumber(prop: any): number | null {
  return prop?.number ?? null;
}
function getDate(prop: any): string {
  return prop?.date?.start ?? "";
}

/** Parse VAS/ODI from rich_text — handles "3,2" → first number, "23/45" → first number */
function parseScore(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.split(",")[0].split("/")[0].trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// --- Fetch all Op pages ---

async function fetchAllOpPages(): Promise<NotionPage[]> {
  const pages: NotionPage[] = [];
  let hasMore = true;
  let startCursor: string | undefined;

  while (hasMore) {
    const body: Record<string, any> = {
      filter: { property: "DB", multi_select: { contains: "Op" } },
      page_size: 100,
    };
    if (startCursor) body.start_cursor = startCursor;

    const res = await fetch(`${API_BASE}/databases/${DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": API_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Notion ${res.status}: ${await res.text()}`);
    const data = await res.json();
    pages.push(...data.results);
    hasMore = data.has_more;
    startCursor = data.next_cursor;
    console.log(`  Fetched ${pages.length} pages...`);
  }
  return pages;
}

// --- Transform ---

function transformPage(page: NotionPage): SurgeryCase | null {
  const p = page.properties;
  const opDate = getDate(p["Op Date"]);
  if (!opDate) return null;

  const ageStr = getRichText(p["Age"]);

  return {
    id: page.id.replace(/-/g, "").substring(0, 8),
    opDate,
    year: parseInt(opDate.substring(0, 4), 10),
    age: ageStr ? parseInt(ageStr, 10) || null : null,
    sex: getSelect(p["Sex"]).trim(),
    level: getRichText(p["Level"]),
    opCategory: getMultiSelect(p["Op Category"]),
    ctl: getMultiSelect(p["CTL"]),
    classA: getMultiSelect(p["ClassA"]),
    classB: getMultiSelect(p["ClassB"]),
    classC: getMultiSelect(p["ClassC"]),
    surgeon: getMultiSelect(p["Surgeon"]),
    hospital: getMultiSelect(p["Hospital"]).join(", ") || getSelect(p["Hospital"]),
    cx: getRichText(p["Cx"]),
    preVAS: parseScore(getRichText(p["pre VAS"])),
    oneMonthVAS: parseScore(getRichText(p["1mo VAS"])),
    threeMonthVAS: parseScore(getRichText(p["3mo VAS"])),
    sixMonthVAS: parseScore(getRichText(p["6mo VAS"])),
    oneYearVAS: parseScore(getRichText(p["1y VAS"])),
    preODI: parseScore(getRichText(p["pre ODI"])),
    oneMonthODI: parseScore(getRichText(p["1mo ODI"])),
    threeMonthODI: parseScore(getRichText(p["3mo ODI"])),
    sixMonthODI: parseScore(getRichText(p["6mo ODI"])),
    oneYearODI: parseScore(getRichText(p["1y ODI"])),
    preJOA: parseScore(getRichText(p["pre JOA"])),
    preNDI: parseScore(getRichText(p["pre NDI"])),
    opTime: getNumber(p["Op time"]),
    rsFactor: getMultiSelect(p["RS factor"]),
  };
}

// --- Compute stats ---

function computePromTrends(cases: SurgeryCase[]) {
  const vasFields: { key: keyof SurgeryCase; label: string }[] = [
    { key: "preVAS", label: "Pre" },
    { key: "oneMonthVAS", label: "1mo" },
    { key: "threeMonthVAS", label: "3mo" },
    { key: "sixMonthVAS", label: "6mo" },
    { key: "oneYearVAS", label: "1y" },
  ];
  const odiFields: { key: keyof SurgeryCase; label: string }[] = [
    { key: "preODI", label: "Pre" },
    { key: "oneMonthODI", label: "1mo" },
    { key: "threeMonthODI", label: "3mo" },
    { key: "sixMonthODI", label: "6mo" },
    { key: "oneYearODI", label: "1y" },
  ];

  function calcMeans(fields: { key: keyof SurgeryCase; label: string }[]) {
    return fields.map((f) => {
      const vals = cases
        .map((c) => c[f.key] as number | null)
        .filter((v): v is number => v !== null);
      return {
        timepoint: f.label,
        mean: vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0,
        n: vals.length,
      };
    });
  }

  return { vas: calcMeans(vasFields), odi: calcMeans(odiFields) };
}

function countMulti(arr: string[], counter: Record<string, number>) {
  for (const v of arr) counter[v] = (counter[v] ?? 0) + 1;
}

function computeStats(cases: SurgeryCase[]): CategoryStats {
  const byYear: Record<string, number> = {};
  const bySex: Record<string, number> = {};
  const byLevel: Record<string, number> = {};
  const bySurgeon: Record<string, number> = {};
  const byHospital: Record<string, number> = {};
  const byClassA: Record<string, number> = {};
  const byClassB: Record<string, number> = {};
  const byClassC: Record<string, number> = {};
  const byCTL: Record<string, number> = {};
  const ages: number[] = [];
  const ageBuckets: Record<string, number> = {};
  let withCx = 0;

  for (const c of cases) {
    byYear[c.year] = (byYear[c.year] ?? 0) + 1;
    bySex[c.sex || "Unknown"] = (bySex[c.sex || "Unknown"] ?? 0) + 1;
    byLevel[c.level || "Unspecified"] = (byLevel[c.level || "Unspecified"] ?? 0) + 1;
    byHospital[c.hospital || "Unknown"] = (byHospital[c.hospital || "Unknown"] ?? 0) + 1;

    countMulti(c.surgeon, bySurgeon);
    countMulti(c.classA, byClassA);
    countMulti(c.classB, byClassB);
    countMulti(c.classC, byClassC);
    countMulti(c.ctl, byCTL);

    if (c.classB.length === 0) byClassB["Unspecified"] = (byClassB["Unspecified"] ?? 0) + 1;

    if (c.age !== null && c.age > 0 && c.age < 120) {
      ages.push(c.age);
      const bucket = `${Math.floor(c.age / 10) * 10}s`;
      ageBuckets[bucket] = (ageBuckets[bucket] ?? 0) + 1;
    }
    if (c.cx && c.cx.trim().length > 0) withCx++;
  }

  return {
    totalCases: cases.length,
    dateRange: {
      earliest: cases.reduce((m, c) => (c.opDate < m ? c.opDate : m), cases[0]?.opDate ?? ""),
      latest: cases.reduce((m, c) => (c.opDate > m ? c.opDate : m), cases[0]?.opDate ?? ""),
    },
    byYear, bySex, byLevel, bySurgeon, byHospital,
    byClassA, byClassB, byClassC, byCTL,
    complicationRate: { total: cases.length, withCx },
    ageDistribution: {
      mean: ages.length ? Math.round((ages.reduce((a, b) => a + b, 0) / ages.length) * 10) / 10 : 0,
      min: ages.length ? Math.min(...ages) : 0,
      max: ages.length ? Math.max(...ages) : 0,
      buckets: ageBuckets,
    },
    promTrends: computePromTrends(cases),
  };
}

// --- Main ---

async function main() {
  console.log("Fetching all surgical cases from Notion...");
  const pages = await fetchAllOpPages();
  console.log(`Fetched ${pages.length} raw pages.`);

  const allCases = pages
    .map(transformPage)
    .filter((c): c is SurgeryCase => c !== null)
    .sort((a, b) => a.opDate.localeCompare(b.opDate));
  console.log(`Transformed ${allCases.length} valid cases.`);

  // Category index
  const categoryCounts: Record<string, number> = {};
  for (const c of allCases) {
    for (const cat of c.opCategory) categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
    if (c.opCategory.length === 0) categoryCounts["Uncategorized"] = (categoryCounts["Uncategorized"] ?? 0) + 1;
  }

  // Per-category stats (3+ cases)
  const categoryStats: Record<string, CategoryStats> = {};
  for (const cat of Object.keys(categoryCounts)) {
    if (categoryCounts[cat] < 3) continue;
    const filtered = allCases.filter(
      (c) => c.opCategory.includes(cat) || (cat === "Uncategorized" && c.opCategory.length === 0)
    );
    categoryStats[cat] = computeStats(filtered);
  }

  const overallStats = computeStats(allCases);

  const output = {
    generatedAt: new Date().toISOString(),
    overallStats,
    categoryCounts,
    categoryStats,
    cases: allCases,
  };

  const fs = await import("fs");
  const path = await import("path");
  const outDir = path.join(import.meta.dir, "..", "src", "data");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "surgery-data.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nWritten to ${outPath}`);
  console.log(`Total: ${overallStats.totalCases} cases, ${Object.keys(categoryStats).length} categories with stats`);
  for (const [cat, count] of Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${categoryStats[cat] ? "✓" : "·"} ${cat}: ${count}`);
  }
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
