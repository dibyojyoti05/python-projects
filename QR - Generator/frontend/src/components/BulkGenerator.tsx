"use client";

import React, { useState } from 'react';
import { Download, Upload, CheckCircle, AlertCircle, RefreshCw, Sparkles, FileArchive } from 'lucide-react';
import { api } from '@/lib/api';

export default function BulkGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'png' | 'svg'>('png');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadTemplate = async () => {
    try {
      const blob = await api.downloadTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sample_bulk_qr_template.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to download template');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      if (!f.name.endsWith('.csv')) {
        setError('Please select a valid .csv file');
        return;
      }
      setFile(f);
      setError(null);
      setSuccess(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose a CSV file to process');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const zipBlob = await api.generateBulkZip(file, format);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulk_qr_codes_${format.toUpperCase()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess(true);
    } catch (err: unknown) {
      console.error(err);
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const res = (err as { response?: { data?: { detail?: string } } }).response;
        setError(res?.data?.detail || 'Failed to process bulk CSV file');
      } else {
        setError('Failed to process bulk CSV file');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>High-Volume Batch Production</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Bulk QR Code Generator
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
          Upload a spreadsheet of URLs or labels to batch generate hundreds of vector or raster QR codes bundled into a single ZIP archive.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={handleDownloadTemplate}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/70 text-slate-200 text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Download CSV Template (.csv)</span>
          </button>
        </div>
      </div>

      {/* Upload Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleGenerate} className="space-y-6">
          {/* Format selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Select Output Image Format
            </label>
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 text-xs font-medium text-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="png"
                  checked={format === 'png'}
                  onChange={() => setFormat('png')}
                  className="accent-indigo-500"
                />
                <span>PNG (Raster high-res)</span>
              </label>
              <label className="flex items-center space-x-2 text-xs font-medium text-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="svg"
                  checked={format === 'svg'}
                  onChange={() => setFormat('svg')}
                  className="accent-indigo-500"
                />
                <span>SVG (Scalable Vector)</span>
              </label>
            </div>
          </div>

          {/* Drag & Drop Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Upload CSV File
            </label>
            <div className="relative border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl p-8 text-center bg-slate-950/40 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                {file ? (
                  <div>
                    <span className="text-xs font-bold text-emerald-400">{file.name}</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-semibold text-slate-200">
                      Click or drag and drop your CSV file here
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      Header supported: name,destination_url
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Bulk batch generated successfully! ZIP archive download initiated.</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !file}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating ZIP Archive...</span>
              </>
            ) : (
              <>
                <FileArchive className="w-4 h-4" />
                <span>Process & Download ZIP Bundle</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
