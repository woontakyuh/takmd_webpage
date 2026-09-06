import { fileURLToPath } from "node:url";

/**
 * Build-time script: Fetches all Published papers from Notion "연구DB",
 * sorts by publication date desc, and writes publications.json for the site.
 *
 * Usage: bun run scripts/fetch-publications.ts
 * Requires: NOTION_TOKEN env var (or ~/.journal_alert_env)
 */

const DATABASE_ID = "c222e1a3-0c07-4227-bb6c-b26365cd0509";
const API_VERSION = "2022-06-28";
const API_BASE = "https://api.notion.com/v1";
const OWNER = "여운탁";

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

type AuthorRole = "first" | "corresponding" | "coauthor" | "other";

interface Publication {
  id: string;
  title: string;
  shortTitle: string;
  journal: string;
  year: number;
  date: string;
  firstAuthor: string[];
  corresponding: string[];
  coAuthors: string[];
  role: AuthorRole;
  doi: string;
  doiUrl: string;
}

/** Smart title shortening — strips boilerplate and caps at target length */
function shortenTitle(title: string, maxLen = 55): string {
  let t = title.trim();

  // Strip common prefixes
  t = t.replace(/^Technical Note:\s*/i, "");
  t = t.replace(/^Case Report:\s*/i, "");
  t = t.replace(/^Letter:\s*/i, "");
  t = t.replace(/^Editorial:\s*/i, "");
  t = t.replace(/^Review:\s*/i, "");

  // Strip common suffixes
  t = t.replace(/:\s*A narrative review\.?$/i, "");
  t = t.replace(/:\s*A systematic review(\s+and meta-analysis)?\.?$/i, "");
  t = t.replace(/:\s*A retrospective (cohort )?stud(y|ies)\.?$/i, "");
  t = t.replace(/:\s*A prospective (cohort )?stud(y|ies)\.?$/i, "");
  t = t.replace(/:\s*A comparative stud(y|ies)\.?$/i, "");
  t = t.replace(/:\s*A (single|multi)-center experience\.?$/i, "");
  t = t.replace(/:\s*A nationwide stud(y|ies)\.?$/i, "");
  t = t.replace(/:\s*A case report( and review)?\.?$/i, "");

  // Cut at first colon if present (often " : subtitle" pattern)
  if (t.length > maxLen && t.includes(": ")) {
    const head = t.split(": ")[0];
    if (head.length >= 20) t = head;
  }

  // Word-boundary truncate + ellipsis
  if (t.length > maxLen) {
    const cut = t.slice(0, maxLen);
    const lastSpace = cut.lastIndexOf(" ");
    t = (lastSpace > 30 ? cut.slice(0, lastSpace) : cut) + "…";
  }
  return t;
}

// ─── Notion helpers ──────────────────────────────────────

function getTitle(prop: any): string {
  return (prop?.title ?? []).map((t: any) => t.plain_text).join("").trim();
}
function getRichText(prop: any): string {
  return (prop?.rich_text ?? []).map((t: any) => t.plain_text).join("").trim();
}
function getSelect(prop: any): string {
  return prop?.select?.name?.trim() ?? "";
}
function getMultiSelect(prop: any): string[] {
  return (prop?.multi_select ?? []).map((ms: any) => ms.name.trim());
}
function getDate(prop: any): string {
  return prop?.date?.start ?? "";
}

// ─── Transform ───────────────────────────────────────────

function transformPage(page: NotionPage): Publication | null {
  const p = page.properties;
  const title = getTitle(p["Title"]);
  const pubDate = getDate(p["출판"]);
  if (!title || !pubDate) return null;

  const firstAuthor = getMultiSelect(p["1st Author"]);
  const corresponding = getMultiSelect(p["Corresponding"]);
  const coAuthors = getMultiSelect(p["Co-author"]);
  const doi = getRichText(p["doi"]);
  // Optional: user-curated short title field (rich_text)
  const manualShort = getRichText(p["Short Title"]);

  let role: AuthorRole = "other";
  if (firstAuthor.includes(OWNER)) role = "first";
  else if (corresponding.includes(OWNER)) role = "corresponding";
  else if (coAuthors.includes(OWNER)) role = "coauthor";

  return {
    id: page.id.replace(/-/g, "").substring(0, 8),
    title,
    shortTitle: manualShort || shortenTitle(title),
    // The Notion journal category abbreviates this verified Bioengineering record.
    journal: doi === "10.3390/bioengineering10121363" ? "Bioengineering" : getSelect(p["Target J"]),
    year: parseInt(pubDate.substring(0, 4), 10),
    date: pubDate,
    firstAuthor,
    corresponding,
    coAuthors,
    role,
    doi,
    doiUrl: doi ? `https://doi.org/${doi}` : "",
  };
}

// ─── Fetch ───────────────────────────────────────────────

async function fetchAllPublished(): Promise<NotionPage[]> {
  const pages: NotionPage[] = [];
  let hasMore = true;
  let startCursor: string | undefined;

  while (hasMore) {
    const body: Record<string, any> = {
      filter: { property: "Status", select: { equals: "Published" } },
      sorts: [{ property: "출판", direction: "descending" }],
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
  console.log("Fetching Published papers from 연구DB...");
  const pages = await fetchAllPublished();
  console.log(`Fetched ${pages.length} raw pages.`);

  const publications = pages
    .map(transformPage)
    .filter((p): p is Publication => p !== null)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Count by role
  const byRole = publications.reduce((acc, p) => {
    acc[p.role] = (acc[p.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log(`\nValid publications: ${publications.length}`);
  console.log(`  First author: ${byRole.first ?? 0}`);
  console.log(`  Corresponding: ${byRole.corresponding ?? 0}`);
  console.log(`  Co-author: ${byRole.coauthor ?? 0}`);
  console.log(`  Other: ${byRole.other ?? 0}`);

  const output = {
    generatedAt: new Date().toISOString(),
    count: publications.length,
    publications,
  };

  const fs = await import("fs");
  const path = await import("path");
  const outDir = fileURLToPath(new URL("../src/data/", import.meta.url));
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "publications.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nWritten to ${outPath}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
