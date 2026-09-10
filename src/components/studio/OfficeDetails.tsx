import { useState } from 'react';
import type { ReactNode } from 'react';
import { getWorkshop } from '../../data/workshops';
import { CvReader } from './CvReader';
import { AiReader } from './AiReader';
import { EducationDetails, ResearchDetails } from './OfficeAcademicDetails';
import { ClinicalDetails, ContactDetails, CreditsDetails, NoteCollection, WorkshopDetails } from './OfficeDetailContent';
import { PersonalReader } from './PersonalReader';
import { ProjectReader } from './ProjectReader';
import { knowledgeNotes, mediaNotes } from './officeNotes';
import type { Presentation, ProjectId, Publication } from './types';
import './office-details.css';

type Props = {
  readonly path: string;
  readonly publications: readonly Publication[];
  readonly presentations: readonly Presentation[];
  readonly onPaper: (id: string) => void;
  readonly onTalk: (id: string) => void;
};

export function officeDetailsTitle(path: string): string {
  const url = new URL(path, 'https://takmd.com');
  const pathname = url.pathname.replace(/\/$/, '');
  switch (pathname) {
    case '/cv': return 'Curriculum Vitae';
    case '/contact': return 'Contact.';
    case '/credits': return 'Scene credits.';
    case '/ube': return 'Clinical practice.';
    case '/education': return 'Education and training.';
    case '/research': return 'Research overview.';
    case '/ai-workflow': return 'AI workflow study.';
    case '/ai': return url.hash === '#spinoscopy' ? 'K-Spinoscopy dashboard.' : 'AI, in practice.';
    case '/jiu-jitsu': return 'Jiu-jitsu.';
    case '/surfing': return 'Surfing.';
    case '/dashboard': return 'Private workspace.';
    default:
      if (pathname.startsWith('/workshops/')) return getWorkshop(pathname.slice('/workshops/'.length))?.title ?? 'Workshops.';
      if (pathname.startsWith('/knowledge')) return 'Knowledge notes.';
      if (pathname.startsWith('/media')) return 'Media archive.';
      return 'From the office.';
  }
}

function WorkflowDetail({ publications, onPaper }: Pick<Props, 'publications' | 'onPaper'>) {
  const [selected, setSelected] = useState<ProjectId | null>('workflow');
  return <ProjectReader selected={selected} onSelect={setSelected} publications={publications} onPaper={onPaper} />;
}

export function OfficeDetails({ path, publications, presentations, onPaper, onTalk }: Props) {
  const url = new URL(path, 'https://takmd.com');
  const pathname = url.pathname.replace(/\/$/, '') || '/';
  let content: ReactNode;
  switch (pathname) {
    case '/cv': content = <div className="monitor-cv-readable"><CvReader publicationCount={publications.length} presentationCount={presentations.length} /></div>; break;
    case '/contact': content = <ContactDetails />; break;
    case '/credits': content = <CreditsDetails />; break;
    case '/ube': content = <ClinicalDetails />; break;
    case '/education': content = <EducationDetails onTalk={onTalk} />; break;
    case '/research': content = <ResearchDetails publications={publications} onPaper={onPaper} />; break;
    case '/jiu-jitsu': content = <PersonalReader interest="bjj" />; break;
    case '/surfing': content = <PersonalReader interest="surfing" />; break;
    case '/ai-workflow': content = <WorkflowDetail publications={publications} onPaper={onPaper} />; break;
    case '/ai': content = url.hash === '#spinoscopy' ? <>
      <p className="studio-kicker">Clinical AI side project</p><h3 className="reader-detail-title">K-Spinoscopy dashboard</h3>
      <p className="studio-panel-intro">A real dashboard project for the K-Spinoscopy work.</p>
      <section className="studio-editorial-note"><span>Project note</span><h3>In development.</h3><p>This project is listed as active work. A public project note is being prepared.</p></section>
      <a className="studio-panel-footer" href="/ai">All AI work<span aria-hidden="true">→</span></a>
    </> : <AiReader publications={publications} presentations={presentations} onPaper={onPaper} onTalk={onTalk} />; break;
    case '/dashboard': content = <><p className="studio-kicker">Private workspace</p><h3 className="reader-detail-title">A separate workspace.</h3><p className="studio-panel-intro">This workspace is unavailable on the public site.</p><a className="studio-panel-footer" href="/contact">Contact<span aria-hidden="true">→</span></a></>; break;
    default:
      if (pathname === '/workshops' || pathname.startsWith('/workshops/')) content = <WorkshopDetails slug={pathname.slice('/workshops/'.length)} />;
      else if (pathname === '/knowledge' || pathname.startsWith('/knowledge/')) content = <NoteCollection entries={knowledgeNotes} basePath="/knowledge" selectedId={pathname.slice('/knowledge/'.length)} />;
      else if (pathname === '/media' || pathname.startsWith('/media/')) content = <NoteCollection entries={mediaNotes} basePath="/media" selectedId={pathname.slice('/media/'.length)} />;
      else content = <><p className="studio-panel-intro">Explore the office collections.</p><nav className="office-detail-links" aria-label="Office collections"><a href="/cv">Curriculum Vitae</a><a href="/research">Research</a><a href="/education">Education</a><a href="/ai">AI work</a><a href="/knowledge">Knowledge</a><a href="/media">Media</a><a href="/contact">Contact</a></nav></>;
  }
  return <div className="office-details" key={path}>{content}</div>;
}
