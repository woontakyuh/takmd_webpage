import { motion } from "framer-motion";
import { profile } from "../../lib/data";
import Badge from "../ui/Badge";

const workshops = [
  {
    title: "International Endoscopic Spine Surgery Training Center",
    description: "Comprehensive training program for international physicians in advanced endoscopic spine surgery techniques. Training surgeons from around the world in UBE and other minimally invasive procedures.",
    period: "2024 - 2025",
    type: "International Training",
    highlights: ["International physicians", "Advanced techniques", "Hands-on training"],
  },
  {
    title: "Endoscopic Spine Surgery Workshop for Beginners",
    description: "Multi-stage training program designed for surgeons new to endoscopic techniques, featuring progressive learning through simulation to live procedures.",
    period: "2024 - 2025",
    type: "Educational Workshop",
    highlights: ["Dummy workshop", "Live pig workshop", "Cadaver workshop"],
  },
];

export default function EducationSection() {
  return (
    <section id="education" className="section-padding bg-[var(--bg-secondary)]/50">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="primary" className="mb-4">Education & Training</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
            Teaching & Workshops
          </h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
            Committed to educating the next generation of spine surgeons through comprehensive training programs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {workshops.map((workshop, index) => (
            <motion.div
              key={workshop.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-2xl p-8 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline">{workshop.type}</Badge>
                  <span className="text-[var(--text-muted)] text-sm">{workshop.period}</span>
                </div>
                
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
                  {workshop.title}
                </h3>
                
                <p className="text-[var(--text-secondary)] mb-6 leading-relaxed">
                  {workshop.description}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {workshop.highlights.map((highlight) => (
                    <span
                      key={highlight}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-500 text-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                      </svg>
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-12 glass rounded-2xl p-8 text-center"
        >
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500/10 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-primary-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
              Global Impact
            </h3>
            <p className="text-[var(--text-secondary)] text-lg leading-relaxed">
              Through international training programs and workshops, we've trained surgeons from 
              multiple countries, spreading advanced endoscopic techniques globally and improving 
              patient outcomes worldwide.
            </p>
            <div className="mt-8 flex justify-center gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold gradient-text">{profile.stats.workshopsLed}</div>
                <div className="text-[var(--text-muted)] text-sm">Workshops Led</div>
              </div>
              <div className="h-12 w-px bg-[var(--border-color)]" />
              <div className="text-center">
                <div className="text-3xl font-bold gradient-text">10+</div>
                <div className="text-[var(--text-muted)] text-sm">Countries</div>
              </div>
              <div className="h-12 w-px bg-[var(--border-color)]" />
              <div className="text-center">
                <div className="text-3xl font-bold gradient-text">100+</div>
                <div className="text-[var(--text-muted)] text-sm">Surgeons Trained</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
