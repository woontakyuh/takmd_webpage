import { useState } from 'react';

type Mail = {
  id: string;
  from: string;
  subject: string;
  preview: string;
  time: string;
  body: { heading: string; lines: string[]; links?: { label: string; href: string }[] };
};

const MAILS: Mail[] = [
  {
    id: 'contact',
    from: 'Woon Tak Yuh',
    subject: 'How to reach me',
    preview: 'Email, LinkedIn, or through the hospital — all routes below.',
    time: '9:12 AM',
    body: {
      heading: 'How to reach me',
      lines: [
        'Thanks for visiting the desk. The fastest routes, in order:',
      ],
      links: [
        { label: 'woontak.yuh@gmail.com', href: 'mailto:woontak.yuh@gmail.com' },
        { label: 'LinkedIn — Woon Tak Yuh', href: 'https://www.linkedin.com/in/woon-tak-yuh-03420311b/' },
        { label: 'Instagram — @takmd', href: 'https://instagram.com/takmd' },
        { label: 'Davos Hospital — Center for Endoscopic Spine Surgery', href: 'https://www.davoshospital.co.kr/depart/page02-detail.html?dr_idx=139' },
      ],
    },
  },
  {
    id: 'lecture',
    from: 'Speaking & workshops',
    subject: 'Inviting Dr. Yuh to speak?',
    preview: 'Invited lectures, live surgery, cadaver workshop faculty…',
    time: 'Yesterday',
    body: {
      heading: 'Inviting Dr. Yuh to speak?',
      lines: [
        'Topics that travel well: UBE/biportal endoscopy, complication management, ERAS for spine, and clinical AI workflow.',
        'Email with dates and venue — schedule syncs from the calendar, so responses are quick.',
      ],
      links: [{ label: 'Start an invitation email', href: 'mailto:woontak.yuh@gmail.com?subject=Speaking%20invitation' }],
    },
  },
  {
    id: 'research',
    from: 'Research collaboration',
    subject: 'Data, imaging & registry projects',
    preview: 'Deep learning on spine imaging, outcome registries, multi-center…',
    time: 'Tuesday',
    body: {
      heading: 'Research collaboration',
      lines: [
        'Open to multi-center registry work, imaging AI validation, and ERAS outcome studies.',
        'Include a one-paragraph outline and current data status — that is enough for a first reply.',
      ],
      links: [{ label: 'Propose a project', href: 'mailto:woontak.yuh@gmail.com?subject=Research%20collaboration' }],
    },
  },
];

