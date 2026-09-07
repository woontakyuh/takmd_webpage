import { RESEARCH_PROFILE } from '../../data/research-profile';
import './research-profile.css';

export function ResearchProfile() {
  const { name, scholar, researchGate } = RESEARCH_PROFILE;

  return (
    <section className="research-profile" aria-label="Research profile">
      <header className="research-profile__heading">
        <p className="research-profile__eyebrow">Research profile</p>
        <h2 className="research-profile__name">{name}</h2>
      </header>
      <dl className="research-profile__metrics" aria-label={`${scholar.label} ${scholar.period.toLowerCase()} metrics`}>
        {scholar.metrics.map(metric => (
          <div className="research-profile__metric" key={metric.label}>
            <dt>{metric.label}</dt>
            <dd>{metric.value}</dd>
          </div>
        ))}
      </dl>
      <p className="research-profile__source">
        {scholar.period} · Source: {scholar.label}
        <span>Checked <time dateTime={scholar.checkedAt}>{scholar.checkedAt}</time></span>
      </p>
      <nav className="research-profile__links" aria-label="Research profiles">
        {[scholar, researchGate].map(profile => (
          <a href={profile.url} target="_blank" rel="noreferrer" key={profile.label} aria-label={`${profile.label} profile (opens in a new tab)`}>
            {profile.label} <span aria-hidden="true">↗</span>
          </a>
        ))}
      </nav>
    </section>
  );
}
