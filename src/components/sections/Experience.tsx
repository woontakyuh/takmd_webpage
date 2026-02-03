import { motion } from "framer-motion";
import { profile } from "../../lib/data";
import Badge from "../ui/Badge";

const experiences = [
  {
    title: "Director, Spine Endoscopy Center",
    organization: "Davos Hospital",
    period: "Present",
    description: "Leading the center in advanced endoscopic spine surgery techniques and international training programs.",
    current: true,
  },
  {
    title: "Assistant Professor, Department of Neurosurgery",
    organization: "Hallym University Dongtan Sacred Heart Hospital",
    period: "Previous",
    description: "Academic position combining clinical practice with research and medical education.",
    current: false,
  },
];

export default function Experience() {
  return (
    <section id="experience" className="section-padding bg-[var(--bg-secondary)]/50">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="primary" className="mb-4">Experience</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
            Professional Journey
          </h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
            A career dedicated to advancing spine surgery and medical education.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {experiences.map((exp, index) => (
            <motion.div
              key={exp.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`glass rounded-2xl p-8 relative overflow-hidden ${
                exp.current ? "gradient-border" : ""
              }`}
            >
              {exp.current && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Current
                  </span>
                </div>
              )}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
                    {exp.title}
                  </h3>
                  <p className="text-primary-500 font-medium mb-2">{exp.organization}</p>
                  <p className="text-[var(--text-muted)] text-sm mb-4">{exp.period}</p>
                  <p className="text-[var(--text-secondary)]">{exp.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-8"
        >
          <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-6">
            Academic & Professional Affiliations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.academicPositions.map((position, index) => (
              <motion.div
                key={`${position.organization}-${position.role}`}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-card)] transition-colors"
              >
                <p className="text-[var(--text-primary)] font-medium text-sm">{position.role}</p>
                <p className="text-[var(--text-muted)] text-sm">{position.organization}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