export function MailApp({ onClose, onDragBar }: { onClose: () => void; onDragBar: {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
} }) {
  const [selected, setSelected] = useState('contact');
  const mail = MAILS.find((m) => m.id === selected)!;

  return (
    <div className="mail">
      <header className="mail-toolbar" {...onDragBar}>
        <span className="mail-lights">
          <button className="ml ml-red" aria-label="Close" onClick={(e) => { e.stopPropagation(); onClose(); }} />
          <span className="ml ml-yellow" />
          <span className="ml ml-green" />
        </span>
        <span className="mail-tools">
          <i>⤴</i><i>🗑</i><i>⤺</i><i>⤻</i>
        </span>
        <span className="mail-search">🔍 Search</span>
      </header>
      <div className="mail-columns">
        <aside className="mail-sidebar">
          <p className="mail-side-title">Favorites</p>
          <div className="mail-side-item mail-side-active">📥 Inbox <span className="mail-count">{MAILS.length}</span></div>
          <div className="mail-side-item">⭐ VIP</div>
          <div className="mail-side-item">📤 Sent</div>
          <p className="mail-side-title">Smart Mailboxes</p>
          <div className="mail-side-item">🩺 Referrals</div>
          <div className="mail-side-item">🎓 Fellows</div>
        </aside>
        <section className="mail-list">
          {MAILS.map((m) => (
            <button
              key={m.id}
              className={`mail-row${m.id === selected ? ' mail-row-active' : ''}`}
              onClick={() => setSelected(m.id)}
            >
              <span className="mail-row-top"><b>{m.from}</b><time>{m.time}</time></span>
              <span className="mail-row-subject">{m.subject}</span>
              <span className="mail-row-preview">{m.preview}</span>
            </button>
          ))}
        </section>
        <article className="mail-read">
          <h2>{mail.body.heading}</h2>
          <p className="mail-meta">{mail.from} — to me</p>
          {mail.body.lines.map((l) => (
            <p key={l}>{l}</p>
          ))}
          {mail.body.links && (
            <div className="mail-links">
              {mail.body.links.map((l) => (
                <a key={l.href} href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                  {l.label}
                </a>
              ))}
            </div>
          )}
        </article>
      </div>
      <style>{`
        .mail { display: flex; flex-direction: column; height: 100%; background: #f5f5f7; color: #1d1d1f;
          font-family: -apple-system, 'Helvetica Neue', system-ui, sans-serif; font-size: 12.5px; }
        .mail-toolbar { display: flex; align-items: center; gap: 16px; height: 44px; padding: 0 14px; flex: none;
          background: linear-gradient(180deg, #f0eff2, #e7e6ea); border-bottom: 1px solid #d4d3d8;
          user-select: none; cursor: grab; touch-action: none; }
        .mail-lights { display: flex; gap: 8px; }
        .ml { width: 12px; height: 12px; border-radius: 50%; border: none; padding: 0; }
        .ml-red { background: #ff5f57; cursor: pointer; }
        .ml-yellow { background: #febc2e; }
        .ml-green { background: #28c840; }
        .mail-tools { display: flex; gap: 14px; color: #7a7a80; font-style: normal; font-size: 13px; }
        .mail-tools i { font-style: normal; }
        .mail-search { margin-left: auto; padding: 4px 12px; border-radius: 7px; background: #fff;
          border: 1px solid #d9d8dd; color: #9a9aa0; font-size: 11.5px; }
        .mail-columns { display: flex; flex: 1; min-height: 0; }
        .mail-sidebar { width: 168px; flex: none; background: #ebeaef; padding: 10px 8px; overflow-y: auto; }
        .mail-side-title { margin: 10px 8px 4px; font-size: 10px; font-weight: 700; color: #98979e; text-transform: uppercase; }
        .mail-side-item { display: flex; align-items: center; gap: 6px; padding: 5px 8px; border-radius: 6px; color: #3c3c40; }
        .mail-side-active { background: #d4e4fb; color: #1861d6; font-weight: 600; }
        .mail-count { margin-left: auto; color: #98979e; font-size: 11px; }
        .mail-list { width: 268px; flex: none; background: #fff; border-right: 1px solid #e3e2e7; overflow-y: auto; }
        .mail-row { display: flex; flex-direction: column; gap: 2px; width: 100%; text-align: left; padding: 10px 14px;
          background: none; border: none; border-bottom: 1px solid #efeef2; cursor: pointer; font: inherit; color: inherit; }
        .mail-row-active { background: #2f6fed; color: #fff; }
        .mail-row-active .mail-row-preview, .mail-row-active time { color: rgba(255,255,255,0.75); }
        .mail-row-top { display: flex; justify-content: space-between; font-size: 12.5px; }
        .mail-row-top time { color: #98979e; font-size: 11px; }
        .mail-row-subject { font-weight: 500; }
        .mail-row-preview { color: #8a8a90; font-size: 11.5px; overflow: hidden; text-overflow: ellipsis;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .mail-read { flex: 1; background: #fff; padding: 26px 30px; overflow-y: auto; line-height: 1.6; }
        .mail-read h2 { margin: 0 0 4px; font-size: 19px; letter-spacing: -0.01em; }
        .mail-meta { color: #98979e; margin: 0 0 18px; font-size: 11.5px; }
        .mail-read p { margin: 0 0 12px; max-width: 60ch; }
        .mail-links { display: flex; flex-direction: column; gap: 8px; margin-top: 18px; }
        .mail-links a { color: #1861d6; text-decoration: none; width: fit-content; }
        .mail-links a:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
