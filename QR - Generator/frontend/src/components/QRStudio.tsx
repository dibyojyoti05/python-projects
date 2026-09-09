"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Globe, Type, Wifi, Contact, Mail, MessageSquare, 
  Sparkles, Download, Copy, Check, Palette, 
  ShieldCheck, RefreshCw, BookmarkPlus 
} from 'lucide-react';
import { api, QRCodeCustomization } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface QRStudioProps {
  onSuccessSave?: () => void;
  onOpenAuth?: () => void;
}

export default function QRStudio({ onSuccessSave, onOpenAuth }: QRStudioProps) {
  const { isAuthenticated } = useAuth();

  // Mode: dynamic vs static
  const [isDynamic, setIsDynamic] = useState(true);
  const [qrType, setQrType] = useState<'URL' | 'TEXT' | 'WIFI' | 'VCARD' | 'EMAIL' | 'SMS'>('URL');
  const [name, setName] = useState('My Promotional QR');

  // Input states
  const [url, setUrl] = useState('https://github.com');
  const [text, setText] = useState('Scan to discover exclusive updates.');
  const [wifiSsid, setWifiSsid] = useState('Office_Guest_5G');
  const [wifiPass, setWifiPass] = useState('SuperSecret2026');
  const [wifiEnc, setWifiEnc] = useState('WPA');
  const [vcardName, setVcardName] = useState('Alex Mercer');
  const [vcardPhone, setVcardPhone] = useState('+1 (555) 019-2834');
  const [vcardEmail, setVcardEmail] = useState('alex@enterprise.io');
  const [vcardOrg, setVcardOrg] = useState('Acme Corporation');
  const [emailTo, setEmailTo] = useState('support@company.com');
  const [emailSubject, setEmailSubject] = useState('Inquiry from QR Scan');
  const [smsPhone, setSmsPhone] = useState('+1 (555) 019-2834');
  const [smsMsg, setSmsMsg] = useState('Hello! I would like more information.');

  // Customization styling
  const [fgColor, setFgColor] = useState('#0f172a');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [scale, setScale] = useState(12);
  const [border, setBorder] = useState(2);
  const [errorCorrection, setErrorCorrection] = useState<'l' | 'm' | 'q' | 'h'>('h');

  // Preview & output
  const [previewSrc, setPreviewSrc] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedShortCode, setSavedShortCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Compute raw payload based on type
  const computePayload = useCallback(() => {
    switch (qrType) {
      case 'URL':
        return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
      case 'TEXT':
        return text;
      case 'WIFI':
        return `WIFI:T:${wifiEnc};S:${wifiSsid};P:${wifiPass};;`;
      case 'VCARD':
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${vcardName}\nORG:${vcardOrg}\nTEL:${vcardPhone}\nEMAIL:${vcardEmail}\nEND:VCARD`;
      case 'EMAIL':
        return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}`;
      case 'SMS':
        return `smsto:${smsPhone}:${smsMsg}`;
      default:
        return url;
    }
  }, [qrType, url, text, wifiSsid, wifiPass, wifiEnc, vcardName, vcardOrg, vcardPhone, vcardEmail, emailTo, emailSubject, smsPhone, smsMsg]);

  // Update preview
  useEffect(() => {
    let active = true;
    const payload = computePayload();
    const customization: QRCodeCustomization = {
      color: fgColor,
      bg_color: bgColor,
      scale,
      border,
      error_correction: errorCorrection,
    };

    const timer = setTimeout(() => {
      setIsGenerating(true);
      api.previewQR(payload, customization, 'svg')
        .then((svgDataUri) => {
          if (active) setPreviewSrc(svgDataUri);
        })
        .catch((err) => console.error('Preview failed', err))
        .finally(() => {
          if (active) setIsGenerating(false);
        });
    }, 60);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [computePayload, fgColor, bgColor, scale, border, errorCorrection]);

  // Handle Save
  const handleSaveToAccount = async () => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    const payload = computePayload();
    try {
      const created = await api.createQR({
        name,
        is_dynamic: isDynamic,
        qr_type: qrType,
        destination_url: isDynamic ? payload : undefined,
        raw_data: !isDynamic ? payload : undefined,
        customization: {
          color: fgColor,
          bg_color: bgColor,
          scale,
          border,
          error_correction: errorCorrection,
        },
      });

      setSavedShortCode(created.short_code || null);
      if (onSuccessSave) onSuccessSave();
    } catch (err: unknown) {
      console.error(err);
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const res = (err as { response?: { data?: { detail?: string } } }).response;
        alert('Failed to save QR code: ' + (res?.data?.detail || 'Unknown error'));
      } else {
        alert('Failed to save QR code');
      }
    }
  };

  // Download SVG
  const handleDownloadSVG = () => {
    const payload = computePayload();
    const customization: QRCodeCustomization = {
      color: fgColor,
      bg_color: bgColor,
      scale,
      border,
      error_correction: errorCorrection,
    };

    api.previewQR(payload, customization, 'svg').then((svgUri) => {
      const link = document.createElement('a');
      link.href = svgUri;
      link.download = `${name.toLowerCase().replace(/\s+/g, '_')}.svg`;
      link.click();
    });
  };

  // Download PNG
  const handleDownloadPNG = () => {
    const payload = computePayload();
    const customization: QRCodeCustomization = {
      color: fgColor,
      bg_color: bgColor,
      scale,
      border,
      error_correction: errorCorrection,
    };

    api.previewQR(payload, customization, 'png').then((pngUri) => {
      const link = document.createElement('a');
      link.href = pngUri;
      link.download = `${name.toLowerCase().replace(/\s+/g, '_')}.png`;
      link.click();
    });
  };

  const handleCopyLink = () => {
    if (!savedShortCode) return;
    const link = api.getRedirectUrl(savedShortCode);
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const typeOptions = [
    { id: 'URL', label: 'Website URL', icon: Globe },
    { id: 'TEXT', label: 'Plain Text', icon: Type },
    { id: 'WIFI', label: 'Wi-Fi Network', icon: Wifi },
    { id: 'VCARD', label: 'Contact Card', icon: Contact },
    { id: 'EMAIL', label: 'Email', icon: Mail },
    { id: 'SMS', label: 'SMS Text', icon: MessageSquare },
  ] as const;

  const colorPresets = [
    { name: 'Slate Dark', hex: '#0f172a' },
    { name: 'Indigo Core', hex: '#4f46e5' },
    { name: 'Emerald Pro', hex: '#059669' },
    { name: 'Royal Blue', hex: '#2563eb' },
    { name: 'Ruby Crimson', hex: '#e11d48' },
    { name: 'Sunset Violet', hex: '#7c3aed' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Commercial-Grade Vector Generator</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight sm:text-4xl">
            QR Studio & Visual Customizer
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Design dynamic, trackable QR codes in real time. Update destination URLs after printing, customize brand colors, and export razor-sharp SVGs or PNGs.
          </p>
        </div>

        {/* Dynamic vs Static Switcher */}
        <div className="bg-slate-900 border border-slate-800 p-1 rounded-2xl flex items-center shadow-lg self-start md:self-auto">
          <button
            type="button"
            onClick={() => setIsDynamic(true)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isDynamic
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Dynamic QR (Trackable)</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDynamic(false)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              !isDynamic
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Static QR (Offline)</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form & Styling */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Type Selector */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Step 1: Select QR Data Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {typeOptions.map((t) => {
                const Icon = t.icon;
                const isSel = qrType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setQrType(t.id)}
                    className={`flex items-center space-x-2.5 p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      isSel
                        ? 'bg-indigo-600/15 border-indigo-500/60 text-indigo-300 shadow-sm shadow-indigo-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSel ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Content Inputs */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Step 2: Enter Content Details
            </label>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">QR Code Name / Label</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Summer Promo Card"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Type Specific Fields */}
            {qrType === 'URL' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Destination URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://yourbrand.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {isDynamic && (
                  <p className="text-[11px] text-indigo-400/90 mt-1 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Dynamic tracking enabled: change this URL anytime without reprinting.</span>
                  </p>
                )}
              </div>
            )}

            {qrType === 'TEXT' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Plain Text Content</label>
                <textarea
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter message or serial number..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {qrType === 'WIFI' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Network SSID</label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                  <input
                    type="text"
                    value={wifiPass}
                    onChange={(e) => setWifiPass(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">Security Type</label>
                  <select
                    value={wifiEnc}
                    onChange={(e) => setWifiEnc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="WPA">WPA / WPA2 (Default)</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">None (Open Network)</option>
                  </select>
                </div>
              </div>
            )}

            {qrType === 'VCARD' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={vcardName}
                    onChange={(e) => setVcardName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={vcardOrg}
                    onChange={(e) => setVcardOrg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={vcardPhone}
                    onChange={(e) => setVcardPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={vcardEmail}
                    onChange={(e) => setVcardEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {qrType === 'EMAIL' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Recipient Email</label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {qrType === 'SMS' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Recipient Phone Number</label>
                  <input
                    type="tel"
                    value={smsPhone}
                    onChange={(e) => setSmsPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Pre-filled Message</label>
                  <textarea
                    rows={2}
                    value={smsMsg}
                    onChange={(e) => setSmsMsg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Visual Styling & Parameters */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Palette className="w-4 h-4 text-indigo-400" />
              <span>Step 3: Brand Styling & Colors</span>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Foreground Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-9 h-9 rounded-xl border border-slate-700 bg-transparent cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-24 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 uppercase"
                  />
                </div>
                {/* Swatches */}
                <div className="flex items-center space-x-1.5 mt-2">
                  {colorPresets.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      title={c.name}
                      onClick={() => setFgColor(c.hex)}
                      className={`w-5 h-5 rounded-full border transition-transform ${
                        fgColor.toLowerCase() === c.hex.toLowerCase() ? 'scale-125 border-white' : 'border-slate-700 hover:scale-110'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Background Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-9 h-9 rounded-xl border border-slate-700 bg-transparent cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-24 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 uppercase"
                  />
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setBgColor('#ffffff')}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    White
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgColor('#f8fafc')}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Off-white
                  </button>
                </div>
              </div>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Scale / Pixel Density</span>
                  <span className="font-mono text-indigo-400">{scale}x</span>
                </div>
                <input
                  type="range"
                  min={6}
                  max={24}
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Quiet Zone Margin</span>
                  <span className="font-mono text-indigo-400">{border}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={6}
                  value={border}
                  onChange={(e) => setBorder(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>

            {/* Error correction */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Error Correction Resilience (Damage Recovery)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { level: 'l', label: 'L (7%)' },
                  { level: 'm', label: 'M (15%)' },
                  { level: 'q', label: 'Q (25%)' },
                  { level: 'h', label: 'H (30%)' },
                ].map((ec) => (
                  <button
                    key={ec.level}
                    type="button"
                    onClick={() => setErrorCorrection(ec.level as 'l' | 'm' | 'q' | 'h')}
                    className={`py-1.5 rounded-lg border text-center text-[11px] font-semibold transition-all ${
                      errorCorrection === ec.level
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ec.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Live Preview Card */}
        <div className="lg:col-span-5 sticky top-24 space-y-6">
          <div className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
            {/* Header / Badges */}
            <div className="w-full flex items-center justify-between mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Live Output Preview
              </span>
              <div className="flex items-center space-x-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isDynamic
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {isDynamic ? 'DYNAMIC' : 'STATIC'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                  {qrType}
                </span>
              </div>
            </div>

            {/* QR Canvas Box */}
            <div 
              className="relative p-6 rounded-2xl shadow-inner border flex items-center justify-center transition-all duration-300"
              style={{ backgroundColor: bgColor, borderColor: '#334155' }}
            >
              {previewSrc ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewSrc}
                  alt="QR Code Preview"
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain transition-opacity duration-200"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center text-slate-500">
                  <span>Rendering preview...</span>
                </div>
              )}

              {isGenerating && (
                <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px] flex items-center justify-center rounded-2xl">
                  <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                </div>
              )}
            </div>

            {/* Label Under QR */}
            <div className="text-center mt-4 mb-6">
              <h3 className="text-base font-bold text-white tracking-tight">{name}</h3>
              <p className="text-xs text-slate-400 font-mono truncate max-w-xs mt-0.5">
                {computePayload()}
              </p>
            </div>

            {/* Actions Grid */}
            <div className="w-full space-y-3">
              {/* Save to Account */}
              <button
                type="button"
                onClick={handleSaveToAccount}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <BookmarkPlus className="w-4 h-4" />
                <span>{isAuthenticated ? 'Save & Start Tracking' : 'Sign In to Track & Save'}</span>
              </button>

              {/* Download buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadSVG}
                  className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download SVG</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPNG}
                  className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PNG</span>
                </button>
              </div>

              {/* Dynamic QR link banner if saved */}
              {savedShortCode && (
                <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold">
                    <span>Active Tracking Link</span>
                    <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded">ONLINE</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950/80 rounded-lg p-2 border border-slate-800">
                    <span className="text-xs font-mono text-slate-300 truncate">
                      {api.getRedirectUrl(savedShortCode)}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
