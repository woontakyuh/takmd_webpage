import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface CardColumnProps {
  id: string;
  title: string;
  children: ReactNode;
  index: number;
}

export function CardColumn({ id, title, children, index }: CardColumnProps) {
  return (
    <motion.div
      data-column="true"
      data-column-id={id}
      className="card-column"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="scrollbar-hide h-full w-full overflow-y-auto">
        <header className="card-header">{title}</header>
        <div className="card-content">{children}</div>
      </div>
    </motion.div>
  );
}

interface StatItemProps {
  label: string;
  value: string;
}

export function StatItem({ label, value }: StatItemProps) {
  return (
    <div className="stat-item">
      <div className="stat-label">
        <span className="stat-label-text">{label}</span>
        <span aria-hidden="true" className="stat-label-line" />
      </div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

interface TimelineEntryProps {
  year: string;
  title: string;
  subtitle?: string;
}

export function TimelineEntry({ year, title, subtitle }: TimelineEntryProps) {
  return (
    <div className="timeline-entry">
      <div className="timeline-year">{year}</div>
      <div className="timeline-content">
        <span className="timeline-title">{title}</span>
        {subtitle && <span> — {subtitle}</span>}
      </div>
    </div>
  );
}

interface SocialButtonProps {
  href: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function SocialButton({ href, icon, children }: SocialButtonProps) {
  return (
    <motion.a
      href={href}
      target={href.startsWith("mailto") ? undefined : "_blank"}
      rel={href.startsWith("mailto") ? undefined : "noopener noreferrer"}
      className="social-btn"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {icon}
      {children}
    </motion.a>
  );
}

interface CopyEmailButtonProps {
  email: string;
}

export function CopyEmailButton({ email }: CopyEmailButtonProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
    } catch (err) {
      console.error('Failed to copy');
    }
  };

  return (
    <motion.button
      onClick={handleCopy}
      className="social-btn"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      Copy email
    </motion.button>
  );
}

interface NavButtonProps {
  direction: 'prev' | 'next';
  onClick: () => void;
  disabled?: boolean;
}

export function NavButton({ direction, onClick, disabled }: NavButtonProps) {
  return (
    <button
      type="button"
      aria-label={direction === 'prev' ? 'Previous column' : 'Next column'}
      onClick={onClick}
      disabled={disabled}
      className="nav-button"
    >
      {direction === 'prev' ? (
        <svg viewBox="0 0 14 14" fill="none" className="h-4 w-4">
          <path d="M8.5 3.5 5 7l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 14 14" fill="none" className="h-4 w-4">
          <path d="M5.5 3.5 9 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

interface AffiliationItemProps {
  name: string;
  role: string;
}

export function AffiliationItem({ name, role }: AffiliationItemProps) {
  return (
    <div className="py-3 border-b border-[var(--color-border)] last:border-b-0">
      <div className="font-medium text-sm text-[var(--color-text-primary)]">{name}</div>
      <div className="text-xs text-[var(--color-text-tertiary)]">{role}</div>
    </div>
  );
}

export function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1227" fill="currentColor" className="h-4 w-4">
      <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" />
    </svg>
  );
}

export function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

export function ScholarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M12 24a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm0-24L0 9.5l4.838 3.94A8 8 0 0 1 12 9a8 8 0 0 1 7.162 4.44L24 9.5z"/>
    </svg>
  );
}

export function MailIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}
