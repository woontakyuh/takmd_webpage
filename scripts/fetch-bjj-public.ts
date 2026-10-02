import { readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

const SOURCE_ROOT = process.env.SPINOSCOPY_DASHBOARD_ROOT?.trim()
  || resolve(process.cwd(), "../spinoscopy-dashboard")
const OUTPUT_PATH = resolve(process.cwd(), "src/data/bjj-public.json")
const API_BASE = "https://api.notion.com/v1"
const NOGI_PATTERN = /(?:^|[\s()[\]·—/-])(no[\s-]?gi|노기)(?=$|[\s()[\]·—/-])/i
const MODE_TAG_PATTERN = /^(gi|no[\s-]?gi|노기)$/i

type JsonObject = { readonly [key: string]: unknown }
type Mode = "gi" | "nogi"
type SessionType = "class" | "openmat"

class PublicBjjFetchError extends Error {
  constructor(message: string, readonly causeValue?: unknown) {
    super(message)
    this.name = "PublicBjjFetchError"
  }
}

function object(value: unknown, label: string): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PublicBjjFetchError(`${label} must be an object`)
  }
  return value as JsonObject
}

function string(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function array(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : []
}

function text(property: unknown): string {
  const prop = object(property ?? {}, "Notion property")
  const parts = prop.type === "title" ? array(prop.title) : array(prop.rich_text)
  return parts.map((part) => string(object(part, "rich text").plain_text)).join("").trim()
}

function multiSelect(property: unknown): readonly string[] {
  const prop = object(property ?? {}, "Notion multi-select")
  return array(prop.multi_select).map((item) => string(object(item, "select item").name)).filter(Boolean)
}

function loadEnvFile(contents: string): void {
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue
    const separator = line.indexOf("=")
    if (separator < 1) continue
    const key = line.slice(0, separator).trim()
    if (process.env[key]) continue
    const rawValue = line.slice(separator + 1).trim()
    const quote = rawValue.at(0)
    process.env[key] = quote && quote === rawValue.at(-1) && (quote === '"' || quote === "'")
      ? rawValue.slice(1, -1)
      : rawValue
  }
}

async function loadSourceEnvironment(): Promise<void> {
  for (const filename of [".env.local", ".env.local.bak.20260804175124"]) {
    try {
      loadEnvFile(await readFile(resolve(SOURCE_ROOT, filename), "utf8"))
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error
    }
  }
}

async function notion(path: string, body: JsonObject): Promise<JsonObject> {
  const token = process.env.NOTION_TOKEN?.trim()
  if (!token) throw new PublicBjjFetchError("NOTION_TOKEN is not configured")
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new PublicBjjFetchError(`Notion request failed with HTTP ${response.status}`)
  return object(await response.json(), "Notion response")
}

async function queryAll(databaseId: string, sortByDate: boolean): Promise<readonly JsonObject[]> {
  const pages: JsonObject[] = []
  let cursor = ""
  do {
    const response = await notion(`/databases/${databaseId}/query`, {
      page_size: 100,
      ...(sortByDate ? { sorts: [{ property: "Date", direction: "descending" }] } : {}),
      ...(cursor ? { start_cursor: cursor } : {}),
    })
    pages.push(...array(response.results).map((page) => object(page, "Notion page")))
    cursor = response.has_more === true ? string(response.next_cursor) : ""
    if (response.has_more === true && !cursor) throw new PublicBjjFetchError("Notion pagination cursor is missing")
  } while (cursor)
  return pages
}

function dateValue(property: unknown): string {
  const date = object(object(property ?? {}, "date property").date ?? {}, "date value")
  return string(date.start).slice(0, 10)
}

function selectValue(property: unknown): string {
  const select = object(object(property ?? {}, "select property").select ?? {}, "select value")
  return string(select.name)
}

async function main(): Promise<void> {
  await loadSourceEnvironment()
  const trainingDatabase = process.env.NOTION_BJJ_DB_ID?.trim()
  const profileDatabase = process.env.NOTION_LO_PROFILE_DB_ID?.trim()
  if (!trainingDatabase || !profileDatabase) throw new PublicBjjFetchError("BJJ database environment is incomplete")

  const [trainingPages, profilePages] = await Promise.all([
    queryAll(trainingDatabase, true),
    queryAll(profileDatabase, false),
  ])
  if (profilePages.length !== 1) throw new PublicBjjFetchError(`Expected one public profile source, received ${profilePages.length}`)
  const profileProps = object(profilePages[0]?.properties, "profile properties")

  const sessions = trainingPages.flatMap((page) => {
    const props = object(page.properties, "training properties")
    const rawType = selectValue(props.SessionType)
    if (rawType === "promotion" || rawType === "study") return []
    const sessionType: SessionType = rawType === "openmat" ? "openmat" : "class"
    const date = dateValue(props.Date)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return []
    const allTags = [...multiSelect(props.Class), ...multiSelect(props.Sparring)]
    const title = text(props.Name)
    const mode: Mode = NOGI_PATTERN.test([title, ...allTags].join(" ")) ? "nogi" : "gi"
    const techniques = [...new Set(allTags.filter((tag) => !MODE_TAG_PATTERN.test(tag.trim())))]
      .sort((left, right) => left.localeCompare(right, "ko"))
    return [{ date, mode, type: sessionType, techniques }]
  }).sort((left, right) => right.date.localeCompare(left.date))

  const modeCounts = {
    gi: sessions.filter((session) => session.mode === "gi").length,
    nogi: sessions.filter((session) => session.mode === "nogi").length,
  }
  const monthlyMap = new Map<string, { gi: number; nogi: number }>()
  for (const session of sessions) {
    const month = session.date.slice(0, 7)
    const counts = monthlyMap.get(month) ?? { gi: 0, nogi: 0 }
    counts[session.mode] += 1
    monthlyMap.set(month, counts)
  }
  const monthly = [...monthlyMap.entries()]
    .map(([month, counts]) => ({ month, ...counts, total: counts.gi + counts.nogi }))
    .sort((left, right) => left.month.localeCompare(right.month))

  const publicData = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: "Notion · BJJ training + Lo Profile",
    profile: {
      displayName: text(profileProps.Name),
      belt: selectValue(profileProps.Belt).toLowerCase(),
      stripes: Number(object(profileProps.Stripes, "stripes property").number ?? 0),
      trainingStartDate: dateValue(profileProps["Training Start Date"]),
      characterImage: "/images/bjj/character-full.webp",
    },
    totals: {
      loggedSessions: sessions.length,
      gi: modeCounts.gi,
      nogi: modeCounts.nogi,
      class: sessions.filter((session) => session.type === "class").length,
      openmat: sessions.filter((session) => session.type === "openmat").length,
    },
    dateRange: { from: sessions.at(-1)?.date ?? null, to: sessions.at(0)?.date ?? null },
    monthly,
    sessions,
  }
  if (publicData.profile.belt !== "blue" || publicData.profile.stripes !== 3) {
    throw new PublicBjjFetchError("Profile boundary check failed: expected current blue belt with three stripes")
  }
  await writeFile(OUTPUT_PATH, `${JSON.stringify(publicData, null, 2)}\n`, "utf8")
  console.log(`Wrote ${sessions.length} public-safe sessions to ${OUTPUT_PATH}`)
}

try {
  await main()
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown public BJJ fetch failure"
  console.error(message)
  process.exitCode = 1
}
