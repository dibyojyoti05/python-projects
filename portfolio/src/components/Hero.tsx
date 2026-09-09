"use client";

import { motion, Variants } from "framer-motion";
import Image from "next/image";

export default function Hero() {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 1, ease: "easeOut" } },
  };

  const wordReveal: Variants = {
    hidden: { opacity: 0, filter: "blur(10px)", y: 20 },
    show: { 
      opacity: 1, 
      filter: "blur(0px)", 
      y: 0, 
      transition: { duration: 1.5, ease: "easeOut" } 
    },
  };

  const renderWords = (text: string) => {
    return text.split(" ").map((word, index) => (
      <motion.span key={index} variants={wordReveal} className="inline-block mr-[0.25em]">
        {word}
      </motion.span>
    ));
  };

  return (
    <section className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden pt-20 pb-32">
      {/* Subtle ambient light */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 3, delay: 1 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-white rounded-full blur-[120px] mix-blend-overlay pointer-events-none opacity-30"
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center text-center w-full max-w-5xl px-6"
      >
        <motion.div 
          variants={item}
          className="relative w-64 h-80 md:w-80 md:h-[400px] mb-12 rounded-xl overflow-hidden glass p-1"
        >
          {/* Subtle breathing animation for image container */}
          <motion.div 
            animate={{ 
              y: [0, -10, 0],
              scale: [1, 1.02, 1]
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-full h-full relative rounded-lg overflow-hidden"
          >
            <div className="absolute inset-0 bg-charcoal animate-pulse rounded-lg" />
            <Image 
              src="/portrait.jpg" 
              alt="Portrait" 
              fill
              className="object-cover grayscale hover:grayscale-0 transition-all duration-1000 opacity-90 image-glow"
              priority
              onError={(e) => {
                e.currentTarget.style.opacity = '0';
              }}
            />
          </motion.div>
        </motion.div>

        <motion.div className="mb-6 overflow-hidden flex flex-wrap justify-center">
          <h1 className="font-display text-4xl md:text-6xl font-medium tracking-tight text-foreground flex flex-wrap justify-center">
            {renderWords("DIBYOJYOTI BAL")}
          </h1>
        </motion.div>

        <motion.div variants={item} className="mb-16">
          <p className="text-sm md:text-base tracking-widest text-soft-gray uppercase">
            Developer &bull; Builder &bull; Problem Solver
          </p>
        </motion.div>

        <div className="flex flex-col items-center gap-4 mt-8 overflow-hidden">
          <h2 className="font-display text-2xl md:text-5xl font-medium text-foreground tracking-tight text-glow flex flex-wrap justify-center">
            {renderWords("Practice like you never won.")}
          </h2>
          <h2 className="font-display text-2xl md:text-5xl font-medium text-soft-gray tracking-tight flex flex-wrap justify-center">
            {renderWords("Perform like you never lost.")}
          </h2>
        </div>

        <motion.div 
          variants={item}
          className="mt-24"
        >
          <a href="#work" className="group flex flex-col items-center gap-4 cursor-pointer">
            <span className="text-xs uppercase tracking-widest text-soft-gray group-hover:text-foreground transition-colors">Explore My Work</span>
            <motion.div 
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-[1px] h-12 bg-gradient-to-b from-soft-gray to-transparent group-hover:from-foreground transition-colors"
            />
          </a>
        </motion.div>

      </motion.div>
    </section>
  );
}
