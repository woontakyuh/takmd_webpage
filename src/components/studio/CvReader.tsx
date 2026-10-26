import { academicInterests, activities, awards, career, education, educationPrograms, profileImage } from '../../data/cv';

type Props = {
  readonly publicationCount: number;
  readonly presentationCount: number;
  readonly inScreen?: boolean;
};

export function CvReader({ inScreen = false }: Props) {
  return <article className="cv-reader" data-in-screen={inScreen}>
    <header className="monitor-cv-cover">
      <p className="monitor-cv-eyebrow">Curriculum Vitae</p>
      <div className="monitor-cv-identity">
        <h1>Woon Tak Yuh, MD.</h1>
        <p>Neurosurgeon · Research · Teaching</p>
      </div>
      <section className="monitor-cv-interests" aria-label="Academic interests">
        <h2>Academic interests</h2>
        <p>{academicInterests.slice(0, 3).join(', ')}<br />{academicInterests[3]}</p>
      </section>
      <section className="monitor-cv-activities" aria-label="Academic and professional activities">
        <h2>Academic & professional activities</h2>
        <div className="monitor-cv-activity-columns">{[activities.slice(0, 4), activities.slice(4)].map((column, index) =>
          <div key={index}>{column.map(activity => <div className="monitor-cv-activity" key={activity.organization}>
            {index === 1 ? <p className="monitor-cv-inline"><span data-journal={activity.organization === 'Neurospine' || activity.organization === 'JMISST'}>{activity.organization}</span><span className="monitor-cv-inline-role">, {activity.role}</span></p> : <>
              <p>{activity.organization}</p>
              {activity.role.split('\n').map(role => <p key={role}>{role}</p>)}
            </>}
          </div>)}</div>)}
        </div>
      </section>
      <img className="monitor-cv-portrait" src={profileImage} alt="Woon Tak Yuh, MD" width="960" height="1280" draggable={false} />
      <p className="monitor-cv-cover-footer">Education · Career · Awards · Teaching & Education</p>
    </header>
    <div className="monitor-cv-details">
      <div className="monitor-cv-detail-columns">
        <section className="monitor-cv-section">
          <h2>Education</h2>
          {education.map(item => <div className="monitor-cv-timeline" key={`${item.year}-${item.text}`}>
            <span>{item.year}</span><p>{item.text}</p>
          </div>)}
        </section>
        <section className="monitor-cv-section">
          <h2>Career</h2>
          {career.map(item => <div className="monitor-cv-timeline" key={`${item.year}-${item.text}`}>
            <span>{item.year}</span><p>{item.text}</p>
          </div>)}
        </section>
      </div>
      <div className="monitor-cv-detail-columns">
        <section className="monitor-cv-section">
          <h2>Awards</h2>
          {awards.map(item => <div className="monitor-cv-timeline" key={`${item.year}-${item.text}`}>
            <span>{item.year}</span><p>{item.text}</p>
          </div>)}
        </section>
        <section className="monitor-cv-section">
          <h2>Teaching &amp; Education</h2>
          {educationPrograms.map(item => <div className="monitor-cv-training" key={item.title}>
            <p className="monitor-cv-meta">{item.meta}</p><h3>{item.title}</h3><p>{item.description}</p>
          </div>)}
        </section>
      </div>
      <nav className="monitor-cv-section monitor-cv-collections" aria-label="Research and teaching collections">
        <a href="/research">Explore research →</a>
        <a href="/education">Explore education →</a>
      </nav>
      <footer className="monitor-cv-footer"><span>Woon Tak Yuh, MD.</span><a href="/contact">Get in touch ↗</a></footer>
    </div>
  </article>;
}
