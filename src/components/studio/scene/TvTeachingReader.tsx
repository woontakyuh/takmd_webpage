import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CadaverExperience } from '../CadaverExperience';
import { ClinicalDetails } from '../ClinicalDetails';
import { WorkshopDetails } from '../WorkshopRoomDetails';
import { TV_TEACHING_TOPICS } from '../tvTeaching';
import { requestOfficePath } from '../officeNavigation';
import { OfficeIcon } from '../OfficeIcon';
import { tvReadingSize, WALL_TV } from './config';
import '../office-details.css';
import '../tv-teaching.css';

type Props = { readonly path: string; readonly onTalk: (id: string) => void; readonly onClose: () => void };

export function TvTeachingReader(props: Props) {
  const size = useThree(state => state.size);
  const width = Math.min(960, tvReadingSize(size.width, size.height));
  return <Html transform distanceFactor={400 * WALL_TV.screenWidth / width}
    position={[0, .003, WALL_TV.depth / 2 + .0012]} zIndexRange={[20, 16]} occlude>
    <TeachingPanel {...props} width={width} />
  </Html>;
}

function TeachingPanel({ path, onTalk, onClose, width }: Props & { readonly width: number }) {
  const [expanded, setExpanded] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const content = <div className="office-details" key={path}>{path === '/ube'
    ? <ClinicalDetails onTalk={onTalk} />
    : path === '/workshops/cadaver' ? <CadaverExperience onTalk={onTalk} />
    : <WorkshopDetails slug={path.slice('/workshops/'.length)} />}</div>;
  useEffect(() => {
    if (expanded) dialog.current?.showModal();
    else dialog.current?.close();
  }, [expanded]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('dialog:modal')) return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onClose]);
  return <>
      <section className="tv-teaching" aria-label="TV clinical and teaching portfolio" style={{ width, height: width * WALL_TV.screenHeight / WALL_TV.screenWidth }}
        onPointerDown={event => event.stopPropagation()} onWheel={event => event.stopPropagation()}>
        <header><nav aria-label="TV teaching topics">{TV_TEACHING_TOPICS.map(topic => <button key={topic.path} aria-pressed={topic.path === path} onClick={() => requestOfficePath(topic.path)}>{topic.title}</button>)}</nav>
          <button aria-label="Expand teaching content" onClick={() => setExpanded(true)}><OfficeIcon name="overview" /></button>
          <button aria-label="Close teaching TV" onClick={onClose}><OfficeIcon name="close" /></button>
        </header>
        <div className="tv-teaching-scroll" key={path}>{content}</div>
      </section>
    {createPortal(<dialog ref={dialog} className="tv-teaching-expanded" onCancel={() => setExpanded(false)}>
      <header><span>UBE &amp; Teaching</span><button aria-label="Return to TV" onClick={() => setExpanded(false)}><OfficeIcon name="close" /></button></header>
      {expanded && <div className="tv-teaching-scroll">{content}</div>}
    </dialog>, document.body)}
  </>;
}
