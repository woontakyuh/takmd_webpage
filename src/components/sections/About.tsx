import { motion } from "framer-motion";
import { profile } from "../../lib/data";
import Card from "../ui/Card";
import Badge from "../ui/Badge";

export default function About() {
  return (
    <section id="about" className="section-padding">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="primary" className="mb-4">About Me</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
            Bridging Medicine & Technology
          </h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
            Dedicated to advancing spine surgery through minimally invasive techniques
            and leveraging artificial intelligence for better patient outcomes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card delay={0.1} className="lg:col-span-2">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Biography</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  As a neurosurgeon with over 15 years of experience, I specialize in minimally 
                  invasive spine surgery, particularly Unilateral Biportal Endoscopy (UBE). My 
                  practice combines cutting-edge surgical techniques with clinical AI research 
                  to improve diagnostic accuracy and patient outcomes.
                </p>
                <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
                  Currently serving as the Director of the Spine Endoscopy Center at Davos Hospital, 
                  I am committed to advancing the field through education, research, and international 
                  collaboration.
                </p>
              </div>
            </div>
          </Card>

          <Card delay={0.2}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Education</h3>
              </div>
            </div>
            <div className="space-y-4 pl-16">
              <div>
                <p className="text-[var(--text-primary)] font-medium">{profile.education.degree}</p>
                <p className="text-[var(--text-secondary)] text-sm">{profile.education.institution}</p>
              </div>
              <div>
                <p className="text-[var(--text-primary)] font-medium">Doctor of Medicine (MD)</p>
                <p className="text-[var(--text-secondary)] text-sm">Board Certified Neurosurgeon</p>
              </div>
            </div>
          </Card>

          <Card delay={0.3}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Expertise</h3>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pl-16">
              {[
                "Spine Surgery",
                "UBE",
                "Endoscopy",
                "AI Research",
                "Minimally Invasive",
                "Education",
              ].map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          </Card>

          <Card delay={0.4} className="lg:col-span-2">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Current Role</h3>
              </div>
            </div>
            <div className="pl-16">
              <p className="text-[var(--text-primary)] font-medium text-lg">
                {profile.currentPosition.title}
              </p>
              <p className="text-primary-500 mb-4">{profile.currentPosition.organization}</p>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Leading a dedicated team focused on advancing endoscopic spine surgery techniques 
                and training the next generation of spine surgeons from around the world.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
