import { motion } from "framer-motion";
import { profile } from "../../lib/data";
import Button from "../ui/Button";
import Badge from "../ui/Badge";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center section-padding pt-32">
      <div className="container-custom w-full">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8"
        >
          {/* Main Hero Card - Profile */}
          <motion.div
            variants={item}
            className="lg:col-span-7 glass rounded-3xl p-8 lg:p-12 relative overflow-hidden group"
          >
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-500/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />
            
            <div className="relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 mb-6"
              >
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-[var(--text-secondary)]">
                  Available for consultation
                </span>
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
                <span className="text-[var(--text-primary)]">Hi, I'm </span>
                <span className="gradient-text">{profile.name.en}</span>
              </h1>
              
              <p className="text-xl sm:text-2xl text-[var(--text-secondary)] mb-2">
                {profile.name.ko}
              </p>
              
              <p className="text-lg text-primary-500 font-medium mb-6">
                {profile.title}
              </p>

              <p className="text-[var(--text-secondary)] text-lg mb-8 max-w-xl">
                {profile.currentPosition.title} at{" "}
                <span className="text-[var(--text-primary)] font-medium">
                  {profile.currentPosition.organization}
                </span>
                . Specializing in minimally invasive spine surgery and clinical AI research.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button href="#contact" variant="primary" size="lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                  Get in Touch
                </Button>
                <Button href="#research" variant="secondary" size="lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  View Research
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Bento Grid */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4 lg:gap-6">
            {/* Stats Card */}
            <motion.div
              variants={item}
              className="col-span-2 glass rounded-2xl p-6 gradient-border"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { value: profile.stats.hIndex, label: "h-index" },
                  { value: profile.stats.presentations, label: "Presentations" },
                  { value: profile.stats.workshopsLed, label: "Workshops" },
                  { value: profile.stats.yearsExperience, label: "Years Exp." },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <div className="text-2xl sm:text-3xl font-bold gradient-text">
                      {stat.value}
                    </div>
                    <div className="text-xs sm:text-sm text-[var(--text-muted)]">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Specialties Card */}
            <motion.div
              variants={item}
              className="glass rounded-2xl p-5 glass-hover"
            >
              <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">
                Specialties
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.specialties.map((specialty) => (
                  <Badge key={specialty} variant="primary">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </motion.div>

            {/* Current Position Card */}
            <motion.div
              variants={item}
              className="glass rounded-2xl p-5 glass-hover"
            >
              <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">
                Current Position
              </h3>
              <p className="text-sm text-[var(--text-primary)] font-medium">
                {profile.currentPosition.title}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                {profile.currentPosition.organization}
              </p>
            </motion.div>

            {/* Social Links Card */}
            <motion.div
              variants={item}
              className="col-span-2 glass rounded-2xl p-5"
            >
              <h3 className="text-sm font-medium text-[var(--text-muted)] mb-4">
                Connect
              </h3>
              <div className="flex flex-wrap gap-3">
                <a
                  href={profile.links.googleScholar}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl glass-hover text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 24a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm0-24L0 9.5l4.838 3.94A8 8 0 0 1 12 9a8 8 0 0 1 7.162 4.44L24 9.5z"/>
                  </svg>
                  Google Scholar
                </a>
                <a
                  href={profile.links.researchGate}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl glass-hover text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.586 0c-.818 0-1.508.19-2.073.565-.563.377-.97.936-1.213 1.68a3.193 3.193 0 0 0-.112.437 8.365 8.365 0 0 0-.078.53 9 9 0 0 0-.05.727c-.01.282-.013.621-.013 1.016a31.121 31.121 0 0 0 .014 1.017 9 9 0 0 0 .05.727 7.946 7.946 0 0 0 .078.53h-.005a3.334 3.334 0 0 0 .112.438c.243.743.65 1.303 1.213 1.68.565.376 1.256.564 2.073.564.8 0 1.536-.213 2.105-.603.57-.39.94-.916 1.175-1.65.076-.235.135-.558.177-.93a10.9 10.9 0 0 0 .043-1.207v-.82c0-.095-.047-.142-.14-.142h-3.064c-.094 0-.14.047-.14.141v.956c0 .094.046.14.14.14h1.666c.056 0 .084.03.084.086 0 .36 0 .62-.036.865-.038.244-.1.447-.147.606-.108.335-.311.622-.603.853-.29.232-.68.347-1.138.347-.422 0-.752-.132-.99-.396a2.09 2.09 0 0 1-.49-.907 4.06 4.06 0 0 1-.152-1.014 9.292 9.292 0 0 1-.023-.882c0-.298.01-.55.023-.757.015-.254.058-.486.116-.698.06-.212.15-.4.267-.56.12-.158.27-.28.456-.372.186-.092.405-.138.66-.138.18 0 .34.027.473.08.134.056.244.126.336.21.09.086.162.19.22.318.056.13.096.26.12.395.027.09.063.136.113.136.043 0 .092-.01.14-.026l.79-.308c.094-.038.14-.09.14-.156 0-.02-.003-.044-.01-.07a2.5 2.5 0 0 0-.37-.783 2.48 2.48 0 0 0-.637-.602 3.107 3.107 0 0 0-.9-.405A3.9 3.9 0 0 0 19.586 0zM6.293 5.2c-1.41 0-2.47.37-3.177 1.11-.71.74-1.065 1.73-1.065 2.97 0 1.26.355 2.26 1.065 3.005.707.743 1.767 1.115 3.177 1.115.64 0 1.203-.1 1.696-.3.49-.2.9-.49 1.225-.865.325-.374.567-.82.726-1.34.16-.514.24-1.088.24-1.72V8.87c0-.615-.08-1.17-.24-1.67a3.322 3.322 0 0 0-.726-1.3 3.262 3.262 0 0 0-1.225-.833 4.367 4.367 0 0 0-1.696-.32v.001zm-.18 1.25c.31 0 .57.056.78.168.21.112.38.275.51.492.13.217.227.486.288.805.06.32.09.68.09 1.082v.405c0 .403-.03.764-.09 1.083-.06.32-.158.588-.288.804-.13.216-.3.38-.51.49-.21.11-.47.166-.78.166-.31 0-.57-.056-.78-.167-.21-.11-.38-.273-.51-.49a2.426 2.426 0 0 1-.29-.804 5.685 5.685 0 0 1-.088-1.082v-.405c0-.403.03-.764.088-1.083.06-.32.157-.588.29-.805.13-.217.3-.38.51-.492.21-.112.47-.168.78-.168z"/>
                  </svg>
                  ResearchGate
                </a>
                <a
                  href={profile.links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl glass-hover text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </a>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="flex justify-center mt-16"
        >
          <motion.a
            href="#about"
            className="flex flex-col items-center gap-2 text-[var(--text-muted)] hover:text-primary-500 transition-colors"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-sm">Scroll to explore</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
