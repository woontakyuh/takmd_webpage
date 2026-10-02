import { academicInterests, activities, awards, career, currentRoles, educationPrograms, profileImage } from '../../data/cv';
import publicationsData from '../../data/publications.json';
import surgerySummary from '../../data/public-surgery-summary.json';
import { countPublicationRoles } from '../../data/publicationAuthorship';

const authorship = countPublicationRoles(publicationsData.publications);

type Props = {
  readonly publicationCount: number;
  readonly presentationCount: number;
  readonly inScreen?: boolean;
};

export function CvReader({ publicationCount, presentationCount, inScreen = false }: Props) {
  return <article className="cv-reader" data-in-screen={inScreen}>
    <header className="monitor-cv-cover">
      <p className="monitor-cv-eyebrow">Curriculum Vitae / TakMD</p>
      <div className="monitor-cv-identity">
        <h1>Woon Tak Yuh, MD.</h1>
        <p>Neurosurgeon · Research · Teaching</p>
        <p className="monitor-cv-appointment">{currentRoles[0]}</p>
      </div>
      <section className="monitor-cv-interests" aria-label="Academic interests">
        <h2>Academic interests</h2>
        {academicInterests.map(interest => <p key={interest}>{interest}</p>)}
      </section>
      <section className="monitor-cv-activities" aria-label="Academic and professional activities">
        <h2>Academic & professional activities</h2>
        <div className="monitor-cv-activity-columns">{[activities.slice(0, 5), activities.slice(5)].map((column, index) =>
          <div key={index}>{column.map(activity => <div className="monitor-cv-activity" key={activity.organization}>
            <p data-journal={activity.organization === 'Neurospine' || activity.organization === 'JMISST'}>{activity.organization}</p>
            <p>{activity.role}</p>
          </div>)}</div>)}
        </div>
      </section>
      <img className="monitor-cv-portrait" src={profileImage} alt="Woon Tak Yuh, MD" width="960" height="1280" draggable={false} />
      <p className="monitor-cv-cover-footer">Career · Education · Publications · Teaching</p>
    </header>
    <div className="monitor-cv-details">
      <section className="monitor-cv-metrics" aria-label="Career in numbers">
        <div><strong>{publicationCount}</strong><span>Publications</span><p>{authorship.first} first · {authorship.corresponding} corresponding · {authorship.coauthor} coauthor</p></div>
        <div><strong>{presentationCount}</strong><span>Presentations</span><p>Talks, workshops and teaching</p></div>
        <div><strong>{surgerySummary.totalCases.toLocaleString()}</strong><span>Clinical cases</span></div>
        <div><strong>80+</strong><span>Surgeons trained</span><p>Across 15+ countries</p></div>
      </section>
      <div className="monitor-cv-detail-columns">
        <section className="monitor-cv-section">
          <h2>Career & education</h2>
          {career.map(item => <div className="monitor-cv-timeline" key={`${item.year}-${item.text}`}>
            <span>{item.year}</span><p>{item.text}</p>
          </div>)}
        </section>
        <div>
          <section className="monitor-cv-section">
            <h2>Teaching & training</h2>
            {educationPrograms.map(item => <div className="monitor-cv-training" key={item.title}>
              <p className="monitor-cv-meta">{item.meta}</p><h3>{item.title}</h3><p>{item.description}</p>
            </div>)}
          </section>
          <section className="monitor-cv-section">
            <h2>Awards</h2>
            {awards.map(item => <div className="monitor-cv-timeline" key={`${item.year}-${item.text}`}>
              <span>{item.year}</span><p>{item.text}</p>
            </div>)}
          </section>
        </div>
      </div>
      <nav className="monitor-cv-section monitor-cv-collections" aria-label="Research and teaching collections">
        <a href="/research">Explore research →</a>
        <a href="/education">Explore education →</a>
      </nav>
      <footer className="monitor-cv-footer"><span>Woon Tak Yuh, MD.</span><a href="/contact">Get in touch ↗</a></footer>
    </div>
  </article>;
}
