"use client";

import { motion } from "framer-motion";

const skillCategories = [
  {
    category: "Programming",
    skills: ["Python", "JavaScript", "TypeScript"]
  },
  {
    category: "Web Development",
    skills: ["HTML & CSS", "React", "Next.js", "Tailwind CSS", "Framer Motion"]
  },
  {
    category: "Backend",
    skills: ["Node.js", "Flask", "FastAPI", "Django"]
  },
  {
    category: "Database",
    skills: ["PostgreSQL", "SQL", "Redis"]
  },
  {
    category: "Data & AI",
    skills: ["Pandas", "NumPy", "Machine Learning", "LLM Technologies"]
  },
  {
    category: "Tools",
    skills: ["Git", "GitHub", "VS Code", "Vercel"]
  }
];

export default function Skills() {
  return (
    <section className="py-24 w-full max-w-6xl mx-auto px-6 relative z-10">
      <div className="flex flex-col items-center mb-16">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-4xl text-foreground mb-4"
        >
          Technical Arsenal
        </motion.h2>
        <motion.div 
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="w-24 h-[1px] bg-gradient-to-r from-transparent via-accent to-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
        {skillCategories.map((group, groupIndex) => (
          <motion.div 
            key={group.category}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: groupIndex * 0.1 }}
            className="flex flex-col gap-6 p-6 rounded-2xl glass hover:shadow-[0_10px_30px_rgba(255,255,255,0.03)] transition-all duration-500"
          >
            <h3 className="text-sm tracking-[0.2em] uppercase text-white/70 font-medium border-b border-white/10 pb-4">
              {group.category}
            </h3>
            <ul className="flex flex-col gap-3">
              {group.skills.map((skill, index) => (
                <motion.li 
                  key={skill}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: (groupIndex * 0.1) + (index * 0.05) }}
                  className="text-soft-gray hover:text-foreground transition-colors text-base font-light flex items-center gap-2 before:content-[''] before:block before:w-1 before:h-1 before:bg-accent/50 before:rounded-full hover:before:bg-accent"
                >
                  {skill}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
