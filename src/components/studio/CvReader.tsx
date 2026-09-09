import { academicInterests, awards, career, currentRoles, educationPrograms, profileImage } from '../../data/cv';

export function CvReader({ publicationCount, presentationCount, inScreen = false }: {
  readonly publicationCount: number;
  readonly presentationCount: number;
  readonly inScreen?: boolean;
}) {
  return <div className="cv-reader">
    <div className="cv-intro">
      <img className="screen-cv-profile" src={profileImage} alt="Woon Tak Yuh, MD." width="960" height="1280" />
      <p className="studio-panel-intro"><strong>Woon Tak Yuh, MD.</strong><br />Endoscopic spine surgery<br />Research · Teaching</p>
    </div>
    {!inScreen && <a className="studio-panel-footer" href="/cv">Open the complete CV <span>↗</span></a>}
    <section className="studio-editorial-note">
      <span>Academic interests</span>
      <div className="reader-list">{academicInterests.map(interest => <p key={interest}>{interest}</p>)}</div>
    </section>
    <section className="studio-editorial-note">
      <span>Appointment & activities</span>
      <div className="reader-list">{currentRoles.map(role => <p key={role}>{role}</p>)}</div>
    </section>
    <section className="studio-editorial-note">
      <span>Career & education</span>
      {career.map(item => <div className="cv-career-row" key={`${item.year}-${item.text}`}>
        <span className="studio-meta">{item.year}</span><p>{item.text}</p>
      </div>)}
    </section>
    <section className="studio-editorial-note">
      <span>Awards</span>
      {awards.map(item => <div className="cv-career-row" key={`${item.year}-${item.text}`}>
        <span className="studio-meta">{item.year}</span><p>{item.text}</p>
      </div>)}
    </section>
    <section className="studio-editorial-note">
      <span>Teaching & training</span>
      {educationPrograms.map(item => <details className="clinical-detail" key={item.title}>
        <summary>{item.title}</summary><p className="studio-meta">{item.meta}</p><p>{item.description}</p>
      </details>)}
    </section>
    <a className="studio-panel-footer" href="/research">{publicationCount} publications <span>↗</span></a>
    <a className="studio-panel-footer" href="/education">{presentationCount} presentations <span>↗</span></a>
    <a className="studio-panel-footer" href="/contact">Get in touch <span>↗</span></a>
  </div>;
}
