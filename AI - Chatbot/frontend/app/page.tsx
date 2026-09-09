"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Bot, Shield, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-black text-white">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/30 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/30 blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 text-center max-w-4xl px-6"
      >
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium text-blue-200 border border-blue-500/30">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          v2.0 Enterprise Engine Now Live
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
          Intelligence. <br/> Without Compromise.
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 mb-12 max-w-2xl mx-auto">
          Deploy an enterprise-grade AI assistant capable of semantic search, multi-model generation, and autonomous tool calling within a secure boundary.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/login" className="w-full sm:w-auto">
            <button className="w-full px-8 py-4 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 group">
              Start Free Trial
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
          <Link href="/admin" className="w-full sm:w-auto">
            <button className="w-full px-8 py-4 rounded-xl glass hover:bg-white/10 transition-colors flex items-center justify-center gap-2 font-medium">
              View Architecture
            </button>
          </Link>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        className="z-10 mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl px-6 w-full"
      >
        <div className="glass p-6 rounded-2xl flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
            <Bot className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Multi-Model Core</h3>
          <p className="text-zinc-400 text-sm">Seamlessly route requests between GPT-4o, Claude 3.5, and Gemini Pro via LiteLLM.</p>
        </div>
        <div className="glass p-6 rounded-2xl flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Vector Intelligence</h3>
          <p className="text-zinc-400 text-sm">Built-in RAG pipeline using Qdrant and Sentence Transformers for massive document scale.</p>
        </div>
        <div className="glass p-6 rounded-2xl flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4 text-green-400">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Enterprise Security</h3>
          <p className="text-zinc-400 text-sm">Stateless JWT authentication, workspace isolation, and on-premise ready deployment.</p>
        </div>
      </motion.div>
    </div>
  );
}
