"use client";

import { motion } from "framer-motion";
import { Mail } from "lucide-react";

const GithubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A4.8 4.8 0 0 0 8 18v4"></path>
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

export default function Contact() {
  return (
    <section id="contact" className="py-32 w-full max-w-4xl mx-auto px-6 relative z-10">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="flex flex-col items-center text-center glass rounded-3xl p-12 md:p-24 relative overflow-hidden"
      >
        {/* Subtle background glow inside the card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_60%)] pointer-events-none" />

        <h2 className="font-display text-4xl md:text-6xl text-foreground mb-6 tracking-tight relative z-10">
          Let&apos;s build something <br className="hidden md:block"/> worth remembering.
        </h2>
        
        <p className="text-soft-gray mb-12 max-w-xl text-lg relative z-10">
          Whether you have a specific project in mind, an opportunity, or just want to connect, my inbox is always open.
        </p>

        <div className="flex flex-col md:flex-row gap-6 relative z-10">
          <a 
            href="mailto:[EMAIL]" 
            className="flex items-center justify-center gap-3 bg-white text-black px-8 py-4 rounded-full font-medium hover:bg-gray-200 transition-colors group"
          >
            <Mail className="w-5 h-5" />
            Send an Email
          </a>
          
          <div className="flex gap-4">
            <a 
              href="[LINK]" // LinkedIn
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center w-14 h-14 rounded-full border border-white/20 hover:bg-white/10 transition-colors text-foreground"
              aria-label="LinkedIn"
            >
              <LinkedinIcon className="w-5 h-5" />
            </a>
            
            <a 
              href="[LINK]" // GitHub
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center w-14 h-14 rounded-full border border-white/20 hover:bg-white/10 transition-colors text-foreground"
              aria-label="GitHub"
            >
              <GithubIcon className="w-5 h-5" />
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
