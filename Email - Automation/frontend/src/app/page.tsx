"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, Zap, LayoutDashboard } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background dark:bg-slate-950 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 max-w-5xl w-full flex flex-col items-center text-center gap-8"
      >
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
          Enterprise Grade Email Automation
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          Automate Your <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">Email Marketing</span>
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-[600px]">
          Create, send, and track campaigns effortlessly. Build advanced visual workflows and monitor real-time analytics.
        </p>

        <div className="flex gap-4 mt-4">
          <Link href="/login">
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8 py-2">
              Get Started
            </button>
          </Link>
          <Link href="/dashboard">
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-8 py-2">
              Go to Dashboard
            </button>
          </Link>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl"
      >
        {[
          { icon: <Mail className="w-8 h-8 text-blue-500"/>, title: "Drag & Drop Builder", desc: "Create responsive emails in minutes without code." },
          { icon: <Zap className="w-8 h-8 text-yellow-500"/>, title: "Visual Workflows", desc: "Automate your sequences with our visual node editor." },
          { icon: <LayoutDashboard className="w-8 h-8 text-green-500"/>, title: "Real-time Analytics", desc: "Track opens, clicks, and revenue dynamically." }
        ].map((feature, idx) => (
          <div key={idx} className="glass rounded-xl p-6 flex flex-col items-center text-center gap-4 transition-transform hover:scale-105">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
              {feature.icon}
            </div>
            <h3 className="font-semibold text-lg">{feature.title}</h3>
            <p className="text-muted-foreground text-sm">{feature.desc}</p>
          </div>
        ))}
      </motion.div>
    </main>
  );
}
