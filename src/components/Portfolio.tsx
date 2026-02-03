import { motion } from "framer-motion";
import {
  FadeIn,
  FadeInStagger,
  FadeInStaggerItem,
  AnimatedCard,
  StatCard,
  SocialIcon,
  AnimatedHeading,
  AnimatedAvatar,
  AnimatedTableRow,
  AnimatedTag,
} from "./AnimatedSection";

export default function Portfolio() {
  return (
    <main>
      {/* Hero Section */}
      <section className="py-16 sm:py-24 bg-white border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <motion.h1 
                className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                Woon Tak Yuh, MD
              </motion.h1>
              <motion.p 
                className="text-xl text-neutral-500 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Spine Surgeon · AI Researcher · Educator
              </motion.p>
              <motion.p 
                className="text-neutral-600 text-lg leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                I'm a <strong className="text-neutral-800">neurosurgeon</strong> specializing in{" "}
                <strong className="text-neutral-800">minimally invasive spine surgery</strong>. 
                I spend my days operating, researching clinical AI applications, and training the next generation of spine surgeons.
              </motion.p>
            </FadeIn>
            <div className="flex justify-center md:justify-end">
              <AnimatedAvatar />
            </div>
          </div>
        </div>
      </section>

      {/* I Operate Section */}
      <section className="py-16 sm:py-24 bg-white border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6">
          <AnimatedHeading className="mb-8">I operate</AnimatedHeading>
          <FadeIn delay={0.1}>
            <div className="text-neutral-600 text-lg max-w-3xl mb-10 leading-relaxed">
              <p>
                Currently, I serve as <strong className="text-neutral-800">Director of the Spine Endoscopy Center</strong> at{" "}
                <a href="#" className="text-teal-600 hover:text-teal-700">Davos Hospital</a>, where I specialize in{" "}
                <strong className="text-neutral-800">Unilateral Biportal Endoscopy (UBE)</strong> — 
                a cutting-edge minimally invasive technique for treating various spinal conditions.
              </p>
              <p className="mt-4">
                Previously, I was <strong className="text-neutral-800">Assistant Professor</strong> in the Department of Neurosurgery at 
                Hallym University Dongtan Sacred Heart Hospital.
              </p>
            </div>
          </FadeIn>
          
          <div className="grid sm:grid-cols-3 gap-6">
            <StatCard number="15+" label="Years of Experience" delay={0} />
            <StatCard number="UBE" label="Subspecialty" delay={0.1} />
            <StatCard number="AI" label="Research Focus" delay={0.2} />
          </div>
        </div>
      </section>

      {/* I Research Section */}
      <section className="py-16 sm:py-24 border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6">
          <AnimatedHeading className="mb-8">I research</AnimatedHeading>
          <FadeIn delay={0.1}>
            <p className="text-neutral-600 text-lg max-w-3xl mb-10 leading-relaxed">
              My research bridges <strong className="text-neutral-800">clinical practice</strong> and{" "}
              <strong className="text-neutral-800">artificial intelligence</strong>. 
              I'm passionate about using AI to improve diagnosis, treatment planning, and surgical outcomes in spine surgery.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-4 gap-6 mb-12">
            <StatCard number="11" label="h-index" delay={0} />
            <StatCard number="30+" label="Presentations" delay={0.1} />
            <StatCard number="10+" label="Workshops Led" delay={0.2} />
            <StatCard number="50+" label="Publications" delay={0.3} />
          </div>

          <FadeIn delay={0.2}>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Research Areas</h3>
          </FadeIn>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-xl border border-neutral-200 overflow-hidden"
          >
            <AnimatedTableRow 
              title="Endoscopic Spine Surgery" 
              link="https://scholar.google.com/citations?user=YOUR_ID"
              linkText="View papers"
              delay={0}
            />
            <AnimatedTableRow 
              title="Clinical AI Applications" 
              link="https://www.researchgate.net/profile/Woon-Tak-Yuh"
              linkText="View papers"
              delay={0.1}
            />
            <AnimatedTableRow 
              title="Surgical Outcome Analysis" 
              status="Ongoing"
              delay={0.2}
            />
            <AnimatedTableRow 
              title="Minimally Invasive Techniques" 
              status="Ongoing"
              delay={0.3}
            />
          </motion.div>
        </div>
      </section>

      {/* I Teach Section */}
      <section className="py-16 sm:py-24 bg-white border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6">
          <AnimatedHeading className="mb-8">I teach</AnimatedHeading>
          <FadeIn delay={0.1}>
            <p className="text-neutral-600 text-lg max-w-3xl mb-10 leading-relaxed">
              I'm committed to <strong className="text-neutral-800">educating the next generation</strong> of spine surgeons through comprehensive 
              training programs. From simulation to live surgery, I help surgeons worldwide master endoscopic techniques.
            </p>
          </FadeIn>

          <FadeInStagger className="grid md:grid-cols-2 gap-6">
            <FadeInStaggerItem>
              <AnimatedCard>
                <div className="text-sm text-teal-600 font-medium mb-2">2024 – 2025</div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">International Training Center</h3>
                <p className="text-neutral-600 text-sm">
                  Training international physicians in advanced endoscopic spine surgery techniques. 
                  Surgeons from 10+ countries worldwide.
                </p>
              </AnimatedCard>
            </FadeInStaggerItem>
            <FadeInStaggerItem>
              <AnimatedCard>
                <div className="text-sm text-teal-600 font-medium mb-2">2024 – 2025</div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Beginner Workshop Series</h3>
                <p className="text-neutral-600 text-sm mb-4">
                  Comprehensive training program for surgeons new to endoscopic techniques.
                </p>
                <div className="flex flex-wrap gap-2">
                  <AnimatedTag delay={0}>Dummy Workshop</AnimatedTag>
                  <AnimatedTag delay={0.1}>Live Pig Workshop</AnimatedTag>
                  <AnimatedTag delay={0.2}>Cadaver Workshop</AnimatedTag>
                </div>
              </AnimatedCard>
            </FadeInStaggerItem>
          </FadeInStagger>
        </div>
      </section>

      {/* Affiliations Section */}
      <section className="py-16 sm:py-24 border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6">
          <AnimatedHeading className="mb-8">I'm connected</AnimatedHeading>
          <FadeIn delay={0.1}>
            <p className="text-neutral-600 text-lg max-w-3xl mb-10 leading-relaxed">
              I actively contribute to the medical community through various <strong className="text-neutral-800">academic societies</strong>{" "}
              and <strong className="text-neutral-800">editorial roles</strong>.
            </p>
          </FadeIn>

          <FadeInStagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "KOMISS", role: "Academic Secretary" },
              { name: "KOSESS", role: "Research Committee" },
              { name: "Neurospine Journal", role: "Editor" },
              { name: "Korean Society of Spine Surgery", role: "Lifetime Member · IT Committee" },
              { name: "NASS", role: "Full Member" },
              { name: "KASS", role: "Full Member" },
            ].map((org) => (
              <FadeInStaggerItem key={org.name}>
                <AnimatedCard>
                  <div className="font-semibold text-neutral-900">{org.name}</div>
                  <div className="text-sm text-neutral-500">{org.role}</div>
                </AnimatedCard>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 sm:py-24 bg-white border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6">
          <AnimatedHeading className="mb-8">Let's connect</AnimatedHeading>
          <FadeIn delay={0.1}>
            <p className="text-neutral-600 text-lg max-w-3xl mb-10 leading-relaxed">
              Interested in <strong className="text-neutral-800">collaboration</strong>,{" "}
              <strong className="text-neutral-800">training programs</strong>, or just want to chat about spine surgery? 
              I'd love to hear from you.
            </p>
          </FadeIn>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap gap-4"
          >
            <SocialIcon href="mailto:woontak.yuh@gmail.com" title="Email">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </SocialIcon>
            <SocialIcon href="https://scholar.google.com/citations?user=YOUR_ID" title="Google Scholar">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 24a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm0-24L0 9.5l4.838 3.94A8 8 0 0 1 12 9a8 8 0 0 1 7.162 4.44L24 9.5z"/>
              </svg>
            </SocialIcon>
            <SocialIcon href="https://www.researchgate.net/profile/Woon-Tak-Yuh" title="ResearchGate">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.586 0c-.818 0-1.508.19-2.073.565-.563.377-.97.936-1.213 1.68a3.193 3.193 0 0 0-.112.437 8.365 8.365 0 0 0-.078.53 9 9 0 0 0-.05.727c-.01.282-.013.621-.013 1.016a31.121 31.121 0 0 0 .014 1.017 9 9 0 0 0 .05.727 7.946 7.946 0 0 0 .078.53h-.005a3.334 3.334 0 0 0 .112.438c.243.743.65 1.303 1.213 1.68.565.376 1.256.564 2.073.564.8 0 1.536-.213 2.105-.603.57-.39.94-.916 1.175-1.65.076-.235.135-.558.177-.93a10.9 10.9 0 0 0 .043-1.207v-.82c0-.095-.047-.142-.14-.142h-3.064c-.094 0-.14.047-.14.141v.956c0 .094.046.14.14.14h1.666c.056 0 .084.03.084.086 0 .36 0 .62-.036.865-.038.244-.1.447-.147.606-.108.335-.311.622-.603.853-.29.232-.68.347-1.138.347-.422 0-.752-.132-.99-.396a2.09 2.09 0 0 1-.49-.907 4.06 4.06 0 0 1-.152-1.014 9.292 9.292 0 0 1-.023-.882c0-.298.01-.55.023-.757.015-.254.058-.486.116-.698.06-.212.15-.4.267-.56.12-.158.27-.28.456-.372.186-.092.405-.138.66-.138.18 0 .34.027.473.08.134.056.244.126.336.21.09.086.162.19.22.318.056.13.096.26.12.395.027.09.063.136.113.136.043 0 .092-.01.14-.026l.79-.308c.094-.038.14-.09.14-.156 0-.02-.003-.044-.01-.07a2.5 2.5 0 0 0-.37-.783 2.48 2.48 0 0 0-.637-.602 3.107 3.107 0 0 0-.9-.405A3.9 3.9 0 0 0 19.586 0zM6.293 5.2c-1.41 0-2.47.37-3.177 1.11-.71.74-1.065 1.73-1.065 2.97 0 1.26.355 2.26 1.065 3.005.707.743 1.767 1.115 3.177 1.115.64 0 1.203-.1 1.696-.3.49-.2.9-.49 1.225-.865.325-.374.567-.82.726-1.34.16-.514.24-1.088.24-1.72V8.87c0-.615-.08-1.17-.24-1.67a3.322 3.322 0 0 0-.726-1.3 3.262 3.262 0 0 0-1.225-.833 4.367 4.367 0 0 0-1.696-.32v.001zm-.18 1.25c.31 0 .57.056.78.168.21.112.38.275.51.492.13.217.227.486.288.805.06.32.09.68.09 1.082v.405c0 .403-.03.764-.09 1.083-.06.32-.158.588-.288.804-.13.216-.3.38-.51.49-.21.11-.47.166-.78.166-.31 0-.57-.056-.78-.167-.21-.11-.38-.273-.51-.49a2.426 2.426 0 0 1-.29-.804 5.685 5.685 0 0 1-.088-1.082v-.405c0-.403.03-.764.088-1.083.06-.32.157-.588.29-.805.13-.217.3-.38.51-.492.21-.112.47-.168.78-.168z"/>
              </svg>
            </SocialIcon>
            <SocialIcon href="https://www.linkedin.com/in/woon-tak-yuh-03420311b/" title="LinkedIn">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </SocialIcon>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="py-8 text-center text-sm text-neutral-400"
      >
        <div className="max-w-5xl mx-auto px-6">
          © 2025 Woon Tak Yuh, MD. Seoul, South Korea.
        </div>
      </motion.footer>
    </main>
  );
}
