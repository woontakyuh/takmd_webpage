import { facultyAppearances } from '../../data/workshop-faculty-appearances';

export function CadaverExperience({ onTalk }: { readonly onTalk: (id: string) => void }) {
  return <>
    <p className="studio-panel-intro">Teaching endoscopic approaches in the anatomy lab — individual faculty invitations and international team exchange.</p>
    {facultyAppearances.filter(appearance => appearance.modality === 'cadaver').map(appearance => <section className="studio-editorial-note" key={appearance.id}>
      <span>{appearance.date}{'endDate' in appearance ? ` – ${appearance.endDate}` : ''} · {appearance.venue.city}, {appearance.venue.country}</span>
      <h3>{appearance.event}</h3>
      <p>{appearance.title}</p>
      <p>{appearance.venue.name}</p>
      <p className="office-detail-source">{appearance.relation === 'team-dispatch' ? 'Team faculty exchange' : 'Invited faculty'}{appearance.id === '2026-09-12-cgbio-cadaver' ? ' · Participants from Korea and Brazil' : ''}</p>
      {'links' in appearance && appearance.links.presentationId && <button className="clinical-talk" type="button" onClick={() => onTalk(appearance.links.presentationId)}>View Spine Summit presentation →</button>}
    </section>)}
    <a className="studio-panel-footer" href="/workshops/cadaver" target="_blank" rel="noopener noreferrer">Explore the cadaver workshop portfolio<span aria-hidden="true">↗</span></a>
  </>;
}
