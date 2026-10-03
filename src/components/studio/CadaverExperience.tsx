import { facultyAppearances } from '../../data/workshop-faculty-appearances';
import talkMedia from '../../data/studio-talk-media.json';
import tsessPhotos from '../../data/tsess-workshop-photos.json';
import { RoomPhotoGallery } from './RoomPhotoGallery';

export function CadaverExperience({ onTalk }: { readonly onTalk: (id: string) => void }) {
  return <>
    <p className="studio-panel-intro">Teaching endoscopic approaches in the anatomy lab — individual faculty invitations and international team exchange.</p>
    {facultyAppearances.filter(appearance => appearance.modality === 'cadaver').map(appearance => <section className="studio-editorial-note" key={appearance.id}>
      <span>{appearance.date}{'endDate' in appearance ? ` – ${appearance.endDate}` : ''} · {appearance.venue.city}, {appearance.venue.country}</span>
      <h3>{appearance.event}</h3>
      <p>{appearance.title}</p>
      <p>{appearance.venue.name}</p>
      <p className="office-detail-source">{appearance.relation === 'team-dispatch' ? 'Team faculty exchange' : 'Invited faculty'}{appearance.id === '2026-09-12-cgbio-cadaver' ? ' · Participants from Korea and Brazil' : ''}</p>
      {'links' in appearance && <RoomPhotoGallery photos={talkMedia.find(media => media.id === appearance.links.presentationId && media.kind === 'photos')?.slides ?? []} />}
      {appearance.id === '2026-06-08-tsess-hualien' && <RoomPhotoGallery photos={[
        ...tsessPhotos,
        { src: '/models/personal-awards/additions/tsess-instructor-2026.webp', thumbnail: '/models/personal-awards/additions/tsess-instructor-2026-phone.webp', caption: 'TSESS 2026 · Instructor certificate' },
      ]} />}
      {appearance.id === '2026-09-12-cgbio-cadaver' && <RoomPhotoGallery photos={[
        { src: '/models/personal-awards/cgbio-2026/group-photo.webp', thumbnail: '/models/personal-awards/cgbio-2026/group-photo-phone.webp', caption: 'CGBIO Academy · Faculty and participants' },
        { src: '/models/personal-awards/cgbio-2026/certificate.webp', thumbnail: '/models/personal-awards/cgbio-2026/certificate-phone.webp', caption: 'CGBIO Academy · Faculty certificate' },
      ]} />}
      {'links' in appearance && appearance.links.presentationId && <button className="clinical-talk" type="button" onClick={() => onTalk(appearance.links.presentationId)}>View Spine Summit presentation →</button>}
    </section>)}
    <a className="studio-panel-footer" href="/workshops/cadaver" target="_blank" rel="noopener noreferrer">Explore the cadaver workshop portfolio<span aria-hidden="true">↗</span></a>
  </>;
}
