import { useState } from 'react';
import { PERSONAL_LINKS } from './personal';
import './clinical-details.css';

const topics = ['Concept', 'Tumor', 'Trauma', 'Infection', 'Congenital & CSF'] as const;
type Topic = typeof topics[number];
const review = 'https://doi.org/10.3390/bioengineering10121363';
const schwannoma = 'https://doi.org/10.21182/jmisst.2025.02747';
const chiari = 'https://doi.org/10.21182/jmisst.2025.02621';

function Paper({ href, title, credit }: { readonly href: string; readonly title: string; readonly credit: string }) {
  return <a className="clinical-paper" href={href} target="_blank" rel="noopener noreferrer"><span className="studio-kicker">{credit}</span><strong>{title}</strong><span>Read paper ↗</span></a>;
}

export function ClinicalDetails({ onTalk }: { readonly onTalk: (id: string) => void }) {
  const [topic, setTopic] = useState<Topic>('Concept');
  return <div className="clinical-story">
    <p className="studio-kicker">Unilateral biportal endoscopy</p>
    <h3 className="reader-detail-title">State of the art.<br />Expanding indications.</h3>
    <p className="studio-panel-intro">From degenerative spine disease to selected tumors, trauma, infection and craniovertebral or CSF disorders: the technology, the published evidence, and the work I am developing.</p>
    <div className="clinical-topics" role="group" aria-label="Endoscopic surgery topics">{topics.map(item => <button type="button" key={item} aria-pressed={topic === item} onClick={() => setTopic(item)}>{item}</button>)}</div>
    <section className="clinical-topic" aria-label={topic}>
      {topic === 'Concept' && <>
        <h4>One portal to see. One portal to work.</h4>
        <p>UBE separates the endoscope from the working instruments. Unlike a full-endoscopic system with instruments passing through the scope, this separation allows independent viewing and working trajectories.</p>
        <figure><img src="/studio/clinical/ess-portals.webp" width="2158" height="1619" alt="Published comparison: full-endoscopic instruments through one scope on the left, separate UBE viewing and working portals on the right" /><figcaption>FESS (left) and UBE (right). Yuh et al., Bioengineering 2023, Figure 1. <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a> · Layout preserved; WebP encoding.</figcaption></figure>
        <h4>The technological foundation</h4>
        <p>My review examines three enabling technologies: camera and lighting systems for anatomical visibility, radiofrequency equipment for tissue work and bleeding control, and drills for bone work in an irrigated field.</p>
        <p>Degenerative disease remains the main clinical setting. The following chapters explore how this platform is being applied beyond it, with the evidence and maturity of each application made explicit.</p>
        <Paper href={review} title="Future of Endoscopic Spine Surgery: Insights from Cutting-Edge Technology in the Industrial Field" credit="My published review · Bioengineering · 2023" />
      </>}
      {topic === 'Tumor' && <>
        <h4>Beyond degenerative disease</h4>
        <p className="studio-kicker">Published case · C1–2 extradural schwannoma</p>
        <p>Our report describes UBE removal of an extradural schwannoma at C1–2, where the spinal cord and vertebral artery make access demanding. It documents a selected clinical application, rather than establishing a general indication for every spinal tumor.</p>
        <figure><img src="/studio/clinical/cervical-schwannoma.webp" width="1335" height="1314" alt="Published preoperative CT and MRI showing the C1–2 extradural schwannoma" loading="lazy" /><figcaption>Preoperative imaging. Yuh et al., JMISST 2026, Figure 1. <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noreferrer">CC BY-NC 4.0</a> · Layout preserved; WebP encoding.</figcaption></figure>
        <Paper href={schwannoma} title="UBE Removal of a Cervical Extradural Schwannoma at the C1–2 Level" credit="My published case · JMISST · 2026" />
        <h4>Dumbbell-shaped schwannoma</h4><p>Cervical dumbbell tumors are also part of my conference teaching, with an emphasis on access, surgical tactics and technical nuance.</p>
        <button type="button" className="clinical-talk" onClick={() => onTalk('256908af25b98023b8beeb0cc3d039cc')}>View presentation · ThaiSMISST 2025 →</button>
        <h4>Metastatic disease</h4><p className="studio-kicker">My ongoing clinical experience</p><p>I am collecting cases of endoscopic surgery for spinal metastatic disease. This personal series has not yet been presented here as published results.</p>
      </>}
      {topic === 'Trauma' && <>
        <h4>Using the fixation corridor</h4><p className="studio-kicker">My ongoing clinical experience</p>
        <p>In my trauma work, percutaneous fixation can be combined with endoscopic facet fusion through the incision used for percutaneous screw insertion.</p>
        <p>The focus is the shared access corridor: using an existing fixation incision for endoscopic work at the facet, rather than creating a separate exposure. This section describes my developing practice; a clinical series and outcomes are not yet presented.</p>
      </>}
      {topic === 'Infection' && <>
        <h4>Debridement, sampling and stability</h4><p className="studio-kicker">My clinical experience</p>
        <p>Applications in my practice include epidural abscess removal, irrigation and culture sampling. In selected spondylodiscitis cases, a transpedicular approach can also support internal debridement together with instrumentation.</p>
        <h4>Four Birds, One Scope</h4><p>My surgical short presents endoscopic debridement and percutaneous fixation for an infected osteoporotic spine.</p>
        <a className="clinical-talk" href={PERSONAL_LINKS.awardShort} target="_blank" rel="noopener noreferrer">Watch surgical short · KOSESS 2026 ↗</a>
      </>}
      {topic === 'Congenital & CSF' && <>
        <h4>Beyond the spinal canal</h4><p className="studio-kicker">Published technical case · Related work</p>
        <p>Noh, Choi and Jang describe biportal endoscopic foramen magnum decompression for Chiari I malformation. Il Choi is the corresponding author. The report uses an additional portal and includes C1 laminectomy; it is a technical case report with short-term follow-up.</p>
        <Paper href={chiari} title="Biportal Endoscopic Foramen Magnum Decompression in an Arnold-Chiari Malformation: A Technical Note With a Case Report" credit="Noh, Choi & Jang · JMISST · 2026" />
        <h4>My clinical experience</h4><p>I have also applied endoscopy in a Chiari case and in arachnoid cyst treatment. These experiences are distinct from the published case above; individual case material and outcomes are not displayed here yet.</p>
        <p className="office-detail-source">Grouped by anatomy and CSF disorders: arachnoid cysts are not uniformly congenital.</p>
      </>}
    </section>
  </div>;
}
