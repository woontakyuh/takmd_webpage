import { motion } from "framer-motion";
import { profile } from "../../lib/data";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

const researchAreas = [
  {
    title: "Endoscopic Spine Surgery",
    description: "Developing and refining minimally invasive surgical techniques for various spinal conditions.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
    ),
  },
  {
    title: "Clinical AI Applications",
    description: "Leveraging artificial intelligence for improved diagnosis and treatment planning in spine surgery.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
  },
  {
    title: "Surgical Outcomes Research",
    description: "Analyzing patient outcomes to optimize surgical protocols and improve recovery times.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
];

export default function Research() {
  return (
    <section id="research" className="section-padding">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="primary" className="mb-4">Research</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
            Publications & Research
          </h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
            Contributing to the advancement of spine surgery through rigorous research and publication.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-1 glass rounded-2xl p-8 gradient-border glow"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-500/10 mb-6">
                <span className="text-4xl font-bold gradient-text">{profile.stats.hIndex}</span>
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">h-index</h3>
              <p className="text-[var(--text-secondary)] text-sm mb-6">
                A measure of research impact and productivity
              </p>
              <div className="flex justify-center gap-4">
                <Button href={profile.links.googleScholar} variant="secondary" size="sm" external>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 24a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm0-24L0 9.5l4.838 3.94A8 8 0 0 1 12 9a8 8 0 0 1 7.162 4.44L24 9.5z"/>
                  </svg>
                  Scholar
                </Button>
                <Button href={profile.links.researchGate} variant="secondary" size="sm" external>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.586 0c-.818 0-1.508.19-2.073.565-.563.377-.97.936-1.213 1.68a3.193 3.193 0 0 0-.112.437 8.365 8.365 0 0 0-.078.53 9 9 0 0 0-.05.727c-.01.282-.013.621-.013 1.016a31.121 31.121 0 0 0 .014 1.017 9 9 0 0 0 .05.727 7.946 7.946 0 0 0 .078.53h-.005a3.334 3.334 0 0 0 .112.438c.243.743.65 1.303 1.213 1.68.565.376 1.256.564 2.073.564.8 0 1.536-.213 2.105-.603.57-.39.94-.916 1.175-1.65.076-.235.135-.558.177-.93a10.9 10.9 0 0 0 .043-1.207v-.82c0-.095-.047-.142-.14-.142h-3.064c-.094 0-.14.047-.14.141v.956c0 .094.046.14.14.14h1.666c.056 0 .084.03.084.086 0 .36 0 .62-.036.865-.038.244-.1.447-.147.606-.108.335-.311.622-.603.853-.29.232-.68.347-1.138.347-.422 0-.752-.132-.99-.396a2.09 2.09 0 0 1-.49-.907 4.06 4.06 0 0 1-.152-1.014 9.292 9.292 0 0 1-.023-.882c0-.298.01-.55.023-.757.015-.254.058-.486.116-.698.06-.212.15-.4.267-.56.12-.158.27-.28.456-.372.186-.092.405-.138.66-.138.18 0 .34.027.473.08.134.056.244.126.336.21.09.086.162.19.22.318.056.13.096.26.12.395.027.09.063.136.113.136.043 0 .092-.01.14-.026l.79-.308c.094-.038.14-.09.14-.156 0-.02-.003-.044-.01-.07a2.5 2.5 0 0 0-.37-.783 2.48 2.48 0 0 0-.637-.602 3.107 3.107 0 0 0-.9-.405A3.9 3.9 0 0 0 19.586 0zM6.293 5.2c-1.41 0-2.47.37-3.177 1.11-.71.74-1.065 1.73-1.065 2.97 0 1.26.355 2.26 1.065 3.005.707.743 1.767 1.115 3.177 1.115.64 0 1.203-.1 1.696-.3.49-.2.9-.49 1.225-.865.325-.374.567-.82.726-1.34.16-.514.24-1.088.24-1.72V8.87c0-.615-.08-1.17-.24-1.67a3.322 3.322 0 0 0-.726-1.3 3.262 3.262 0 0 0-1.225-.833 4.367 4.367 0 0 0-1.696-.32v.001zm-.18 1.25c.31 0 .57.056.78.168.21.112.38.275.51.492.13.217.227.486.288.805.06.32.09.68.09 1.082v.405c0 .403-.03.764-.09 1.083-.06.32-.158.588-.288.804-.13.216-.3.38-.51.49-.21.11-.47.166-.78.166-.31 0-.57-.056-.78-.167-.21-.11-.38-.273-.51-.49a2.426 2.426 0 0 1-.29-.804 5.685 5.685 0 0 1-.088-1.082v-.405c0-.403.03-.764.088-1.083.06-.32.157-.588.29-.805.13-.217.3-.38.51-.492.21-.112.47-.168.78-.168z"/>
                  </svg>
                  RG
                </Button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 glass rounded-2xl p-8"
          >
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-6">Research Areas</h3>
            <div className="space-y-6">
              {researchAreas.map((area, index) => (
                <motion.div
                  key={area.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-card)] transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0 text-primary-500">
                    {area.icon}
                  </div>
                  <div>
                    <h4 className="text-[var(--text-primary)] font-medium mb-1">{area.title}</h4>
                    <p className="text-[var(--text-secondary)] text-sm">{area.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <Card delay={0.2}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                Academic Presentations
              </h3>
              <p className="text-[var(--text-secondary)]">
                Over <span className="text-primary-500 font-semibold">{profile.stats.presentations}</span> presentations 
                at domestic and international conferences, sharing insights and advancing the field.
              </p>
            </div>
            <div className="shrink-0">
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text">{profile.stats.presentations}</div>
                <div className="text-[var(--text-muted)] text-sm">Presentations</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
