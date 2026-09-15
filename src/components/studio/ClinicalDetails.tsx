import { useState } from 'react';
import { PERSONAL_LINKS } from './personal';
import './clinical-details.css';

const topics = ['Concept', 'Degenerative disease', 'Tumor', 'Trauma', 'Infection', 'Congenital & CSF'] as const;
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
    <h3 className="reader-detail-title">Endoscopic spine surgery.<br />From foundations to new applications.</h3>
    <p className="studio-panel-intro">Start with the UBE concept and its foundation in degenerative spine disease, then explore selected applications in tumors, trauma, infection and craniovertebral or CSF disorders. Published evidence and work in progress are identified throughout.</p>
    <div className="clinical-topics" role="group" aria-label="Endoscopic surgery topics">{topics.map(item => <button type="button" key={item} aria-pressed={topic === item} onClick={() => setTopic(item)}>{item}</button>)}</div>
    <section className="clinical-topic" aria-label={topic}>
      {topic === 'Concept' && <>
        <h4>One portal to see. One portal to work.</h4>
        <p>UBE separates the endoscope from the working instruments. Unlike a full-endoscopic system with instruments passing through the scope, this separation allows independent viewing and working trajectories.</p>
        <figure><img src="/studio/clinical/ess-portals.webp" width="2158" height="1619" alt="Published comparison: full-endoscopic instruments through one scope on the left, separate UBE viewing and working portals on the right" /><figcaption>FESS (left) and UBE (right). Yuh et al., Bioengineering 2023, Figure 1. <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a> · Layout preserved; WebP encoding.</figcaption></figure>
        <h4>The technological foundation</h4>
        <p>My review examines three enabling technologies: camera and lighting systems for anatomical visibility, radiofrequency equipment for tissue work and bleeding control, and drills for bone work in an irrigated field.</p>
        <p>The next chapter begins with degenerative disease: the established role of lumbar decompression and the different evidence needs of fusion, cervical and thoracic procedures. Later chapters explore applications beyond this foundation.</p>
        <Paper href={review} title="Future of Endoscopic Spine Surgery: Insights from Cutting-Edge Technology in the Industrial Field" credit="My published review · Bioengineering · 2023" />
      </>}
      {topic === 'Degenerative disease' && <>
        <h4>The clinical foundation</h4>
        <p className="studio-kicker">Source synthesis · Manuscript in preparation</p>
        <p>A synthesis from our review, Unilateral Biportal Endoscopic Spine Surgery: The State of the Art, currently in preparation for JKNS.</p>
        <h4>Lumbar decompression · Established</h4>
        <p>Our review identifies interlaminar and foraminal decompression for lumbar stenosis and disc herniation as the most established UBE indication. Here, a reproducible technique is supported by randomized, comparative and review evidence. The synthesis supports UBE as a minimally invasive alternative without claiming consistent superiority over other approaches.</p>
        <h4>Lumbar interbody fusion · Expanding</h4>
        <p>An established fusion concept and the maturity of UBE-specific evidence are separate questions. Cage design, navigation and robotics continue to evolve; long-term independently assessed fusion, endplate safety and comparative value remain research priorities.</p>
        <h4>Posterior cervical foraminotomy · Expanding</h4>
        <p>For cervical foraminal disease, regional safety and prospective multicenter validation remain priorities. Foraminotomy is distinct from cervical myelopathy decompression, which remains exploratory in this framework.</p>
        <h4>Thoracic decompression · Expanding</h4>
        <p>For thoracic stenosis and ossification of the ligamentum flavum, the evidence gap is narrowing, although studies remain largely retrospective and concentrated in experienced centers. Lesion morphology, dural ossification and spinal cord safety require specific appraisal.</p>
        <h4>Technical readiness and evidence maturity</h4>
        <p>The draft asks two separate questions: can an experienced surgeon apply the platform reproducibly, and how well do clinical studies validate the application? Readiness considers platform suitability, disease-specific anatomy and safety, and enabling technology. Evidence maturity considers study design, replication and follow-up.</p>
        <p>These are qualitative judgments, not numerical scores or patient-selection rules. An expanding indication can be technically advanced while still needing stronger clinical validation.</p>
        <p className="office-detail-source">Source: JKNS working draft, degenerative indications and Tables 1–3 · Unpublished manuscript in preparation.</p>
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
