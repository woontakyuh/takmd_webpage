import { fileURLToPath } from "node:url";

/**
 * Build-time script: Fetches all 발표 entries from Notion Schedule DB,
 * parses multi-topic entries (1) ..., 2) ...), and writes presentations.json.
 *
 * Usage: bun run scripts/fetch-schedule.ts
 * Requires: NOTION_TOKEN env var (or ~/.journal_alert_env)
 */

const DATABASE_ID = "2fde4781-d308-4061-ac67-fcbc7f67fc2a";
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

// ─── Types ───────────────────────────────────────────────

interface NotionPage {
  id: string;
  properties: Record<string, any>;
}

interface Presentation {
  id: string;
  date: string;
  year: number;
  name: string;
  place: string;
  societies: string[];
  categories: string[];
  topics: string[];
  url: string;
}

// ─── Notion helpers ──────────────────────────────────────

function getTitle(prop: any): string {
  return (prop?.title ?? []).map((t: any) => t.plain_text).join("").trim();
}
function getRichText(prop: any): string {
  return (prop?.rich_text ?? []).map((t: any) => t.plain_text).join("");
}
function getMultiSelect(prop: any): string[] {
  return (prop?.multi_select ?? []).map((ms: any) => ms.name.trim());
}
function getDate(prop: any): string {
  return prop?.date?.start ?? "";
}
function getUrl(prop: any): string {
  return prop?.url ?? "";
}

// ─── Topic parsing ───────────────────────────────────────

/** Parses a topic string into one or more topics.
 *  Handles formats like "1) Title1, 2) Title2" or single-topic strings. */
function parseTopics(raw: string): string[] {
  if (!raw) return [];
  const cleaned = raw.trim();
  if (!cleaned) return [];

  // Normalize whitespace (collapse newlines, tabs, multiple spaces)
  const normalize = (s: string) =>
    s.replace(/\s+/g, " ").replace(/[\s,]+$/, "").trim();

  // Check if numbered format (starts with "1)")
  if (/^\s*1\s*\)/.test(cleaned)) {
    // Split on ", N)" or " N)" or "N)" patterns
    const parts = cleaned
      .split(/\s*,?\s*\d+\s*\)\s*/)
      .map(normalize)
      .filter((t) => t.length > 0);
    return parts;
  }

  return [normalize(cleaned)];
}

// ─── Transform ───────────────────────────────────────────

function transformPage(page: NotionPage): Presentation | null {
  const p = page.properties;
  const rawDate = getDate(p["Date"]);
  const name = getTitle(p["Name"]);
  if (!rawDate || !name) return null;

  // Normalize date: strip time component (YYYY-MM-DD only)
  const date = rawDate.substring(0, 10);

  const rawTopic = getRichText(p["발표 주제"]);
  const topics = parseTopics(rawTopic);

  return {
    id: page.id.replace(/-/g, ""),
    date,
    year: parseInt(date.substring(0, 4), 10),
    name,
    place: getRichText(p["Place"]).trim(),
    societies: getMultiSelect(p["학회명"]),
    categories: getMultiSelect(p["분류"]),
    topics,
    url: getUrl(p["Link"]),
  };
}

// ─── Overrides (manual English translations) ─────────────

interface Override {
  name?: string;
  place?: string;
  topics?: string[];
}

async function loadOverrides(): Promise<Record<string, Override>> {
  const fs = await import("fs");
  const p = fileURLToPath(new URL("../src/data/schedule-overrides.json", import.meta.url));
  if (!fs.existsSync(p)) return {};
  const raw = JSON.parse(fs.readFileSync(p, "utf-8"));
  // Strip metadata keys starting with _
  const result: Record<string, Override> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!k.startsWith("_")) result[k] = v as Override;
  }
  return result;
}

function applyOverrides(pres: Presentation, overrides: Record<string, Override>): Presentation {
  const o = overrides[pres.date];
  if (!o) return pres;
  return {
    ...pres,
    name: o.name ?? pres.name,
    place: o.place ?? pres.place,
    topics: o.topics ?? pres.topics,
  };
}

// ─── Fetch ───────────────────────────────────────────────

async function fetchAllPresentations(): Promise<NotionPage[]> {
  const pages: NotionPage[] = [];
  let hasMore = true;
  let startCursor: string | undefined;

  while (hasMore) {
    const body: Record<string, any> = {
      filter: { property: "참석", select: { equals: "발표" } },
      sorts: [{ property: "Date", direction: "descending" }],
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
    const data = (await res.json()) as any;
    pages.push(...data.results);
    hasMore = data.has_more;
    startCursor = data.next_cursor;
    console.log(`  Fetched ${pages.length} pages...`);
  }
  return pages;
}

// ─── Main ────────────────────────────────────────────────

async function main() {
  console.log("Fetching presentations from Schedule DB...");
  const pages = await fetchAllPresentations();
  console.log(`Fetched ${pages.length} raw pages.`);

  const overrides = await loadOverrides();
  console.log(`Loaded ${Object.keys(overrides).length} English overrides.`);

  const presentations = pages
    .map(transformPage)
    .filter((p): p is Presentation => p !== null)
    .map((p) => applyOverrides(p, overrides))
    .sort((a, b) => b.date.localeCompare(a.date));

  // Warn about remaining Korean content
  const hasKorean = (s: string) => /[\uac00-\ud7af]/.test(s || "");
  const untranslated = presentations.filter(
    (p) => hasKorean(p.name) || hasKorean(p.place) || p.topics.some(hasKorean),
  );
  if (untranslated.length > 0) {
    console.log(`\n⚠ ${untranslated.length} entries still contain Korean:`);
    untranslated.forEach((p) => console.log(`   ${p.date}  ${p.name}`));
  }

  const byYear: Record<number, number> = {};
  let totalTopics = 0;
  for (const p of presentations) {
    byYear[p.year] = (byYear[p.year] || 0) + 1;
    totalTopics += p.topics.length;
  }

  console.log(`\nValid presentations: ${presentations.length}`);
  console.log(`Total topics: ${totalTopics}`);
  console.log("By year:", byYear);

  const output = {
    generatedAt: new Date().toISOString(),
    count: presentations.length,
    presentations,
  };

  const fs = await import("fs");
  const path = await import("path");
  const outDir = fileURLToPath(new URL("../src/data/", import.meta.url));
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "presentations.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nWritten to ${outPath}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
