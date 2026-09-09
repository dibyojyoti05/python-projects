"use client";

import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

const projects = [
  {
    id: "01",
    name: "Lumea's Women's Health Clinic",
    positioning: "Modern healthcare digital presence.",
    description: "A clean, trustworthy, and accessible medical clinic website. Focuses on user-centric design, clear navigation, and an architecture built for performance and reliability.",
    tags: ["Next.js", "UI/UX", "Healthcare", "Responsive"],
    url: "https://demo-clinic-kohl.vercel.app/",
    image: "/lumea_clinic.jpg", 
  },
  {
    id: "02",
    name: "Vanta R01 Engineered Beyond",
    positioning: "Premium tech product showcase.",
    description: "A sleek, cutting-edge hardware product page featuring dramatic lighting, high-end aesthetics, and sophisticated user interactions.",
    tags: ["React", "Hardware", "Frontend", "Interaction"],
    url: "https://animated-website-seven-wine.vercel.app/",
    image: "/vanta_car.jpg",
  }
];

function ProjectCard({ project, index }: { project: typeof projects[0], index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"]
  });

  // Parallax for image
  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  // 3D Tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 20, stiffness: 150, mass: 0.5 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXPos = e.clientX - rect.left;
    const mouseYPos = e.clientY - rect.top;
    const xPct = mouseXPos / width - 0.5;
    const yPct = mouseYPos / height - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div 
      ref={cardRef}
      initial={{ opacity: 0, y: 100 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
      className="group relative flex flex-col md:flex-row gap-12 items-center"
    >
      {/* Number Indicator */}
      <div className="absolute -left-4 -top-8 md:-left-12 md:-top-12 text-6xl md:text-8xl font-display font-bold text-white/5 pointer-events-none z-0 transition-transform duration-700 group-hover:-translate-y-4">
        {project.id}
      </div>

      {/* Project Image/Preview Card with 3D Tilt */}
      <motion.div 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformPerspective: 1000 }}
        className="w-full md:w-3/5 aspect-[4/3] relative rounded-2xl overflow-hidden glass p-2 group-hover:shadow-[0_20px_50px_rgba(255,255,255,0.05)] transition-shadow duration-700 z-10 cursor-pointer"
      >
        <div className="w-full h-full relative rounded-xl overflow-hidden bg-charcoal">
          <div className="absolute inset-0 bg-charcoal animate-pulse rounded-lg" />
          <motion.div style={{ y, scale: 1.15 }} className="absolute inset-0 w-full h-full">
            <Image 
              src={project.image} 
              alt={project.name}
              fill
              className="object-cover transition-transform duration-1000 opacity-80 group-hover:opacity-100"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                e.currentTarget.parentElement!.innerHTML = '<span class="text-soft-gray font-display text-2xl tracking-widest uppercase">Preview Unavailable</span>';
              }}
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        </div>
      </motion.div>

      {/* Project Info */}
      <div className="w-full md:w-2/5 flex flex-col z-10">
        <h3 className="font-display text-3xl mb-2 text-foreground group-hover:text-glow transition-all duration-500">{project.name}</h3>
        <p className="text-sm uppercase tracking-widest text-accent mb-6 font-medium">{project.positioning}</p>
        
        <p className="text-soft-gray text-base leading-relaxed mb-8">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-10">
          {project.tags.map(tag => (
            <span key={tag} className="text-xs tracking-wider uppercase px-3 py-1 border border-white/10 rounded-full text-soft-gray bg-white/5 backdrop-blur-sm">
              {tag}
            </span>
          ))}
        </div>

        <a 
          href={project.url} 
          target="_blank" 
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm uppercase tracking-widest font-medium text-foreground pb-2 border-b border-white/20 w-max hover:border-white transition-colors group/btn"
        >
          View Project 
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover/btn:-translate-y-1 group-hover/btn:translate-x-1" />
        </a>
      </div>
    </motion.div>
  );
}

export default function Projects() {
  return (
    <section id="work" className="py-32 w-full max-w-6xl mx-auto px-6 relative z-10">
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="mb-24 flex items-baseline gap-4"
      >
        <h2 className="font-display text-4xl md:text-5xl text-foreground">Featured Work</h2>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-white/20 to-transparent" />
      </motion.div>

      <div className="flex flex-col gap-32">
        {projects.map((project, index) => (
          <ProjectCard key={project.id} project={project} index={index} />
        ))}
      </div>
    </section>
  );
}
