"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const journeyStages = [
  {
    phase: "Learning",
    title: "The Foundation",
    description: "Mastering the fundamentals of computer science, algorithms, and core programming languages. Building a mental model of how systems operate at a low level."
  },
  {
    phase: "Building",
    title: "Constructing Systems",
    description: "Transitioning from theory to practice. Developing full-stack applications, understanding database architecture, and learning how to structure maintainable codebases."
  },
  {
    phase: "Experimenting",
    title: "Exploring the Edge",
    description: "Diving into new paradigms—machine learning, complex state management, and modern rendering techniques. Breaking things to understand how to fix them."
  },
  {
    phase: "Shipping",
    title: "Delivering Value",
    description: "Deploying production-ready applications. Focusing on CI/CD, performance optimization, accessibility, and ensuring a flawless user experience."
  },
  {
    phase: "Improving",
    title: "The Infinite Game",
    description: "Refining the craft. Mentoring others, contributing to open source, and continuously evolving as technology shifts. The journey never truly ends."
  }
];

export default function Experience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section className="py-32 w-full max-w-4xl mx-auto px-6 relative z-10" ref={containerRef}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-24"
      >
        <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">The Journey</h2>
        <p className="text-soft-gray uppercase tracking-widest text-sm">Evolution of a Builder</p>
      </motion.div>

      <div className="relative">
        {/* The central timeline line */}
        <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-[1px] bg-white/10 -translate-x-1/2" />
        
        {/* Animated fill line */}
        <motion.div 
          className="absolute left-[28px] md:left-1/2 top-0 w-[2px] bg-gradient-to-b from-white via-white/50 to-transparent -translate-x-1/2 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          style={{ height: lineHeight }}
        />

        <div className="flex flex-col gap-16 md:gap-24">
          {journeyStages.map((stage, index) => {
            const isEven = index % 2 === 0;
            return (
              <div key={stage.phase} className="relative flex items-center md:justify-between w-full">
                
                {/* Node marker */}
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="absolute left-[28px] md:left-1/2 w-4 h-4 bg-background border-2 border-white rounded-full -translate-x-1/2 z-10 shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                />

                {/* Content Container */}
                <motion.div 
                  initial={{ opacity: 0, x: isEven ? 50 : -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`w-full pl-20 md:pl-0 md:w-[45%] flex flex-col ${isEven ? 'md:items-end md:text-right md:pr-12' : 'md:items-start md:ml-auto md:pl-12'}`}
                >
                  <span className="text-xs uppercase tracking-[0.2em] text-accent mb-2">{stage.phase}</span>
                  <h3 className="font-display text-2xl text-foreground mb-3">{stage.title}</h3>
                  <p className="text-soft-gray text-base leading-relaxed">{stage.description}</p>
                </motion.div>

              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
