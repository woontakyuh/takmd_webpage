import { getWorkshop, workshops } from '../../data/workshops';
import { sessionsFor, workshopSessions, type WorkshopSession } from '../../data/workshop-sessions';
import { curriculumStages } from '../../data/workshop-curriculum';
import { workshopDate } from '../workshops/presentation';

export function WorkshopDetails({ slug }: { readonly slug: string }) {
  const workshop = getWorkshop(slug);
  const sessions: readonly WorkshopSession[] = workshop ? sessionsFor(workshop.slug) : workshopSessions;
  const completed = sessions.filter(session => session.status === 'held');
  const animal = slug === 'animal-pig';
  const stage = curriculumStages.find(stage => 'slug' in stage && stage.slug === slug);
  const images = animal ? [
    { src: '/studio/workshop-room/animal-group.webp', caption: 'Faculty and participants · 8 August 2026' },
    { src: '/studio/workshop-room/animal-practice.webp', caption: 'Supervised endoscopic practice in the animal lab' },
    { src: '/studio/workshop-room/animal-lecture.webp', caption: 'Porcine anatomy teaching before hands-on practice' },
  ] : [
    { src: '/studio/workshop-room/dummy-group.webp', caption: 'Dummy workshop faculty and participants · June 2025' },
    { src: '/studio/workshop-room/dummy-practice.webp', caption: 'Faculty-guided practice on a lumbar simulator' },
    { src: '/studio/workshop-room/dummy-lecture.webp', caption: 'Anatomy and technique teaching before practice' },
  ];
  return <>
    <p className="studio-kicker">Spinoscopy Workshop Team{workshop ? ` / Stage ${workshop.stage}` : ''}</p>
    <p className="studio-panel-intro">{animal ? 'A live porcine lab connecting anatomical teaching with supervised endoscopic practice. Small groups work through the procedure with faculty at each station.' : stage?.summary ?? 'A continuous teaching program from simulation to surgical practice.'}</p>
    <div className="workshop-room-gallery">{images.map(image => <figure key={image.src}><img src={image.src} alt={image.caption} loading="lazy" /><figcaption>{image.caption}</figcaption></figure>)}</div>
    <p className="office-detail-source">{completed.length} completed {completed.length === 1 ? 'session' : 'sessions'}</p>
    <div className="workshop-room-sessions">{[...sessions].reverse().map(session => <section className="studio-editorial-note" key={session.id}>
      <span>{workshopDate(session.date)} · {session.status === 'held' ? 'Completed' : 'Planned'}</span>
      <h3>{session.title}</h3>
      {session.titleKo && <p lang="ko">{session.titleKo}</p>}
      {session.venue && <p>{session.venue.name} · {session.venue.city}</p>}
      <p>{session.audience}</p>
      {session.handsOn && <p><strong>Hands-on</strong> · {session.handsOn.format}{session.handsOn.durationMin ? ` · ${session.handsOn.durationMin} minutes` : ''}{session.handsOn.groups ? ` · ${session.handsOn.groups} groups` : ''}</p>}
      {session.lectures && <ul className="office-detail-list">{session.lectures.map(lecture => <li key={lecture.title}>{lecture.title}<br /><small>{lecture.speaker} · {lecture.affiliation}</small></li>)}</ul>}
      {session.trainees && <p>{session.trainees.count} trainees{session.trainees.composition ? ` · ${session.trainees.composition.join(', ')}` : ''}</p>}
      {session.certification && <p>Certificate ceremony</p>}
    </section>)}</div>
    <a className="studio-panel-footer" href={workshop ? `/workshops/${workshop.slug}` : '/workshops'} target="_blank" rel="noopener noreferrer">Explore the workshop portfolio<span aria-hidden="true">↗</span></a>
    <nav className="office-detail-links" aria-label="Workshop themes">{workshops.filter(item => item.slug !== slug).map(item => <a href={`/workshops/${item.slug}`} key={item.slug}>{item.title} →</a>)}</nav>
  </>;
}
