import { useMemo, useState } from "react"

type Mode = "gi" | "nogi"
type SessionType = "class" | "openmat"

type PublicSession = {
  readonly date: string
  readonly mode: Mode
  readonly type: SessionType
  readonly techniques: readonly string[]
}

type PublicMonth = {
  readonly month: string
  readonly gi: number
  readonly nogi: number
  readonly total: number
}

export type BjjPublicData = {
  readonly generatedAt: string
  readonly profile: {
    readonly displayName: string
    readonly belt: string
    readonly stripes: number
    readonly trainingStartDate: string
    readonly characterImage: string
  }
  readonly totals: {
    readonly loggedSessions: number
    readonly gi: number
    readonly nogi: number
    readonly class: number
    readonly openmat: number
  }
  readonly dateRange: { readonly from: string | null; readonly to: string | null }
  readonly monthly: readonly PublicMonth[]
  readonly sessions: readonly PublicSession[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function isMode(value: unknown): value is Mode {
  return value === "gi" || value === "nogi"
}

function isSessionType(value: unknown): value is SessionType {
  return value === "class" || value === "openmat"
}

function isPublicSession(value: unknown): value is PublicSession {
  return isRecord(value)
    && typeof value.date === "string"
    && isMode(value.mode)
    && isSessionType(value.type)
    && Array.isArray(value.techniques)
    && value.techniques.every((technique) => typeof technique === "string")
}

function isPublicMonth(value: unknown): value is PublicMonth {
  return isRecord(value)
    && typeof value.month === "string"
    && typeof value.gi === "number"
    && typeof value.nogi === "number"
    && typeof value.total === "number"
}

function isBjjPublicData(value: unknown): value is BjjPublicData {
  if (!isRecord(value) || !isRecord(value.profile) || !isRecord(value.totals) || !isRecord(value.dateRange)) return false
  const profile = value.profile
  const totals = value.totals
  const dateRange = value.dateRange
  return typeof value.generatedAt === "string"
    && typeof profile.displayName === "string"
    && typeof profile.belt === "string"
    && typeof profile.stripes === "number"
    && typeof profile.trainingStartDate === "string"
    && typeof profile.characterImage === "string"
    && typeof totals.loggedSessions === "number"
    && typeof totals.gi === "number"
    && typeof totals.nogi === "number"
    && typeof totals.class === "number"
    && typeof totals.openmat === "number"
    && (dateRange.from === null || typeof dateRange.from === "string")
    && (dateRange.to === null || typeof dateRange.to === "string")
    && Array.isArray(value.monthly)
    && value.monthly.every(isPublicMonth)
    && Array.isArray(value.sessions)
    && value.sessions.every(isPublicSession)
}

const DATE_FORMAT = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})

function formatDate(value: string): string {
  return DATE_FORMAT.format(new Date(`${value}T00:00:00Z`))
}

function monthLabel(value: string): string {
  return new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" })
    .format(new Date(`${value}-01T00:00:00Z`))
}

function StripeMarks({ count }: { readonly count: number }) {
  return (
    <span className="bjj-belt" aria-label={`Blue belt, ${count} stripes`}>
      <span className="bjj-belt__bar" />
      <span className="bjj-belt__rank">
        {Array.from({ length: count }, (_, index) => <i key={index} />)}
      </span>
    </span>
  )
}

export function BjjTrainingExplorer({ data }: { readonly data: unknown }) {
  if (!isBjjPublicData(data)) {
    return <p role="alert">Training data is unavailable.</p>
  }
  return <TrainingExplorer data={data} />
}

