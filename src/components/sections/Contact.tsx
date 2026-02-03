import { motion } from "framer-motion";
import { profile, navigation } from "../../lib/data";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

export default function Contact() {
  return (
    <section id="contact" className="section-padding">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="primary" className="mb-4">Contact</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
            Get in Touch
          </h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
            Interested in collaboration, consultation, or learning more about endoscopic spine surgery?
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-8"
          >
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-6">Contact Information</h3>
            
            <div className="space-y-6">
              <a 
                href={`mailto:${profile.links.email}`}
                className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-card)] transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0 group-hover:bg-primary-500/20 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div>
                  <p className="text-[var(--text-muted)] text-sm">Email</p>
                  <p className="text-[var(--text-primary)] font-medium">{profile.links.email}</p>
                </div>
              </a>
              
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-secondary)]">
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[var(--text-muted)] text-sm">Location</p>
                  <p className="text-[var(--text-primary)] font-medium">Davos Hospital, South Korea</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-[var(--border-color)]">
              <p className="text-[var(--text-muted)] text-sm mb-4">Connect on social</p>
              <div className="flex gap-3">
                <a
                  href={profile.links.googleScholar}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl glass flex items-center justify-center text-[var(--text-secondary)] hover:text-primary-500 hover:border-primary-500/50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 24a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm0-24L0 9.5l4.838 3.94A8 8 0 0 1 12 9a8 8 0 0 1 7.162 4.44L24 9.5z"/>
                  </svg>
                </a>
                <a
                  href={profile.links.researchGate}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl glass flex items-center justify-center text-[var(--text-secondary)] hover:text-primary-500 hover:border-primary-500/50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.586 0c-.818 0-1.508.19-2.073.565-.563.377-.97.936-1.213 1.68a3.193 3.193 0 0 0-.112.437 8.365 8.365 0 0 0-.078.53 9 9 0 0 0-.05.727c-.01.282-.013.621-.013 1.016a31.121 31.121 0 0 0 .014 1.017 9 9 0 0 0 .05.727 7.946 7.946 0 0 0 .078.53h-.005a3.334 3.334 0 0 0 .112.438c.243.743.65 1.303 1.213 1.68.565.376 1.256.564 2.073.564.8 0 1.536-.213 2.105-.603.57-.39.94-.916 1.175-1.65.076-.235.135-.558.177-.93a10.9 10.9 0 0 0 .043-1.207v-.82c0-.095-.047-.142-.14-.142h-3.064c-.094 0-.14.047-.14.141v.956c0 .094.046.14.14.14h1.666c.056 0 .084.03.084.086 0 .36 0 .62-.036.865-.038.244-.1.447-.147.606-.108.335-.311.622-.603.853-.29.232-.68.347-1.138.347-.422 0-.752-.132-.99-.396a2.09 2.09 0 0 1-.49-.907 4.06 4.06 0 0 1-.152-1.014 9.292 9.292 0 0 1-.023-.882c0-.298.01-.55.023-.757.015-.254.058-.486.116-.698.06-.212.15-.4.267-.56.12-.158.27-.28.456-.372.186-.092.405-.138.66-.138.18 0 .34.027.473.08.134.056.244.126.336.21.09.086.162.19.22.318.056.13.096.26.12.395.027.09.063.136.113.136.043 0 .092-.01.14-.026l.79-.308c.094-.038.14-.09.14-.156 0-.02-.003-.044-.01-.07a2.5 2.5 0 0 0-.37-.783 2.48 2.48 0 0 0-.637-.602 3.107 3.107 0 0 0-.9-.405A3.9 3.9 0 0 0 19.586 0zM6.293 5.2c-1.41 0-2.47.37-3.177 1.11-.71.74-1.065 1.73-1.065 2.97 0 1.26.355 2.26 1.065 3.005.707.743 1.767 1.115 3.177 1.115.64 0 1.203-.1 1.696-.3.49-.2.9-.49 1.225-.865.325-.374.567-.82.726-1.34.16-.514.24-1.088.24-1.72V8.87c0-.615-.08-1.17-.24-1.67a3.322 3.322 0 0 0-.726-1.3 3.262 3.262 0 0 0-1.225-.833 4.367 4.367 0 0 0-1.696-.32v.001zm-.18 1.25c.31 0 .57.056.78.168.21.112.38.275.51.492.13.217.227.486.288.805.06.32.09.68.09 1.082v.405c0 .403-.03.764-.09 1.083-.06.32-.158.588-.288.804-.13.216-.3.38-.51.49-.21.11-.47.166-.78.166-.31 0-.57-.056-.78-.167-.21-.11-.38-.273-.51-.49a2.426 2.426 0 0 1-.29-.804 5.685 5.685 0 0 1-.088-1.082v-.405c0-.403.03-.764.088-1.083.06-.32.157-.588.29-.805.13-.217.3-.38.51-.492.21-.112.47-.168.78-.168z"/>
                  </svg>
                </a>
                <a
                  href={profile.links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl glass flex items-center justify-center text-[var(--text-secondary)] hover:text-primary-500 hover:border-primary-500/50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-8"
          >
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-6">Send a Message</h3>
            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm text-[var(--text-muted)] mb-2">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm text-[var(--text-muted)] mb-2">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm text-[var(--text-muted)] mb-2">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                  placeholder="Consultation inquiry"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm text-[var(--text-muted)] mb-2">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors resize-none"
                  placeholder="Your message..."
                />
              </div>
              <Button variant="primary" size="lg" className="w-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
                Send Message
              </Button>
            </form>
          </motion.div>
        </div>

        <footer className="pt-8 border-t border-[var(--border-color)]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <motion.a
              href="#"
              className="flex items-center gap-2 text-lg font-bold"
              whileHover={{ scale: 1.02 }}
            >
              <span className="text-primary-500 font-mono">{"<"}</span>
              <span className="gradient-text">TakMD</span>
              <span className="text-primary-500 font-mono">{"/>"}</span>
            </motion.a>
            
            <nav className="flex items-center gap-6">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {item.name}
                </a>
              ))}
            </nav>
            
            <p className="text-sm text-[var(--text-muted)]">
              &copy; {new Date().getFullYear()} Dr. Woon Tak Yuh. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </section>
  );
}
