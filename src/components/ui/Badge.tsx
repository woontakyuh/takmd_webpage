import { motion } from "framer-motion";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "outline";
  className?: string;
}

export default function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  const variants = {
    default: "bg-[var(--bg-secondary)] text-[var(--text-secondary)]",
    primary: "bg-primary-500/10 text-primary-500 dark:text-primary-400",
    outline: "border border-[var(--border-color)] text-[var(--text-secondary)]",
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </motion.span>
  );
}
