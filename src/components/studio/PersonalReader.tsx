import { useId, useState } from 'react';
import bjjData from '../../data/bjj-public.json';
import { PERSONAL_LINKS, personalInterests } from './personal';
import type { PersonalInterest } from './personal';
import './office-details.css';

function TrainingRecord() {
  const monthId = useId();
  const [mode, setMode] = useState<'gi' | 'nogi'>('gi');
  const [month, setMonth] = useState(bjjData.monthly.at(-1)?.month ?? '');
  const sessions = bjjData.sessions.filter(session => session.mode === mode && session.date.startsWith(month));
  return <section className="studio-editorial-note">
    <span>Training record · since {bjjData.profile.trainingStartDate.slice(0, 4)}</span>
    <h3>Jiu-jitsu, kept honest.</h3>
    <p>A living record of showing up, learning one position at a time, and returning to the mat.</p>
    <div className="office-personal-profile">
      <img src={bjjData.profile.characterImage} alt="Woon Tak Yuh in his jiu-jitsu gi" width={160} height={240} loading="lazy" />
      <div><strong>{bjjData.profile.displayName}</strong><p>{bjjData.profile.belt} belt · {bjjData.profile.stripes} stripes</p><p>{bjjData.totals.loggedSessions} logged mat sessions · {bjjData.totals.class} classes · {bjjData.totals.openmat} open mats</p></div>
    </div>
    <div className="office-detail-controls" aria-label="Training mode">{(['gi', 'nogi'] as const).map(value => <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)}>{value === 'gi' ? 'Gi' : 'No-Gi'} · {bjjData.totals[value]}</button>)}</div>
    <label className="reader-filter" htmlFor={monthId}>Training month <select id={monthId} value={month} onChange={event => setMonth(event.target.value)}>{bjjData.monthly.map(item => <option key={item.month} value={item.month}>{item.month} · {item[mode]} sessions</option>)}</select></label>
    <div className="workflow-steps">{sessions.map((session, index) => <details key={`${session.date}-${session.type}-${index}`}>
      <summary><time dateTime={session.date}>{session.date}</time> · {session.type === 'openmat' ? 'Open mat' : 'Class'}</summary>
      {session.techniques.length > 0 ? <ul className="office-detail-list">{session.techniques.map(technique => <li key={technique}>{technique}</li>)}</ul> : <p>No technique tags recorded for this session.</p>}
    </details>)}</div>
    {sessions.length === 0 && <p className="studio-empty">No {mode === 'gi' ? 'Gi' : 'No-Gi'} sessions logged in this month.</p>}
    <p className="office-detail-source">Notion snapshot · {bjjData.dateRange.from}–{bjjData.dateRange.to} · Refreshed {bjjData.generatedAt.slice(0, 10)}</p>
  </section>;
}

export function PersonalReader({ interest }: { readonly interest: PersonalInterest }) {
  const content = personalInterests[interest];
  const other = personalInterests[interest === 'bjj' ? 'surfing' : 'bjj'];
  return <div className="personal-reader">
    <p className="studio-panel-intro">{content.introduction}</p>
    <div className="studio-editorial-note"><span>In the room</span><h3>{content.object}</h3><p>{content.description}</p></div>
    {interest === 'bjj' && <TrainingRecord />}
    <a className="studio-text-link" href={PERSONAL_LINKS.instagram} target="_blank" rel="noreferrer">Instagram · @tak_md ↗</a>
    <a className="studio-panel-footer" href={`${PERSONAL_LINKS.email}?subject=${encodeURIComponent(content.emailSubject)}`}>Say hello by email<span aria-hidden="true">↗</span></a>
    <a className="studio-panel-footer" href={other.route}>{other.title}<span aria-hidden="true">→</span></a>
  </div>;
}
