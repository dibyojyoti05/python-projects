"use client";

import { motion } from "framer-motion";

const aboutSections = [
  {
    title: "What I Build",
    content: "I engineer scalable, high-performance web applications and digital platforms. I focus on creating systems that are robust under the hood while maintaining an elegant, intuitive surface."
  },
  {
    title: "How I Think",
    content: "Architecture dictates longevity. I believe in writing code that is clean, modular, and maintainable. I approach every project with a systems-thinking mindset, ensuring that individual components harmonize into a cohesive whole."
  },
  {
    title: "Problems I Enjoy Solving",
    content: "I thrive on complexity. Whether it's optimizing performance bottlenecks, designing seamless user experiences for intricate data flows, or orchestrating reliable backend services, I find satisfaction in turning chaos into clarity."
  },
  {
    title: "My Approach",
    content: "Technology is a tool; the goal is always impact. I prioritize understanding the business logic and user needs before writing a single line of code. Relentless practice. Fearless execution."
  }
];

export default function About() {
  return (
    <section className="py-24 w-full max-w-6xl mx-auto px-6 relative z-10">
      <div className="flex flex-col md:flex-row gap-16 md:gap-24">
        {/* Sticky Header */}
        <div className="w-full md:w-1/3 relative">
          <div className="sticky top-32">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="font-display text-4xl md:text-5xl text-foreground mb-6"
            >
              Identity &<br/>Approach
            </motion.h2>
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 1 }}
              className="w-12 h-[1px] bg-white/20"
            />
          </div>
        </div>

        {/* Narrative Sections */}
        <div className="w-full md:w-2/3 flex flex-col gap-16">
          {aboutSections.map((section, index) => (
            <motion.div 
              key={section.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="flex flex-col gap-4"
            >
              <h3 className="text-sm tracking-[0.2em] uppercase text-accent font-medium">
                {section.title}
              </h3>
              <p className="text-lg md:text-xl text-soft-gray leading-relaxed max-w-2xl text-balance">
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
