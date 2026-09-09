import React from 'react';
import { jsPDF } from 'jspdf';
import type { ResearchReportData } from '../types/index';

export const ResearchReport: React.FC<{ data: ResearchReportData }> = ({ data }) => {
  const [showExport, setShowExport] = React.useState(false);

  if (!data) return null;

  const downloadReport = (format: 'json' | 'md' | 'txt' | 'html' | 'doc' | 'pdf') => {
    setShowExport(false); // Close menu on click
    if (format === 'pdf') {
      const doc = new jsPDF();
      let y = 20;
      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const textWidth = pageWidth - 2 * margin;

      const checkPage = (height: number) => {
        if (y + height > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin + 10;
        }
      };

      const addTitle = (title: string) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        const lines = doc.splitTextToSize(title, textWidth);
        checkPage(lines.length * 10);
        doc.text(lines, margin, y);
        y += lines.length * 10 + 5;
      };

      const addHeading = (heading: string) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        checkPage(10);
        doc.setTextColor(41, 128, 185);
        doc.text(heading, margin, y);
        doc.setTextColor(0, 0, 0);
        y += 8;
      };

      const addParagraph = (text: string) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        const lines = doc.splitTextToSize(text, textWidth);
        checkPage(lines.length * 6);
        doc.text(lines, margin, y);
        y += lines.length * 6 + 4;
      };

      const addList = (items: string[], highlight: boolean = false) => {
        doc.setFont("helvetica", highlight ? "bold" : "normal");
        doc.setFontSize(12);
        items.forEach(item => {
          const lines = doc.splitTextToSize(item, textWidth - 10);
          checkPage(lines.length * 6);
          
          if (highlight) {
            doc.setFillColor(255, 243, 205); // light yellow
            // Draw highlight rectangle behind text
            doc.rect(margin + 6, y - 5, textWidth - 6, lines.length * 6 + 1, 'F');
          }
          
          doc.setFillColor(0, 0, 0);
          doc.circle(margin + 2, y - 1.5, 1, 'F');
          doc.text(lines, margin + 8, y);
          y += lines.length * 6 + 2;
        });
        y += 4;
      };

      addTitle(cleanTextForPdf(data.topic));

      addHeading("EXECUTIVE SUMMARY");
      addParagraph(cleanTextForPdf(data.executive_summary));

      if (data.key_findings && data.key_findings.length > 0) {
        addHeading("KEY FINDINGS");
        addList(data.key_findings.map(cleanTextForPdf));
      }

      if (data.important_facts && data.important_facts.length > 0) {
        addHeading("IMPORTANT FACTS");
        addList(data.important_facts.map(cleanTextForPdf), true);
      }

      if (data.benefits && data.benefits.length > 0) {
        addHeading("BENEFITS");
        addList(data.benefits.map(cleanTextForPdf));
      }

      if (data.risks && data.risks.length > 0) {
        addHeading("RISKS & LIMITATIONS");
        addList(data.risks.map(cleanTextForPdf));
      }

      addHeading("CONCLUSION");
      addParagraph(cleanTextForPdf(data.conclusion));

      doc.save(`Research_Report_${data.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
      return;
    }

    let content = '';
    let mimeType = '';
    let ext = '';

    if (format === 'json') {
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
      ext = 'json';
    } else if (format === 'md') {
      content = `# ${data.topic}\n\n## Executive Summary\n${data.executive_summary}\n\n## Key Findings\n${data.key_findings?.map(f => `- ${f}`).join('\n') || 'N/A'}\n\n## Important Facts\n${data.important_facts?.map(f => `- ${f}`).join('\n') || 'N/A'}\n\n## Benefits\n${data.benefits?.map(f => `- ${f}`).join('\n') || 'N/A'}\n\n## Risks & Limitations\n${data.risks?.map(f => `- ${f}`).join('\n') || 'N/A'}\n\n## Conclusion\n${data.conclusion}`;
      mimeType = 'text/markdown';
      ext = 'md';
    } else if (format === 'txt') {
      content = `${data.topic.toUpperCase()}\n\nEXECUTIVE SUMMARY\n${data.executive_summary}\n\nKEY FINDINGS\n${data.key_findings?.map(f => `* ${f}`).join('\n') || 'N/A'}\n\nIMPORTANT FACTS\n${data.important_facts?.map(f => `* ${f}`).join('\n') || 'N/A'}\n\nBENEFITS\n${data.benefits?.map(f => `* ${f}`).join('\n') || 'N/A'}\n\nRISKS & LIMITATIONS\n${data.risks?.map(f => `* ${f}`).join('\n') || 'N/A'}\n\nCONCLUSION\n${data.conclusion}`;
      mimeType = 'text/plain';
      ext = 'txt';
    } else if (format === 'html' || format === 'doc') {
      content = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>${data.topic}</title></head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h1 style="color: #2563eb;">${data.topic}</h1>
          <h2 style="color: #1e40af; border-bottom: 1px solid #ccc; padding-bottom: 4px;">Executive Summary</h2>
          <p>${data.executive_summary}</p>
          <h2 style="color: #1e40af; border-bottom: 1px solid #ccc; padding-bottom: 4px;">Key Findings</h2>
          <ul>${data.key_findings?.map(f => `<li style="margin-bottom: 4px;">${f}</li>`).join('') || '<li>N/A</li>'}</ul>
          <h2 style="color: #1e40af; border-bottom: 1px solid #ccc; padding-bottom: 4px;">Important Facts</h2>
          <ul>${data.important_facts?.map(f => `<li style="margin-bottom: 4px;">${f}</li>`).join('') || '<li>N/A</li>'}</ul>
          <h2 style="color: #1e40af; border-bottom: 1px solid #ccc; padding-bottom: 4px;">Benefits</h2>
          <ul>${data.benefits?.map(f => `<li style="margin-bottom: 4px;">${f}</li>`).join('') || '<li>N/A</li>'}</ul>
          <h2 style="color: #1e40af; border-bottom: 1px solid #ccc; padding-bottom: 4px;">Risks & Limitations</h2>
          <ul>${data.risks?.map(f => `<li style="margin-bottom: 4px;">${f}</li>`).join('') || '<li>N/A</li>'}</ul>
          <h2 style="color: #1e40af; border-bottom: 1px solid #ccc; padding-bottom: 4px;">Conclusion</h2>
          <p>${data.conclusion}</p>
        </body>
        </html>
      `;
      mimeType = format === 'doc' ? 'application/msword' : 'text/html';
      ext = format;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Research_Report_${data.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const cleanTextForPdf = (text: string) => {
    if (!text) return '';
    let cleaned = text.replace(/\[SOURCE-\d+\]/g, '').trim();
    cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1');
    cleaned = cleaned.replace(/\*(.*?)\*/g, '$1');
    return cleaned;
  };

  const renderTextWithCitations = (text: string) => {
    if (!text) return null;
    
    // Remove citation badges
    let processedText = text.replace(/\s*\[SOURCE-\d+\]/g, '');
    
    // Markdown bold parsing
    processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
    // Markdown italic parsing
    processedText = processedText.replace(/\*(.*?)\*/g, '<em class="text-white/90 italic">$1</em>');

    return (
      <span dangerouslySetInnerHTML={{ __html: processedText }} />
    );
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="w-full flex flex-col xl:flex-row gap-8 relative">
      {/* Sticky Table of Contents Sidebar */}
      <div className="hidden xl:block w-72 shrink-0 print:hidden relative">
        <div className="sticky top-8 glass-panel p-6 rounded-3xl animate-fade-in-up">
          <h3 className="text-sm font-bold text-ai-primary uppercase tracking-wider mb-6 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
            Contents
          </h3>
          <ul className="space-y-4">
            <li><button onClick={() => scrollToSection('sec-summary')} className="text-ai-muted hover:text-white hover:translate-x-1 transition-all text-sm text-left w-full font-medium">Executive Summary</button></li>
            <li><button onClick={() => scrollToSection('sec-findings')} className="text-ai-muted hover:text-white hover:translate-x-1 transition-all text-sm text-left w-full font-medium">Key Findings</button></li>
            <li><button onClick={() => scrollToSection('sec-facts')} className="text-ai-muted hover:text-white hover:translate-x-1 transition-all text-sm text-left w-full font-medium">Important Facts</button></li>
            {(data.benefits?.length > 0 || data.risks?.length > 0) && (
              <li><button onClick={() => scrollToSection('sec-proscons')} className="text-ai-muted hover:text-white hover:translate-x-1 transition-all text-sm text-left w-full font-medium">Benefits & Risks</button></li>
            )}
            {(data.different_perspectives?.length > 0 || data.research_gaps?.length > 0) && (
              <li><button onClick={() => scrollToSection('sec-perspectives')} className="text-ai-muted hover:text-white hover:translate-x-1 transition-all text-sm text-left w-full font-medium">Perspectives & Gaps</button></li>
            )}
            <li><button onClick={() => scrollToSection('sec-conclusion')} className="text-ai-muted hover:text-white hover:translate-x-1 transition-all text-sm text-left w-full font-medium">Conclusion</button></li>
          </ul>

          <div className="mt-8 pt-6 border-t border-ai-border/50 relative">
            <button 
              onClick={() => setShowExport(!showExport)}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-ai-primary/10 text-ai-primary hover:bg-ai-primary hover:text-white border border-ai-primary/30 rounded-xl transition-all font-semibold shadow-[0_0_20px_rgba(99,102,241,0.1)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export Report
            </button>
            
            {showExport && (
              <div className="absolute top-full mt-2 w-full bg-ai-dark border border-ai-border rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in-up">
                <div className="p-2 space-y-1">
                  {[
                    { format: 'pdf', label: 'PDF Document', ext: '.pdf' },
                    { format: 'doc', label: 'Word Document', ext: '.doc' },
                    { format: 'md', label: 'Markdown', ext: '.md' }
                  ].map(option => (
                    <button 
                      key={option.format}
                      onClick={() => downloadReport(option.format as any)} 
                      className="w-full text-left px-3 py-2.5 text-sm text-ai-muted hover:text-white hover:bg-ai-card rounded-lg transition-colors flex items-center justify-between group"
                    >
                      <span className="font-medium">{option.label}</span>
                      <span className="text-[10px] bg-ai-border/50 px-1.5 py-0.5 rounded text-ai-muted group-hover:bg-ai-primary/20 group-hover:text-ai-primary transition-colors">{option.ext}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-12 min-w-0 print:p-0 print:border-none print:bg-white print:text-black pb-32">
        
        {/* Header Section */}
        <div className="relative animate-fade-in-up" id="sec-summary">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-ai-primary/20 rounded-full blur-[120px] -mr-32 -mt-32 pointer-events-none hidden md:block"></div>
          
          <div className="relative z-10 mb-8 max-h-[25vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-ai-border scrollbar-track-transparent">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-blue-100 to-ai-primary leading-[1.3] tracking-tight pb-2 print:text-black print:bg-none">
              {renderTextWithCitations(data.topic)}
            </h2>
          </div>

          <div className="relative z-10 glass-panel p-8 md:p-10 rounded-3xl border border-ai-border/30 shadow-2xl bg-ai-dark/40 backdrop-blur-xl">
            <h3 className="text-sm font-bold text-ai-primary tracking-widest uppercase mb-6 flex items-center gap-3">
              <span className="w-8 h-px bg-ai-primary/50"></span>
              Executive Summary
            </h3>
            <p className="text-white/90 leading-relaxed text-xl md:text-2xl font-light">
              {renderTextWithCitations(data.executive_summary)}
            </p>
          </div>
        </div>

        {/* Mobile Export Button (Hidden on Desktop) */}
        <div className="xl:hidden relative print:hidden animate-fade-in-up">
          <button 
            onClick={() => setShowExport(!showExport)}
            className="w-full flex items-center justify-center gap-2 px-5 py-4 bg-ai-primary hover:bg-ai-primaryHover text-white rounded-2xl transition-all font-semibold shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export Full Report
          </button>
          
          {showExport && (
            <div className="absolute right-0 mt-2 w-full bg-ai-dark border border-ai-border rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="p-2 space-y-1">
                {[
                  { format: 'pdf', label: 'PDF Document', ext: '.pdf' },
                  { format: 'doc', label: 'Word Document', ext: '.doc' },
                  { format: 'md', label: 'Markdown', ext: '.md' }
                ].map(option => (
                  <button 
                    key={option.format}
                    onClick={() => downloadReport(option.format as any)} 
                    className="w-full text-left px-4 py-3 text-sm text-ai-muted hover:text-white hover:bg-ai-card rounded-lg transition-colors flex items-center justify-between"
                  >
                    <span className="font-medium">{option.label}</span>
                    <span className="text-[10px] bg-ai-border/50 px-1.5 py-0.5 rounded text-ai-muted">{option.ext}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Findings & Facts Grids */}
        <div className="space-y-12">
          
          {/* Key Findings */}
          <div id="sec-findings" className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              </div>
              Key Findings
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {data.key_findings?.map((item, i) => (
                <div key={i} className="group flex gap-4 items-start p-6 bg-ai-card/40 backdrop-blur-md rounded-2xl hover:bg-ai-card transition-all border border-ai-border/30 hover:border-blue-500/30 hover:-translate-y-1 hover:shadow-xl">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-[0_0_10px_rgba(59,130,246,0)] group-hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                    <span className="text-sm font-bold">{i + 1}</span>
                  </div>
                  <span className="leading-relaxed text-ai-muted group-hover:text-white transition-colors">
                    {renderTextWithCitations(item)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Important Facts */}
          <div id="sec-facts" className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              </div>
              Important Facts
            </h3>
            <div className="grid gap-4">
              {data.important_facts?.map((item, i) => (
                <div key={i} className="group flex gap-5 items-center p-5 bg-ai-card/30 rounded-2xl border border-transparent hover:border-amber-500/20 transition-all hover:bg-ai-card/60">
                  <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.6)] group-hover:scale-125 transition-transform"></div>
                  <span className="leading-relaxed text-ai-muted group-hover:text-white transition-colors text-lg">
                    {renderTextWithCitations(item)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pros/Cons Grid */}
        {(data.benefits?.length > 0 || data.risks?.length > 0) && (
          <div id="sec-proscons" className="grid lg:grid-cols-2 gap-6">
            {data.benefits && data.benefits.length > 0 && (
              <div className="bg-gradient-to-b from-emerald-900/20 to-ai-card/50 border border-emerald-500/20 p-8 rounded-3xl animate-fade-in-up hover:border-emerald-500/40 transition-colors shadow-2xl relative overflow-hidden" style={{ animationDelay: '0.3s' }}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[50px] -mr-16 -mt-16 pointer-events-none"></div>
                <h3 className="text-2xl font-bold text-emerald-400 mb-8 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  Benefits & Opportunities
                </h3>
                <ul className="space-y-5">
                  {data.benefits.map((item, i) => (
                    <li key={i} className="flex gap-4 text-emerald-100/70 hover:text-emerald-50 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-emerald-400 font-bold text-xs">+</span>
                      </div>
                      <span className="leading-relaxed">{renderTextWithCitations(item)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {data.risks && data.risks.length > 0 && (
              <div className="bg-gradient-to-b from-red-900/20 to-ai-card/50 border border-red-500/20 p-8 rounded-3xl animate-fade-in-up hover:border-red-500/40 transition-colors shadow-2xl relative overflow-hidden" style={{ animationDelay: '0.4s' }}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-[50px] -mr-16 -mt-16 pointer-events-none"></div>
                <h3 className="text-2xl font-bold text-red-400 mb-8 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  </div>
                  Risks & Limitations
                </h3>
                <ul className="space-y-5">
                  {data.risks.map((item, i) => (
                    <li key={i} className="flex gap-4 text-red-100/70 hover:text-red-50 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-red-400 font-bold text-xs">-</span>
                      </div>
                      <span className="leading-relaxed">{renderTextWithCitations(item)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Perspectives and Gaps */}
        {(data.different_perspectives?.length > 0 || data.research_gaps?.length > 0) && (
          <div id="sec-perspectives" className="grid lg:grid-cols-2 gap-6">
            {data.different_perspectives && data.different_perspectives.length > 0 && (
              <div className="glass-panel p-8 rounded-3xl animate-fade-in-up hover:shadow-xl transition-all" style={{ animationDelay: '0.5s' }}>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </div>
                  Different Perspectives
                </h3>
                <div className="space-y-4">
                  {data.different_perspectives.map((item, i) => (
                    <div key={i} className="bg-ai-dark/40 p-5 rounded-2xl border border-ai-border/30 hover:border-purple-500/30 transition-colors">
                      <p className="text-ai-muted leading-relaxed">{renderTextWithCitations(item)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.research_gaps && data.research_gaps.length > 0 && (
              <div className="glass-panel p-8 rounded-3xl animate-fade-in-up hover:shadow-xl transition-all" style={{ animationDelay: '0.55s' }}>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  Research Gaps
                </h3>
                <div className="space-y-4">
                  {data.research_gaps.map((item, i) => (
                    <div key={i} className="bg-ai-dark/40 p-5 rounded-2xl border border-ai-border/30 hover:border-pink-500/30 transition-colors">
                      <p className="text-ai-muted leading-relaxed">{renderTextWithCitations(item)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Conclusion */}
        <div id="sec-conclusion" className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <div className="bg-gradient-to-br from-ai-primary/20 via-ai-card to-ai-dark border border-ai-primary/30 p-10 md:p-14 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-ai-primary/20 blur-[120px] rounded-full pointer-events-none -mt-32 -mr-32"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/20 blur-[100px] rounded-full pointer-events-none -mb-32 -ml-32"></div>
            
            <h3 className="text-sm font-bold text-ai-primary tracking-widest uppercase mb-8 flex items-center gap-3 relative z-10">
              <span className="w-8 h-px bg-ai-primary/50"></span>
              Conclusion
            </h3>
            <p className="text-white text-xl md:text-2xl leading-[1.8] font-light relative z-10">
              {renderTextWithCitations(data.conclusion)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
