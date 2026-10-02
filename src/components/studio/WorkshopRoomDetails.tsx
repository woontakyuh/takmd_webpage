import { getWorkshop, workshops } from '../../data/workshops';
import { sessionsFor, workshopSessions, type WorkshopSession } from '../../data/workshop-sessions';
import { curriculumStages } from '../../data/workshop-curriculum';
import { workshopDate } from '../workshops/presentation';
import { RoomPhotoGallery } from './RoomPhotoGallery';

export function WorkshopDetails({ slug }: { readonly slug: string }) {
  const workshop = getWorkshop(slug);
  const sessions: readonly WorkshopSession[] = workshop ? sessionsFor(workshop.slug) : workshopSessions;
  const completed = sessions.filter(session => session.status === 'held');
  const ordered = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  const animal = slug === 'animal-pig';
  const stage = curriculumStages.find(stage => 'slug' in stage && stage.slug === slug);
  const images = animal ? [
    { src: '/studio/workshop-room/animal-group.webp', caption: 'Faculty and participants · 8 August 2026' },
    { src: '/studio/workshop-room/animal-practice.webp', caption: 'Supervised endoscopic practice in the animal lab' },
    { src: '/studio/workshop-room/animal-lecture.webp', caption: 'Porcine anatomy teaching before hands-on practice' },
  ] : [
    { src: '/studio/workshop-room/dummy-group.webp', caption: 'Faculty and participants · 15 June 2025' },
    { src: '/studio/workshop-room/dummy-practice.webp', caption: 'Faculty-guided practice on a lumbar simulator' },
    { src: '/studio/workshop-room/dummy-lecture.webp', caption: 'Anatomy and technique teaching before practice' },
  ];
  return <>
    <p className="studio-kicker">Spinoscopy Workshop Team{workshop ? ` / Stage ${workshop.stage}` : ''}</p>
    <p className="studio-panel-intro">{animal ? 'A live porcine lab connecting anatomical teaching with supervised endoscopic practice. Small groups work through the procedure with faculty at each station.' : stage?.summary ?? 'A continuous teaching program from simulation to surgical practice.'}</p>
    <RoomPhotoGallery photos={images} />
    <div className="workshop-session-heading"><h3>Sessions</h3><span>{completed.length} completed · Latest first</span></div>
    <div className="workshop-room-sessions">{ordered.map(session => <section className="workshop-session" key={session.id}>
      <header><span className="studio-kicker">Session {String(session.modalityNo).padStart(2, '0')} · {session.role}{session.status === 'planned' ? ' · Planned' : ''}</span><h3>{workshopDate(session.date)}</h3></header>
      {session.venue && <p className="workshop-session-venue">{session.venue.name}<br />{session.venue.city}</p>}
      {session.lectures && <div className="workshop-session-part"><h4>Teaching</h4><ul>{session.lectures.map(lecture => <li key={lecture.title}><p>{lecture.title}</p><small>{lecture.speaker} · {lecture.affiliation}</small></li>)}</ul></div>}
      {session.handsOn && <div className="workshop-session-part"><h4>Hands-on practice</h4><p>{session.handsOn.format}</p><small>{[session.handsOn.groups ? `${session.handsOn.groups} groups` : '', session.handsOn.sessions ? `${session.handsOn.sessions} practical sessions` : '', session.handsOn.durationMin ? `${session.handsOn.durationMin} minutes` : ''].filter(Boolean).join(' · ')}</small></div>}
      {session.trainees && <p className="workshop-session-meta">{session.trainees.count} participants</p>}
      {session.certification && <p className="workshop-session-meta">Followed by a certificate ceremony</p>}
      <details className="workshop-programme"><summary>Programme details</summary><p>{session.title}</p>{session.titleKo && <p lang="ko">{session.titleKo}</p>}<p>{session.audience}</p>{session.trainees?.composition && <p>{session.trainees.composition.join(' · ')}</p>}</details>
    </section>)}</div>
    <a className="studio-panel-footer" href={workshop ? `/workshops/${workshop.slug}` : '/workshops'} target="_blank" rel="noopener noreferrer">Explore the workshop portfolio<span aria-hidden="true">↗</span></a>
    <nav className="office-detail-links" aria-label="Workshop themes">{workshops.filter(item => item.slug !== slug).map(item => <a href={`/workshops/${item.slug}`} key={item.slug}>{item.title} →</a>)}</nav>
  </>;
}
