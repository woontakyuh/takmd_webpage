import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function FadeIn({ children, className = "", delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeInStagger({ children, className = "" }: Props) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeInStaggerItem({ children, className = "" }: Props) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface CardProps {
  children: ReactNode;
  className?: string;
  href?: string;
}

export function AnimatedCard({ children, className = "", href }: CardProps) {
  const content = (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`bg-white rounded-xl p-6 border border-neutral-200 hover:border-neutral-300 hover:shadow-lg transition-shadow ${className}`}
    >
      {children}
    </motion.div>
  );

  if (href) {
    return <a href={href} target="_blank" rel="noopener noreferrer">{content}</a>;
  }
  return content;
}

interface StatCardProps {
  number: string;
  label: string;
  delay?: number;
}

export function StatCard({ number, label, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white rounded-xl p-6 border border-neutral-200 text-center hover:border-neutral-300 hover:shadow-lg transition-shadow"
    >
      <motion.div 
        className="text-4xl sm:text-5xl font-bold text-teal-600"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: delay + 0.2 }}
      >
        {number}
      </motion.div>
      <div className="text-sm text-neutral-500 mt-1">{label}</div>
    </motion.div>
  );
}

interface SocialIconProps {
  href: string;
  children: ReactNode;
  title: string;
}

export function SocialIcon({ href, children, title }: SocialIconProps) {
  return (
    <motion.a
      href={href}
      target={href.startsWith("mailto") ? undefined : "_blank"}
      rel={href.startsWith("mailto") ? undefined : "noopener noreferrer"}
      title={title}
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-teal-100 hover:text-teal-600 transition-colors"
    >
      {children}
    </motion.a>
  );
}

export function AnimatedHeading({ children, className = "" }: Props) {
  return (
    <motion.h2
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`text-2xl sm:text-3xl font-bold text-neutral-900 leading-tight ${className}`}
    >
      {children}
    </motion.h2>
  );
}

export function AnimatedAvatar() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.05, rotate: 2 }}
      className="w-48 h-48 sm:w-64 sm:h-64 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-6xl sm:text-8xl font-bold shadow-lg cursor-pointer"
    >
      <motion.span
        animate={{ 
          textShadow: [
            "0 0 20px rgba(255,255,255,0.3)",
            "0 0 40px rgba(255,255,255,0.5)",
            "0 0 20px rgba(255,255,255,0.3)"
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        W
      </motion.span>
    </motion.div>
  );
}

interface TableRowProps {
  title: string;
  link?: string;
  linkText?: string;
  status?: string;
  delay?: number;
}

export function AnimatedTableRow({ title, link, linkText, status, delay = 0 }: TableRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className="flex justify-between items-center py-3 border-b border-neutral-100 last:border-b-0 px-6 hover:bg-neutral-50 transition-colors"
    >
      <span className="font-medium text-neutral-800">{title}</span>
      {link ? (
        <motion.a 
          href={link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-teal-600 hover:text-teal-700"
          whileHover={{ x: 4 }}
        >
          {linkText} →
        </motion.a>
      ) : (
        <span className="text-sm text-neutral-400">{status}</span>
      )}
    </motion.div>
  );
}

interface TagProps {
  children: ReactNode;
  delay?: number;
}

export function AnimatedTag({ children, delay = 0 }: TagProps) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ scale: 1.05 }}
      className="px-3 py-1 bg-neutral-100 rounded-full text-xs text-neutral-600 hover:bg-teal-100 hover:text-teal-700 transition-colors cursor-default"
    >
      {children}
    </motion.span>
  );
}
