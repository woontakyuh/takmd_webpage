import { personalInterests } from './personal';
import type { PersonalInterest } from './personal';

export function PersonalReader({ interest }: { readonly interest: PersonalInterest }) {
  const content = personalInterests[interest];
  return <div className="personal-reader">
    <p className="studio-panel-intro">{content.introduction}</p>
    <div className="studio-editorial-note"><span>In the room</span><h3>{content.object}</h3><p>{content.description}</p></div>
    <a className="studio-text-link" href="https://instagram.com/takmd" target="_blank" rel="noreferrer">Instagram · @takmd ↗</a>
    <a className="studio-panel-footer" href={content.route}>{content.action}<span aria-hidden="true">↗</span></a>
  </div>;
}