function TrainingExplorer({ data }: { readonly data: BjjPublicData }) {
  const newestMonth = data.monthly.at(-1)?.month ?? ""
  const [mode, setMode] = useState<Mode>("gi")
  const [month, setMonth] = useState(newestMonth)
  const monthSessions = useMemo(
    () => data.sessions.filter((session) => session.mode === mode && session.date.startsWith(month)),
    [data.sessions, mode, month],
  )
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selected = monthSessions[selectedIndex] ?? monthSessions[0] ?? null
  const maximumMonthCount = Math.max(1, ...data.monthly.map((item) => item.total))
  const activeTotal = data.totals[mode]

  return (
    <div className="bjj-explorer">
      <section className="bjj-hero" aria-labelledby="bjj-title">
        <div className="bjj-hero__copy">
          <a className="bjj-back" href="/">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
            Back to the office
          </a>
          <p className="bjj-kicker">The practice · since 2019</p>
          <h1 id="bjj-title">Jiu-jitsu,<br /><em>kept honest.</em></h1>
          <p className="bjj-intro">
            A living record of showing up, learning one position at a time, and returning to the mat.
          </p>
          <div className="bjj-rank">
            <StripeMarks count={data.profile.stripes} />
            <div>
              <strong>{data.profile.belt} belt · {data.profile.stripes} stripes</strong>
              <span>{data.profile.displayName} · training since {data.profile.trainingStartDate.slice(0, 4)}</span>
            </div>
          </div>
        </div>

        <div className="bjj-portrait">
          <div className="bjj-portrait__halo" aria-hidden="true" />
          <img src={data.profile.characterImage} alt={`${data.profile.displayName} in a white jiu-jitsu gi wearing a blue belt`} />
          <p className="bjj-portrait__caption"><span>01</span> The practitioner</p>
        </div>

        <div className="bjj-hero__metric" aria-label={`${data.totals.loggedSessions} logged mat sessions`}>
          <span>{data.totals.loggedSessions}</span>
          <p>mat sessions<br />logged in Notion</p>
        </div>
      </section>

      <section className="bjj-training" aria-labelledby="training-title">
        <div className="bjj-training__heading">
          <div>
            <p className="bjj-kicker">Training rhythm</p>
            <h2 id="training-title">The work, month by month.</h2>
          </div>
          <div className="bjj-mode" aria-label="Training mode">
            {(["gi", "nogi"] as const).map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={mode === value}
                onClick={() => { setMode(value); setSelectedIndex(0) }}
              >
                {value === "gi" ? "Gi" : "No-Gi"}
                <span>{data.totals[value]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bjj-rhythm" aria-label={`${mode === "gi" ? "Gi" : "No-Gi"} monthly training sessions`}>
          {data.monthly.map((item) => {
            const count = item[mode]
            const isActive = month === item.month
            return (
              <button
                type="button"
                key={item.month}
                className={isActive ? "is-active" : ""}
                aria-pressed={isActive}
                aria-label={`${monthLabel(item.month)} ${item.month.slice(0, 4)}, ${count} ${mode === "gi" ? "Gi" : "No-Gi"} sessions`}
                onClick={() => { setMonth(item.month); setSelectedIndex(0) }}
              >
                <span className="bjj-rhythm__count">{count}</span>
                <span className="bjj-rhythm__track">
                  <i style={{ transform: `scaleY(${count / maximumMonthCount})` }} />
                </span>
                <span className="bjj-rhythm__month">{monthLabel(item.month)}</span>
              </button>
            )
          })}
        </div>

        <div className="bjj-session-grid">
          <div className="bjj-session-list">
            <div className="bjj-session-list__head">
              <p>{month ? `${monthLabel(month)} ${month.slice(0, 4)}` : "Sessions"}</p>
              <span>{monthSessions.length} {mode === "gi" ? "Gi" : "No-Gi"}</span>
            </div>
            {monthSessions.length > 0 ? monthSessions.map((session, index) => (
              <button
                type="button"
                key={`${session.date}-${session.type}-${index}`}
                className={selectedIndex === index ? "is-selected" : ""}
                aria-pressed={selectedIndex === index}
                onClick={() => setSelectedIndex(index)}
              >
                <time dateTime={session.date}>{formatDate(session.date)}</time>
                <span>{session.type === "openmat" ? "Open mat" : "Class"}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            )) : <p className="bjj-empty">No {mode === "gi" ? "Gi" : "No-Gi"} sessions logged in this month.</p>}
          </div>

          <aside className="bjj-session-detail" aria-live="polite">
            {selected ? (
              <>
                <p className="bjj-kicker">Selected session</p>
                <time dateTime={selected.date}>{formatDate(selected.date)}</time>
                <div className="bjj-session-detail__meta">
                  <span>{selected.mode === "gi" ? "Gi" : "No-Gi"}</span>
                  <span>{selected.type === "openmat" ? "Open mat" : "Class"}</span>
                </div>
                <h3>Techniques recorded</h3>
                {selected.techniques.length > 0 ? (
                  <ul>{selected.techniques.map((technique) => <li key={technique}>{technique}</li>)}</ul>
                ) : <p className="bjj-session-detail__quiet">No technique tags recorded for this session.</p>}
              </>
            ) : (
              <>
                <p className="bjj-kicker">Selected session</p>
                <p className="bjj-session-detail__quiet">Choose a month with logged sessions.</p>
              </>
            )}
          </aside>
        </div>

        <footer className="bjj-freshness">
          <span><i className="bjj-freshness__dot" /> Notion snapshot</span>
          <span>Through {data.dateRange.to ? formatDate(data.dateRange.to) : "no dated sessions"}</span>
          <span>Refreshed {formatDate(data.generatedAt.slice(0, 10))}</span>
          <span>{activeTotal} {mode === "gi" ? "Gi" : "No-Gi"} sessions shown</span>
        </footer>
      </section>
    </div>
  )
}
