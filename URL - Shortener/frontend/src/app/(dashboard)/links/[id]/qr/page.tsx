"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/axios";
import { Download, Check, Type, Upload } from "lucide-react";

export default function QRManagementPage() {
  const params = useParams();
  const linkId = params.id as string;
  
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [format, setFormat] = useState("png");
  const [rounded, setRounded] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    
    try {
      const formData = new FormData();
      formData.append("fg_color", fgColor);
      formData.append("bg_color", bgColor);
      formData.append("format", format);
      formData.append("rounded", String(rounded));
      if (logo) {
        formData.append("logo", logo);
      }
      
      const response = await api.post(`/qr/generate/${linkId}`, formData, {
        responseType: 'blob', // Important to handle the image response
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: format === 'svg' ? 'image/svg+xml' : 'image/png' }));
      setQrImageUrl(url);
    } catch (err: any) {
      setError("Failed to generate QR code.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrImageUrl) return;
    const a = document.createElement('a');
    a.href = qrImageUrl;
    a.download = `qrcode-${linkId}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Generate Branded QR Code</h1>
        <p className="text-gray-500">Customize the appearance of your QR code and download it in high resolution.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">{error}</div>}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Foreground Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="h-10 w-10 border-0 rounded p-0 cursor-pointer" />
                <span className="text-sm font-mono text-gray-600 dark:text-gray-400">{fgColor}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Background Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-10 w-10 border-0 rounded p-0 cursor-pointer" />
                <span className="text-sm font-mono text-gray-600 dark:text-gray-400">{bgColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Format</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input type="radio" checked={format === 'png'} onChange={() => setFormat('png')} className="text-indigo-600 focus:ring-indigo-500" />
                  PNG
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input type="radio" checked={format === 'svg'} onChange={() => setFormat('svg')} className="text-indigo-600 focus:ring-indigo-500" />
                  SVG
                </label>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" checked={rounded} onChange={(e) => setRounded(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 border-gray-300" />
                Use Rounded Modules
              </label>
            </div>

            {format === 'png' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Center Logo</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setLogo(e.target.files ? e.target.files[0] : null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-gray-700 dark:file:text-gray-300"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
          >
            {loading ? "Generating..." : "Generate Preview"}
          </button>
        </div>

        {/* Preview Area */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center p-10">
          {qrImageUrl ? (
            <div className="space-y-6 flex flex-col items-center">
              <div className="p-4 bg-white rounded-xl shadow-sm">
                <img src={qrImageUrl} alt="QR Code Preview" className="w-64 h-64 object-contain" />
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition shadow-sm"
              >
                <Download size={20} />
                Download {format.toUpperCase()}
              </button>
            </div>
          ) : (
            <div className="text-gray-400 text-center flex flex-col items-center gap-3">
              <Type size={48} className="opacity-50" />
              <p>Configure options and click "Generate Preview"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
