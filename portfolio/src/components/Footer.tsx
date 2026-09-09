"use client";


export default function Footer() {
  return (
    <footer className="w-full border-t border-white/5 py-12 px-6 mt-12 relative z-10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <span className="font-display text-xl text-foreground">DIBYOJYOTI BAL</span>
          <span className="text-xs text-soft-gray uppercase tracking-widest">
            &copy; {new Date().getFullYear()}
          </span>
        </div>

        <div className="text-center md:text-right">
          <p className="text-accent/60 text-sm mb-2 italic">
            &quot;Practice relentlessly. Perform fearlessly.&quot;
          </p>
          <p className="text-xs text-soft-gray uppercase tracking-widest">
            Built with curiosity, discipline & code.
          </p>
        </div>
      </div>
    </footer>
  );
}
